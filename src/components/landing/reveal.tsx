"use client";

import { CSSProperties, ElementType, ReactNode, useEffect, useRef, useState } from "react";

/**
 * Fades its content up once, the first time it scrolls into view. The
 * transition itself is CSS (see [data-reveal] in globals.css); this only
 * flips the attribute. Reduced motion keeps the fade and drops the movement.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className,
  children,
  id,
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      data-reveal={shown ? "shown" : "hidden"}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
