"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function GsapHomeIntro({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const items = gsap.utils.toArray<HTMLElement>("[data-home-reveal]", root);
      if (!items.length) return;

      gsap.set(items, { autoAlpha: 0, y: reduceMotion ? 0 : isMobile ? 14 : 22 });

      const timeline = gsap.timeline({
        defaults: {
          ease: "power2.out",
          overwrite: "auto",
        },
      });

      timeline.to(items, {
        autoAlpha: 1,
        y: 0,
        duration: reduceMotion ? 0.16 : isMobile ? 0.72 : 0.86,
        stagger: reduceMotion ? 0 : isMobile ? 0.06 : 0.1,
        clearProps: "visibility,opacity,transform",
      });

      return () => timeline.kill();
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
