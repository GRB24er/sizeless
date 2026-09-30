import Image from "next/image";
import { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./primitives";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

/**
 * Opening section for the inner client-facing pages. The right column holds
 * either a photo (`image`) or any other element (`aside`), such as an example.
 */
export function PageHero({
  title,
  intro,
  image,
  imageAlt = "",
  imagePosition = "center",
  aside,
  children,
}: {
  title: ReactNode;
  intro?: ReactNode;
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  const hasSide = Boolean(image || aside);
  return (
    <section className="bg-canvas pb-12 pt-[calc(var(--header-h)+2.5rem)] sm:pb-16 sm:pt-[calc(var(--header-h)+4rem)]">
      <Container className={cn("grid gap-10 lg:gap-12", hasSide && "lg:grid-cols-12 lg:items-center")}>
        <div className={cn(hasSide ? "lg:col-span-7" : "max-w-3xl")}>
          <h1 className="animate-rise type-display text-balance text-[2.4rem] font-semibold leading-[1.04] text-ink sm:text-[3.25rem]">
            {title}
          </h1>
          {intro && (
            <p className="animate-rise mt-5 max-w-[40rem] text-pretty text-lg leading-relaxed text-ink-2" style={delay(80)}>
              {intro}
            </p>
          )}
          {children && (
            <div className="animate-rise" style={delay(160)}>
              {children}
            </div>
          )}
        </div>

        {image && (
          <div className="lg:col-span-5">
            <div className="animate-unveil relative aspect-[4/3] overflow-hidden rounded-xl bg-tint" style={delay(60)}>
              <Image
                src={image}
                alt={imageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 480px, 100vw"
                className="animate-settle object-cover"
                style={{ objectPosition: imagePosition }}
              />
            </div>
          </div>
        )}
        {!image && aside && (
          <div className="animate-rise lg:col-span-5" style={delay(200)}>
            {aside}
          </div>
        )}
      </Container>
    </section>
  );
}
