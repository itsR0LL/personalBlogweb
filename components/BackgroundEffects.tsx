"use client";
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import Fireflies from './Fireflies';
import Sakura from './Sakura';
import WindyGrass from './WindyGrass';

export default function BackgroundEffects() {
  const { isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isMounted && reduceMotion) return null;

  return (
    <div data-ambient-motion="true">
      {/* 核心魔法：根据 isDark 切换特效组件 */}
      <div className={`transition-opacity duration-[900ms] ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <Fireflies />
      </div>
      <div className={`transition-opacity duration-[900ms] ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <Sakura />
      </div>

      {/* 草地一直存在，但它内部会自动改变颜色 */}
      <WindyGrass />
    </div>
  );
}
