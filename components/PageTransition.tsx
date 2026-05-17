"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

import {
  motionTransition,
  pageTransitionVariants,
} from "../lib/motion";

export default function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={motionTransition.page}
      className={className}
    >
      {children}
    </motion.div>
  );
}
