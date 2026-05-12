"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { siteConfig } from '../siteConfig';

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { name: '首页', href: '/' },
    { name: '项目', href: '/projects' },
    { name: '归档', href: '/timeline' },
    { name: '照片墙', href: '/photowall' },
    { name: '音乐', href: '/music' },
    { name: '说说', href: '/moments' },
    { name: '杂谈', href: '/chatter' },
    { name: '友链', href: '/friends' },
    { name: '关于', href: '/about' },
  ];

  return (
    <>
      <header className={`hidden md:block w-full fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${showNav ? 'translate-y-0' : '-translate-y-full'} bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-sm`}>
        <div className="w-[90%] max-w-6xl mx-auto h-16 flex items-center justify-between px-4 sm:px-[30px] box-border">
          <Link href="/" className="text-xl font-black text-slate-800 dark:text-white tracking-tighter hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300">
            {siteConfig.navTitle || siteConfig.authorName}
            <span className="text-indigo-500 mx-1">{siteConfig.navSuffix || 'の'}</span>
            {siteConfig.navAfter || '宝藏之地'}
          </Link>
          <nav className="flex gap-8 text-sm font-bold">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname === `${link.href}/`;
              return (
                <Link key={link.href} href={link.href} className={`relative py-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600'}`}>
                  {link.name}
                  {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <header className={`md:hidden fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${showNav || isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-3 mt-3 h-14 rounded-2xl bg-white/65 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-xl flex items-center justify-between px-3">
          <Link
            href="/"
            className="min-w-0 flex items-center gap-2 text-slate-900 dark:text-white"
            aria-label="返回首页"
          >
            <span className="h-8 w-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center text-xs font-black shadow-md">
              {siteConfig.authorName?.slice(0, 1) || 'R'}
            </span>
            <span className="min-w-0 truncate text-sm font-black tracking-wide">
              {siteConfig.navTitle || siteConfig.authorName}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'}
            className="h-10 w-10 rounded-xl bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            {isMobileMenuOpen ? <X size={20} strokeWidth={2.6} /> : <Menu size={21} strokeWidth={2.6} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              aria-label="关闭导航菜单"
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 w-full h-full bg-slate-950/45 backdrop-blur-sm"
            />

            <motion.nav
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute left-3 right-3 top-20 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl p-3 max-h-[calc(100dvh-6rem)] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname === `${link.href}/`;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`min-h-12 rounded-xl px-4 flex items-center justify-between text-sm font-black transition-colors ${
                        isActive
                          ? 'bg-indigo-500 text-white shadow-md'
                          : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 active:bg-indigo-100 dark:active:bg-slate-700'
                      }`}
                    >
                      <span>{link.name}</span>
                      {isActive && <span className="h-2 w-2 rounded-full bg-white/90" />}
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
