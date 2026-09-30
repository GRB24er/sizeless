import Image from "next/image";
import Link from "next/link";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Header lockup: the container-and-shield emblem from the logo, set next to
 * the company name. `tone="light"` turns the single-tone emblem white for
 * dark backgrounds. Extra props are forwarded so it can sit inside
 * `asChild` components such as the dashboard sidebar button.
 */
export const Logo = ({
  tone = "dark",
  className,
  ...props
}: { tone?: "dark" | "light" } & Omit<ComponentProps<typeof Link>, "href">) => (
  <Link
    href="/"
    aria-label="Aegis Cargo home"
    className={cn("inline-flex shrink-0 items-center gap-2.5", className)}
    {...props}
  >
    <Image
      src="/images/logo-mark.png"
      alt=""
      width={222}
      height={184}
      priority
      className={cn("h-7 w-auto", tone === "light" && "brightness-0 invert")}
    />
    <span
      className={cn(
        "type-display text-[17px] font-semibold leading-none",
        tone === "light" ? "text-white" : "text-ink"
      )}
    >
      Aegis Cargo
    </span>
  </Link>
);
