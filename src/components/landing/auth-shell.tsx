import Image from "next/image";
import Link from "next/link";
import { CSSProperties, ReactNode } from "react";
import { Logo } from "@/components/logo";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

/** Sign-in and registration layout: the form on the left, a photo filling the right half on large screens. */
export function AuthShell({
  title,
  intro,
  image,
  imageAlt,
  imagePosition = "center",
  footer,
  children,
}: {
  title: string;
  intro: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[100dvh] bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-14">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="animate-rise type-display text-[2rem] font-semibold leading-tight text-ink">{title}</h1>
          <p className="animate-rise mt-2 text-[15px] leading-relaxed text-ink-2" style={delay(60)}>
            {intro}
          </p>
          <div className="animate-rise mt-8" style={delay(120)}>
            {children}
          </div>
          {footer && (
            <div className="animate-rise mt-8 border-t border-line pt-6 text-sm text-ink-2" style={delay(180)}>
              {footer}
            </div>
          )}
        </div>
        <p className="text-[13px] text-ink-3">
          &copy; {new Date().getFullYear()} Aegis Cargo.{" "}
          <Link href="/terms" className="underline decoration-line-2 underline-offset-4 hover:text-ink">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline decoration-line-2 underline-offset-4 hover:text-ink">
            privacy
          </Link>
          .
        </p>
      </div>

      <div className="relative hidden p-3 lg:block">
        <div className="animate-unveil relative h-full overflow-hidden rounded-xl bg-tint">
          <Image src={image} alt={imageAlt} fill priority sizes="50vw" className="animate-settle object-cover" style={{ objectPosition: imagePosition }} />
        </div>
      </div>
    </div>
  );
}
