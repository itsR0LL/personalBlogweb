"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Palette, Sun, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { motionTransition, motionVariants } from '../lib/motion';

export default function FloatingThemePanel() {
  const { isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const modeLabel = isDark ? '夜间模式' : '日间模式';
  const modeDescription = isDark ? '流萤飞舞的深空' : '落樱漫舞的清晨';
  const nextModeLabel = isDark ? '切换到日间' : '切换到夜间';
  const Icon = isDark ? Moon : Sun;

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[9999] flex flex-col items-start gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={motionVariants.popover}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={motionTransition.base}
            style={{ transformOrigin: 'bottom left' }}
            className="w-[calc(100vw-2rem)] max-w-[18rem] rounded-3xl bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl p-4 text-slate-800 dark:text-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  氛围控制台
                </p>
                <h2 className="mt-1 text-lg font-black tracking-tight">{modeLabel}</h2>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {modeDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="关闭氛围控制台"
                className="h-8 w-8 shrink-0 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="mt-4 w-full h-11 rounded-2xl bg-indigo-500 text-white text-sm font-black shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 active:scale-[0.98] transition-[transform,color,background-color] duration-[360ms] flex items-center justify-center gap-2"
            >
              {isDark ? <Sun size={18} strokeWidth={2.4} /> : <Moon size={18} strokeWidth={2.4} />}
              {nextModeLabel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? '收起氛围控制台' : '打开氛围控制台'}
        aria-expanded={isOpen}
        className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xl border border-white/50 dark:border-white/10 transition-[transform,color,background-color,border-color] duration-[360ms] hover:scale-[1.03] active:scale-95 ${
          isDark
            ? 'bg-slate-900/85 text-indigo-100 shadow-indigo-950/30'
            : 'bg-white/80 text-amber-500 shadow-amber-300/30'
        }`}
      >
        {isOpen ? <Palette size={22} strokeWidth={2.4} /> : <Icon size={22} strokeWidth={2.4} />}
      </button>
    </div>
  );
}
