"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type FilmChapter = {
  /** Short name for the chapter bar. */
  label: string;
  /** Still frame shown before the film is ready, and instead of it with reduced motion. */
  still: string;
  stillAlt: string;
  title: string;
  body: string;
  card?: { label: string; value: string; note?: string };
  actions?: ReactNode;
};

/**
 * Scroll-driven film: a full-screen stage stays pinned while the visitor
 * scrolls, and the scroll position drives the film's playhead, so the camera
 * moves with the page. Each chapter's headline and fact card fade in over the
 * footage. The film is fetched whole after first paint (seeking a fully local
 * file is instant); until then, and permanently with reduced motion or
 * Save-Data, the chapter stills crossfade instead.
 */
export function ScrollFilm({
  chapters,
  film,
  filmSmall,
  /** Film time (seconds) at the start of each chapter, plus the film's end. */
  timeline,
  id = "film",
}: {
  chapters: FilmChapter[];
  film: string;
  /** Served to viewports up to 767px wide. */
  filmSmall?: string;
  timeline: number[];
  id?: string;
}) {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<"stills" | "film">("stills");
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const count = chapters.length;

  // Fetch the film whole, then switch from stills to film.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const el = video.current;
    if (reduce || saveData || !el) return;
    const small = filmSmall && window.matchMedia("(max-width: 767px)").matches;
    const controller = new AbortController();
    let url = "";
    fetch(small ? filmSmall : film, { signal: controller.signal })
      .then((res) => (res.ok ? res.blob() : Promise.reject(res.status)))
      .then((blob) => {
        url = URL.createObjectURL(blob);
        el.src = url;
        el.addEventListener(
          "loadeddata",
          () => {
            // Some mobile browsers only paint seeked frames after one play() call.
            el.play()
              .then(() => el.pause())
              .catch(() => {})
              .finally(() => setMode("film"));
          },
          { once: true }
        );
      })
      .catch(() => {});
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [film, filmSmall]);

  // Drive the playhead from scroll, eased so it glides like a camera move.
  useEffect(() => {
    const el = video.current;
    const root = section.current;
    if (mode !== "film" || !el || !root) return;
    const timeAt = (p: number) => {
      const x = Math.min(0.9999, Math.max(0, p)) * count;
      const i = Math.floor(x);
      return timeline[i] + (timeline[i + 1] - timeline[i]) * (x - i);
    };
    let shown = timeAt(scrollYProgress.get());
    let raf = 0;
    const tick = () => {
      const target = timeAt(scrollYProgress.get());
      shown += (target - shown) * 0.12;
      if (!el.seeking && Math.abs(el.currentTime - shown) > 1 / 60) el.currentTime = shown;
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      if (entry.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [mode, count, timeline, scrollYProgress]);

  const jumpTo = (i: number) => {
    const root = section.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const track = root.offsetHeight - window.innerHeight;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: top + track * ((i + 0.08) / count), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section
      ref={section}
      id={id}
      aria-label="Follow a consignment from sea to vault"
      className="relative bg-navy"
      style={{ height: `${count * 115 + 100}svh` }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Stills: the opening frame is the LCP image; later stills crossfade in by chapter. */}
        {chapters.map((c, i) => (
          <Still key={c.still} chapter={c} index={i} count={count} progress={scrollYProgress} />
        ))}

        <video
          ref={video}
          muted
          playsInline
          preload="none"
          aria-hidden
          tabIndex={-1}
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-[60%_center] transition-opacity duration-700 lg:object-center",
            mode === "film" ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Scrims: legibility for the header, the copy on the left, and the chapter bar. */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-navy/60 to-transparent" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/60 to-navy/10 lg:bg-gradient-to-r lg:from-navy/90 lg:via-navy/55 lg:via-45% lg:to-transparent"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-navy/70 to-transparent" />

        <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-5 pb-28 pt-[calc(var(--header-h)+2rem)] sm:px-8 sm:pb-32 lg:px-10">
          <div className="grid flex-1 items-end lg:grid-cols-12 lg:items-center">
            <div className="grid lg:col-span-7">
              {chapters.map((c, i) => (
                <ChapterCopy key={c.title} chapter={c} index={i} count={count} progress={scrollYProgress} />
              ))}
            </div>
            <div className="mt-6 hidden lg:col-span-4 lg:col-start-9 lg:mt-0 lg:grid lg:self-center">
              {chapters.map((c, i) =>
                c.card ? <FactCard key={c.card.label} card={c.card} index={i} count={count} progress={scrollYProgress} /> : null
              )}
            </div>
          </div>
        </div>

        <ChapterBar chapters={chapters} progress={scrollYProgress} onJump={jumpTo} />
        <ScrollCue progress={scrollYProgress} />
      </div>
    </section>
  );
}

// ─── Pieces ─────────────────────────────────────────────────────────────

type Piece = { index: number; count: number; progress: MotionValue<number> };

function Still({ chapter, index, count, progress }: Piece & { chapter: FilmChapter }) {
  const start = index / count;
  const opacity = useTransform(progress, [start - 0.035, start + 0.01], index === 0 ? [1, 1] : [0, 1]);
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <Image
        src={chapter.still}
        alt={chapter.stillAlt}
        fill
        priority={index === 0}
        sizes="100vw"
        className="object-cover object-[60%_center] lg:object-center"
      />
    </motion.div>
  );
}

/** Opacity and lift for a chapter's overlay: in shortly after it starts, out shortly before it ends. */
function useChapterPresence({ index, count, progress }: Piece) {
  const start = index / count;
  const end = (index + 1) / count;
  const first = index === 0;
  const last = index === count - 1;
  const opacity = useTransform(
    progress,
    [start + 0.015, start + 0.06, end - 0.06, end - 0.02],
    [first ? 1 : 0, 1, 1, last ? 1 : 0]
  );
  const y = useTransform(
    progress,
    [start + 0.015, start + 0.06, end - 0.06, end - 0.02],
    [first ? 0 : 28, 0, 0, last ? 0 : -28]
  );
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
  return { opacity, y, visibility };
}

function ChapterCopy({ chapter, ...piece }: Piece & { chapter: FilmChapter }) {
  const { opacity, y, visibility } = useChapterPresence(piece);
  const Heading = piece.index === 0 ? "h1" : "h2";
  return (
    <motion.div className="[grid-area:1/1] max-w-[40rem]" style={{ opacity, y, visibility }}>
      <Heading className="type-display text-balance text-[2.5rem] font-semibold leading-[1.02] text-white sm:text-[3.4rem] lg:text-[4.25rem]">
        {chapter.title}
      </Heading>
      <p className="mt-5 max-w-[34rem] text-pretty text-[17px] leading-relaxed text-white/85 [text-shadow:0_1px_14px_rgba(15,29,47,0.55)] sm:text-lg">
        {chapter.body}
      </p>
      {chapter.card && (
        <p className="mt-5 text-[15px] text-white/80 lg:hidden">
          <span className="figures text-white">{chapter.card.value}</span> {chapter.card.label.toLowerCase()}
        </p>
      )}
      {chapter.actions && <div className="mt-8 flex flex-wrap gap-3">{chapter.actions}</div>}
    </motion.div>
  );
}

function FactCard({ card, ...piece }: Piece & { card: NonNullable<FilmChapter["card"]> }) {
  const { opacity, y, visibility } = useChapterPresence(piece);
  return (
    <motion.div
      className="[grid-area:1/1] rounded-xl bg-white/10 p-6 text-white ring-1 ring-white/20 backdrop-blur-md"
      style={{ opacity, y, visibility }}
    >
      <p className="text-[13px] text-white/70">{card.label}</p>
      <p className="figures mt-2 text-[2.25rem] leading-none">{card.value}</p>
      {card.note && <p className="mt-3 text-[14px] leading-relaxed text-white/75">{card.note}</p>}
    </motion.div>
  );
}

function ChapterBar({
  chapters,
  progress,
  onJump,
}: {
  chapters: FilmChapter[];
  progress: MotionValue<number>;
  onJump: (i: number) => void;
}) {
  return (
    <nav aria-label="Film chapters" className="absolute inset-x-0 bottom-0">
      <ol className="mx-auto grid w-full max-w-7xl grid-cols-4 gap-3 px-5 pb-6 sm:gap-6 sm:px-8 sm:pb-8 lg:px-10">
        {chapters.map((c, i) => (
          <ChapterTick key={c.label} label={c.label} index={i} count={chapters.length} progress={progress} onJump={onJump} />
        ))}
      </ol>
    </nav>
  );
}

function ChapterTick({ label, onJump, ...piece }: Piece & { label: string; onJump: (i: number) => void }) {
  const { index, count, progress } = piece;
  const fill = useTransform(progress, [index / count, (index + 1) / count], [0, 1], { clamp: true });
  const color = useTransform(progress, (p) =>
    p >= index / count - 0.001 && p < (index + 1) / count ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.6)"
  );
  return (
    <li>
      <button
        type="button"
        onClick={() => onJump(index)}
        className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <motion.span className="hidden pb-2.5 text-[13px] font-medium sm:block" style={{ color }}>
          {label}
        </motion.span>
        <span className="sr-only sm:hidden">{label}</span>
        <span className="relative block h-0.5 overflow-hidden rounded-full bg-white/20">
          <motion.span className="absolute inset-0 origin-left bg-signal" style={{ scaleX: fill }} />
        </span>
      </button>
    </li>
  );
}

function ScrollCue({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.03], [1, 0]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute bottom-24 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[12px] text-white/70 sm:flex"
      style={{ opacity }}
    >
      Scroll
      <span className="relative block h-8 w-px overflow-hidden bg-white/25">
        <span className="animate-scroll-cue absolute inset-x-0 top-0 h-3 bg-white" />
      </span>
    </motion.div>
  );
}
