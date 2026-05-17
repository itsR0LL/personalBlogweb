import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

// 🌟 核心升级：引入 Next.js 现代统一解析流
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import rehypeKatex from 'rehype-katex';
import { markdownSanitizeSchema } from '../../../lib/markdownSanitize';

// 🌟 引入神仙代码高亮主题（Atom One Dark）
import 'highlight.js/styles/atom-one-dark.css';

import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import BlogReveal from '../../../components/motion/BlogReveal';
import ClientSocials from '../../../components/ClientSocials';
import SidebarLyric from '../../../components/SidebarLyric';
import BackButton from '../../../components/BackButton';
import Comments from '../../../components/Comments';
import { getContentCollectionDir, getRuntimeSiteConfig } from '../../../lib/contentSource';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const chattersDirectory = getContentCollectionDir('chatters');
  if (!fs.existsSync(chattersDirectory)) return [];
  const filenames = fs.readdirSync(chattersDirectory);
  return filenames
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({
      slug: name.replace(/\.md$/, ''),
    }));
}

async function getChatterData(slug: string) {
  const runtimeConfig = getRuntimeSiteConfig();
  const fullPath = path.join(getContentCollectionDir('chatters'), `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // 🌟 启用全新解析引擎：支持自动识别代码语言，并进行绚丽的语法高亮
  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, markdownSanitizeSchema)
    // @ts-expect-error rehype-highlight accepts this runtime option, but its unified overload is narrow.
    .use(rehypeHighlight, { ignoreMissing: true })
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(content);

  return {
    slug,
    contentHtml: processedContent.toString(),
    title: data.title || '碎片记录',
    date: data.date,
    mood: data.mood,
    tags: data.tags && Array.isArray(data.tags) ? data.tags : [],
    cover: data.cover || runtimeConfig.defaultPostCover
  };
}

function getRecentChatters(currentSlug: string) {
  const chattersDirectory = getContentCollectionDir('chatters');
  let fileNames: string[] = [];
  try { fileNames = fs.readdirSync(chattersDirectory).filter(f => f.endsWith('.md')); } catch(e) {}
  if (!fileNames) return [];

  return fileNames.map(f => {
    const s = f.replace(/\.md$/, '');
    const c = fs.readFileSync(path.join(chattersDirectory, f), 'utf8');
    const { data } = matter(c);
    return { slug: s, title: data.title || '碎片记录', date: data.date || '1970-01-01' };
  }).filter(p => p.slug !== currentSlug)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
}

function generateCalendarMatrix(year: number, month: number, targetDay: number) {
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const days = [];
  for (let i = 0; i < startDay; i++) { days.push(null); }
  for (let i = 1; i <= daysInMonth; i++) { days.push(i); }
  return { days, targetDay };
}

export default async function ChatterDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const runtimeConfig = getRuntimeSiteConfig();
  const chatterData = await getChatterData(resolvedParams.slug);
  const recentChatters = getRecentChatters(resolvedParams.slug);

  const dateObj = new Date(chatterData.date || '2026-03-24');
  const yearStr = dateObj.getFullYear();
  const monthNum = dateObj.getMonth() + 1;
  const dayNum = dateObj.getDate();

  const { days: calendarDays } = generateCalendarMatrix(yearStr, monthNum, dayNum);
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />

      <PageTransition>
        {/* 🌟 核心修改：缩紧手机端的主容器宽度和间距 */}
        <BlogReveal as="main" preset="article" className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 flex flex-col lg:flex-row gap-6 md:gap-8 relative z-10">

          {/* 左侧主要内容区域 */}
          <article data-blog-reveal className="flex-1 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            {chatterData.cover && (
              <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 relative group">
                <img src={chatterData.cover} alt="封面" className="w-full h-full object-cover opacity-90 transition-transform duration-[1200ms] group-hover:scale-[1.035]" />
              </div>
            )}

            {/* 🌟 核心修改：缩小手机端的内边距 p-5 md:p-14 */}
            <div className="p-5 md:p-14 relative">
              <BackButton />

              <header className="mb-6 md:mb-10 border-b border-slate-300/30 dark:border-slate-700/50 pb-5 md:pb-8 relative">
                {/* 🌟 核心修改：标题大小自适应 text-2xl md:text-5xl */}
                <h1 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 md:mb-6 tracking-tight transition-colors duration-700 pr-16 md:pr-24 leading-snug md:leading-tight">
                  {chatterData.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {/* 🌟 核心修改：信息标签的字号和内边距响应式 */}
                  <div className="flex items-center gap-1.5 md:gap-2 text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-500/5 dark:bg-indigo-400/10 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl text-xs md:text-sm border border-indigo-500/10">
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {chatterData.date}
                  </div>

                  {chatterData.mood && (
                    <div className="flex items-center gap-1.5 md:gap-2 text-pink-600 dark:text-pink-400 font-black bg-pink-500/5 dark:bg-pink-400/10 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl text-xs md:text-sm border border-pink-500/10">
                      <Sparkles size={14} strokeWidth={2.5} />
                      心情：{chatterData.mood}
                    </div>
                  )}

                  {chatterData.tags.map((tag: string) => (
                    <div key={tag} className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold bg-slate-500/5 dark:bg-slate-400/10 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl text-xs md:text-sm border border-slate-500/10">
                      <span className="text-[10px] md:text-xs opacity-70">#</span> {tag}
                    </div>
                  ))}
                </div>
              </header>

              {/* 🌟 核心修复区：手机端与桌面端的双面排版引擎 */}
              <div className="relative">
                <style>{`
                  /* 1. 默认状态（手机端：精致小巧） */
                  .prose h1 { font-size: 1.8rem !important; font-weight: 900 !important; margin-bottom: 1.2rem !important; margin-top: 2rem !important; line-height: 1.3 !important; color: inherit !important; }
                  .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; margin-top: 1.5rem !important; color: inherit !important; }
                  .prose h3 { font-size: 1.2rem !important; font-weight: 700 !important; margin-bottom: 0.8rem !important; color: inherit !important; }
                  .prose p { font-size: 0.95rem !important; line-height: 1.75 !important; color: inherit !important; }
                  .prose ul, .prose ol { padding-left: 1.2rem !important; font-size: 0.95rem !important; }
                  
                  /* 手机端代码块与图片调整 */
                  .prose pre {
                    background-color: #282c34 !important; color: #abb2bf !important;
                    padding: 1rem !important; border-radius: 0.75rem !important;
                    overflow-x: auto !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important;
                    margin-top: 1rem !important; margin-bottom: 1rem !important;
                  }
                  .prose pre code { background-color: transparent !important; padding: 0 !important; color: inherit !important; font-size: 0.85em !important; font-family: ui-monospace, SFMono-Regular, monospace !important; }
                  .prose code::before, .prose code::after { content: none !important; }
                  .prose p code, .prose li code { background-color: rgba(99, 102, 241, 0.1) !important; color: #6366f1 !important; padding: 0.1rem 0.3rem !important; border-radius: 0.25rem !important; font-weight: 600 !important; font-size: 0.85em !important; }
                  .dark .prose p code, .dark .prose li code { background-color: rgba(99, 102, 241, 0.2) !important; color: #818cf8 !important; }
                  .prose img { display: block !important; margin: 1.5rem auto !important; border-radius: 1rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; max-width: 100% !important; height: auto !important; }

                  /* 2. 平板与桌面端状态（md >= 768px：霸气极客风回归！） */
                  @media (min-width: 768px) {
                    .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; }
                    .prose h2 { font-size: 2.2rem !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; }
                    .prose h3 { font-size: 1.5rem !important; margin-bottom: 1rem !important; }
                    .prose p { font-size: 1.15rem !important; line-height: 1.85 !important; }
                    .prose ul, .prose ol { padding-left: 1.5rem !important; font-size: 1.1rem !important; }
                    .prose pre { padding: 1.25rem !important; margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
                    .prose pre code { font-size: 0.9em !important; }
                    .prose p code, .prose li code { padding: 0.2rem 0.4rem !important; font-size: 0.9em !important; border-radius: 0.375rem !important;}
                    .prose img { margin: 2rem auto !important; border-radius: 2rem !important; box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important; }
                  }
                `}</style>

                {/* 🌟 核心修改：使用 prose-base 作为手机端基准，md:prose-lg 放给桌面端 */}
                <div
                  className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 font-serif transition-colors duration-700 leading-relaxed scroll-smooth"
                  dangerouslySetInnerHTML={{ __html: chatterData.contentHtml }}
                />
              </div>

              {/* 👇 评论区 */}
              <div className="mt-10 md:mt-12">
                <Comments />
              </div>

            </div>
          </article>

          {/* 右侧边栏区域 */}
          <aside data-blog-reveal className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl text-center">
              <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md mb-4 hover:rotate-3 transition-transform">
                <img src={runtimeConfig.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover bg-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{runtimeConfig.authorName}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4">{runtimeConfig.bio}</p>
              <ClientSocials />
            </div>

            <SidebarLyric />

            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-wider">{yearStr}年{monthNum}月</h3>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                {weekDays.map(day => <div key={day} className="text-[10px] font-black text-slate-400 uppercase">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                {calendarDays.map((day, index) => (
                  <div key={index} className="flex justify-center items-center">
                    {day ? (
                      <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300
                        ${day === dayNum ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-110' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700'}`}>
                        {day}
                      </div>
                    ) : <div className="w-8 h-8"></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
              <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-xs tracking-widest uppercase">近期记录</h3>
              <div className="space-y-4">
                {recentChatters.map(p => (
                  <Link key={p.slug} href={`/chatter/${p.slug}`} className="group block">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{p.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase">{p.date}</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </BlogReveal>
      </PageTransition>
    </div>
  );
}
