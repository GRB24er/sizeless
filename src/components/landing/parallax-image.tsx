"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { CSSProperties, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A photo that drifts gently against the page as it scrolls past, so large
 * images feel alive without moving on their own. Fills its positioned parent;
 * the picture is oversized by `travel` percent top and bottom so its edges
 * never show. Holds still with reduced motion: the CSS override keeps server
 * and client markup identical (choosing the style in JS would not hydrate).
 */
export function ParallaxImage({
  src,
  alt,
  sizes,
  priority,
  travel = 7,
  className,
  imageClassName,
  imageStyle,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Overscan, in percent of the frame height, on each edge. */
  travel?: number;
  className?: string;
  imageClassName?: string;
  imageStyle?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // The shift is a percentage of the oversized layer, so keep it inside the overscan.
  const shift = travel * 0.85;
  const y = useTransform(scrollYProgress, [0, 1], [`-${shift}%`, `${shift}%`]);

  return (
    <div ref={ref} className={cn("absolute inset-0 overflow-hidden", className)}>
      <motion.div
        className="absolute inset-x-0 motion-reduce:transform-none!"
        style={{ top: `-${travel}%`, bottom: `-${travel}%`, y }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imageClassName)}
          style={imageStyle}
        />
      </motion.div>
    </div>
  );
}
