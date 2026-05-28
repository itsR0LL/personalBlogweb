// components/LatestChatterCarousel.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function LatestChatterCarousel({ chatters }: { chatters: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (chatters.length <= 1 || reduceMotion || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % chatters.length);
    }, 7600);
    return () => clearInterval(timer);
  }, [chatters.length, reduceMotion, isPaused]);

  if (!chatters || chatters.length === 0) return null;

  const currentChatter = chatters[currentIndex];

  const holoVariants = {
    initial: { opacity: 0, scale: 0.98, filter: "blur(8px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.02, filter: "blur(8px)" },
  };

  return (
    // 🌟 注意这里：去掉了 md:col-span-8，变成一个纯粹填满父容器的组件
    <div
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      className="w-full h-full rounded-2xl sm:rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden relative group min-h-[180px] sm:min-h-[220px] flex flex-col max-w-full"
    >
      <Link href={currentChatter.slug === 'none' ? '/moments?type=essay' : `/chatter/${currentChatter.slug}`} className="absolute inset-0 z-20" aria-label={`查看随笔: ${currentChatter.title}`} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentChatter.slug}
          variants={holoVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: reduceMotion ? 0.16 : 0.96, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <img src={currentChatter.cover} className="w-full h-full object-cover opacity-80 dark:opacity-60 transition-transform duration-[1400ms] group-hover:scale-[1.035]" alt={currentChatter.title || '随笔封面'} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10"></div>
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex flex-col justify-center p-4 sm:p-6 md:p-8 h-full pointer-events-none w-full md:w-[85%]">
        <div className="flex flex-wrap items-end gap-2 mb-2">
          <span className="text-[10px] font-black text-indigo-400 tracking-widest bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10 shadow-sm">
            随笔记录
          </span>
          {currentChatter.formattedDate && (
            <span className="text-[11px] font-mono text-slate-300 drop-shadow-md">
              {currentChatter.formattedDate}
            </span>
          )}
        </div>

        <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors line-clamp-2 drop-shadow-md">
          {currentChatter.title}
        </h3>
        <p className="text-sm text-slate-300 font-medium leading-relaxed drop-shadow-md line-clamp-2">
          {currentChatter.description}
        </p>
      </div>

      {chatters.length > 1 && (
        <div className="absolute bottom-5 right-6 z-30 flex gap-2">
          {chatters.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i === currentIndex ? 'w-6 bg-indigo-400' : 'w-2 bg-white/40 hover:bg-white/80'}`}
              aria-label={`跳转`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
