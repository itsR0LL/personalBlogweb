"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../ThemeProvider";

type ThemePulse = {
  id: number;
  isDark: boolean;
};

export default function ThemeTransitionVeil() {
  const { isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const hasMounted = useRef(false);
  const [pulse, setPulse] = useState<ThemePulse | null>(null);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (reduceMotion) return;

    const nextPulse = { id: Date.now(), isDark };
    setPulse(nextPulse);

    const timer = window.setTimeout(() => {
      setPulse((current) => (current?.id === nextPulse.id ? null : current));
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isDark, reduceMotion]);

  return (
    <AnimatePresence>
      {pulse && (
        <motion.div
          key={pulse.id}
          data-theme-transition-veil
          aria-hidden="true"
          className="fixed inset-0 z-[9998] pointer-events-none"
          initial={{ opacity: 0, scale: 1.015 }}
          animate={{ opacity: [0, 1, 0], scale: [1.015, 1, 1] }}
          transition={{ duration: 0.86, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={() => {
            setPulse((current) => (current?.id === pulse.id ? null : current));
          }}
          style={{
            background: pulse.isDark
              ? "radial-gradient(circle at 50% 48%, rgba(99,102,241,0.24), rgba(15,23,42,0.34) 48%, rgba(15,23,42,0) 72%)"
              : "radial-gradient(circle at 50% 48%, rgba(253,224,71,0.2), rgba(255,255,255,0.36) 46%, rgba(255,255,255,0) 72%)",
          }}
        />
      )}
    </AnimatePresence>
  );
}
