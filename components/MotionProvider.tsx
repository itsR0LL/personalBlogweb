"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

import { motionTransition } from "../lib/motion";

export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user" transition={motionTransition.base}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

