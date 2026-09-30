import Image from "next/image";
import { ReactNode } from "react";
import { Container, Eyebrow } from "./primitives";

/** Compact navy header band for the inner client-facing pages. */
export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  image?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy pt-32 pb-16 sm:pt-40 sm:pb-20">
      {image && (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-30" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/50" />
        </>
      )}
      <Container>
        <div className="max-w-3xl">
          <Eyebrow tone="dark">{eyebrow}</Eyebrow>
          <h1 className="mt-6 font-display text-4xl font-medium leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">{intro}</p>}
          {children}
        </div>
      </Container>
    </section>
  );
}
