"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type BlogRevealPreset = "soft" | "list" | "timeline" | "gallery" | "music" | "article";

const revealPresets: Record<
  BlogRevealPreset,
  {
    duration: number;
    stagger: number;
    y: number;
    scale?: number;
    delay?: number;
    ease: string;
  }
> = {
  soft: { duration: 0.82, stagger: 0.09, y: 18, delay: 0.04, ease: "power2.out" },
  list: { duration: 0.78, stagger: 0.075, y: 18, delay: 0.04, ease: "power2.out" },
  timeline: { duration: 0.86, stagger: 0.1, y: 20, delay: 0.04, ease: "power2.out" },
  gallery: { duration: 0.88, stagger: 0.08, y: 24, delay: 0.02, ease: "power2.out" },
  music: { duration: 0.76, stagger: 0.1, y: 18, delay: 0.04, ease: "power2.out" },
  article: { duration: 0.72, stagger: 0.12, y: 14, delay: 0.04, ease: "power2.out" },
};

export default function BlogReveal({
  children,
  className,
  as = "div",
  preset = "soft",
  selector = "[data-blog-reveal]",
  refreshKey,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "main" | "section";
  preset?: BlogRevealPreset;
  selector?: string;
  refreshKey?: string | number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const Component = as;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const config = revealPresets[preset];
      const items = gsap.utils.toArray<HTMLElement>(selector, root);
      if (!items.length) return;

      gsap.set(items, {
        autoAlpha: 0,
        y: reduceMotion ? 0 : isMobile ? Math.min(config.y, 14) : config.y,
        scale: reduceMotion ? 1 : config.scale ?? 1,
      });

      const timeline = gsap.timeline({
        defaults: { ease: config.ease, overwrite: "auto" },
        delay: reduceMotion ? 0 : config.delay ?? 0,
      });

      timeline.to(items, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: reduceMotion ? 0.16 : isMobile ? Math.min(config.duration, 0.72) : config.duration,
        stagger: reduceMotion ? 0 : isMobile ? Math.min(config.stagger, 0.06) : config.stagger,
        clearProps: "visibility,opacity,transform",
      });

      return () => timeline.kill();
    },
    { scope: rootRef, dependencies: [refreshKey ?? preset], revertOnUpdate: true }
  );

  return (
    <Component ref={rootRef} className={className}>
      {children}
    </Component>
  );
}
