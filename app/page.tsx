import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import SearchBar from '../components/SearchBar';
import { siteConfig } from '../siteConfig';
import CloudPlayer from '../components/CloudPlayer';
import ThemeToggleBlock from '../components/ThemeToggleBlock';
import ProfileCard from '../components/ProfileCard';
import SiteDashboard from '../components/SiteDashboard';
import { albums } from '../data/albums';
import LyricBar from '../components/LyricBar';
import { ToastProvider } from '../components/ToastProvider';

import LatestPostsCarousel from '../components/LatestPostsCarousel';
import LatestChatterCarousel from '../components/LatestChatterCarousel';

function formatUpdateTime(dateString: string) {
  if (!dateString || dateString === '1970-01-01') return '刚刚更新';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    if (hours === '00' && mins === '00') return `${year}.${month}.${day}`;
    return `${year}.${month}.${day} ${hours}:${mins}`;
  } catch { return dateString; }
}

function HomeHero({
  featuredPost,
  latestAlbum,
  postCount,
  chatterCount,
  photoCount,
}: {
  featuredPost: any;
  latestAlbum: any;
  postCount: number;
  chatterCount: number;
  photoCount: number;
}) {
  const heroCover = featuredPost?.cover || siteConfig.defaultPostCover;
  const heroHref = featuredPost?.slug && featuredPost.slug !== 'none' ? `/posts/${featuredPost.slug}` : '/timeline';

  return (
    <section className="anime-hero relative overflow-hidden rounded-[28px] sm:rounded-[34px] border border-white/50 dark:border-white/10 bg-white/45 dark:bg-slate-900/55 shadow-2xl backdrop-blur-2xl min-h-[520px] sm:min-h-[500px] lg:min-h-[460px]">
      <img
        src={heroCover}
        alt={featuredPost?.title || siteConfig.title}
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(244,114,182,0.34),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(34,211,238,0.24),transparent_26%),linear-gradient(115deg,rgba(15,23,42,0.95)_0%,rgba(30,41,59,0.72)_46%,rgba(88,28,135,0.28)_100%)]" />
      <div className="anime-grid-overlay absolute inset-0 opacity-35" />

      <div className="absolute left-5 top-5 hidden h-16 w-16 rotate-12 rounded-[22px] border border-pink-200/60 bg-pink-300/20 blur-[1px] sm:block" />
      <div className="absolute bottom-8 right-8 hidden h-24 w-24 rounded-full border border-cyan-200/40 bg-cyan-300/10 blur-[2px] lg:block" />

      <div className="relative z-10 grid min-h-[inherit] grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
        <div className="flex h-full flex-col justify-end lg:justify-center">
          <div className="mb-4 flex w-max max-w-full items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-pink-100 shadow-lg backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-pink-300 shadow-[0_0_14px_rgba(244,114,182,0.9)]" />
            Anime Blog Mode
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-tight text-white drop-shadow-2xl sm:text-5xl lg:text-6xl">
            {siteConfig.navTitle || siteConfig.authorName}
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/82 sm:text-base">
            {siteConfig.bio}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={heroHref}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-900 shadow-xl transition-transform active:scale-95 dark:bg-white dark:text-slate-950"
            >
              最新文章
            </Link>
            <Link
              href="/timeline"
              className="rounded-full border border-white/40 bg-white/15 px-5 py-2.5 text-sm font-black text-white shadow-xl backdrop-blur-md transition-transform active:scale-95"
            >
              归档时间线
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-md">
            <HeroStat value={postCount} label="Articles" />
            <HeroStat value={chatterCount} label="Notes" />
            <HeroStat value={photoCount} label="Frames" />
          </div>
        </div>

        <div className="flex flex-col justify-end gap-3 lg:justify-center">
          <Link
            href={heroHref}
            className="group rounded-3xl border border-white/30 bg-white/18 p-4 text-white shadow-xl backdrop-blur-xl transition-transform hover:-translate-y-1"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Now Reading</span>
            <h2 className="mt-2 line-clamp-2 text-xl font-black leading-snug">{featuredPost?.title || 'Latest Story'}</h2>
            <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-white/75">{featuredPost?.description}</p>
          </Link>

          <Link
            href="/photowall"
            className="group flex items-center gap-3 rounded-3xl border border-white/30 bg-slate-950/26 p-3 text-white shadow-xl backdrop-blur-xl transition-transform hover:-translate-y-1"
          >
            <img src={latestAlbum.cover} alt={latestAlbum.title} className="h-16 w-16 rounded-2xl object-cover shadow-lg" />
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-pink-200">Photo Wall</span>
              <h3 className="mt-1 truncate text-base font-black">{latestAlbum.title}</h3>
              <p className="line-clamp-1 text-xs font-medium text-white/70">{latestAlbum.description}</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/24 bg-white/14 px-3 py-3 text-center text-white shadow-lg backdrop-blur-md">
      <div className="text-2xl font-black leading-none">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/62">{label}</div>
    </div>
  );
}

export default function Home() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let allPosts: any[] = [];
  try {
    if (fs.existsSync(postsDirectory)) {
      const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md'));
      allPosts = fileNames.map(fileName => {
        const fullPath = path.join(postsDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        return {
          slug: fileName.replace(/\.md$/, ''),
          ...data,
          title: data.title || '',
          description: data.description || '',
          content: content || '',
          date: rawDate,
          formattedDate: formatUpdateTime(rawDate)
        };
      }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.slug.localeCompare(a.slug);
      });
    }
  } catch {}
  const top5Posts = allPosts.length > 0 ? allPosts.slice(0, 5) : [{ slug: 'none', title: '暂无文章', description: '快去写第一篇吧！', cover: siteConfig.defaultPostCover, date: '', formattedDate: '' }];

  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let allChatters: any[] = [];
  try {
    if (fs.existsSync(chattersDirectory)) {
      const chatterFiles = fs.readdirSync(chattersDirectory).filter(f => f.endsWith('.md'));
      allChatters = chatterFiles.map(fileName => {
        const fullPath = path.join(chattersDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        const cover = data.cover || siteConfig.fallbackChatterCover;
        return { slug: fileName.replace(/\.md$/, ''), title: data.title || '碎片记录', description: data.description || content.substring(0, 60), cover: cover, date: rawDate, formattedDate: formatUpdateTime(rawDate) };
      }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.slug.localeCompare(a.slug);
      });
    }
  } catch {}
  const top5Chatters = allChatters.length > 0 ? allChatters.slice(0, 5) : [{ slug: 'none', title: '暂无记录', description: '记录一段思绪...', cover: siteConfig.fallbackChatterCover, date: '', formattedDate: '' }];

  const chatterCount = allChatters.length;
  const realPhotoCount = albums.reduce((total, album) => total + album.photos.length, 0);
  const latestAlbum = albums.length > 0 ? albums[0] : { id: '', title: '照片墙', description: '查看摄影', cover: siteConfig.photoWallImage, date: '' };

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-10">
        <Navbar />
        <PageTransition>
          {/* 🌟 调整整体容器的内边距，适应手机端更小的屏幕 */}
          <div className="w-full max-w-6xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">
            <HomeHero
              featuredPost={top5Posts[0]}
              latestAlbum={latestAlbum}
              postCount={allPosts.length}
              chatterCount={chatterCount}
              photoCount={realPhotoCount}
            />

            <div className="relative z-20 mt-4 sm:-mt-8">
              <SearchBar posts={allPosts} />
            </div>

            <main className="flex flex-col gap-6 w-full mt-0">

              {/* 第一行：个人信息 + 播放器 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                {/* 手机上占满1列，电脑上占7列 */}
                <div className="col-span-1 lg:col-span-7 flex flex-col">
                    <ProfileCard postCount={allPosts.length} chatterCount={chatterCount} photoCount={realPhotoCount}/>
                </div>
                {/* 手机上占满1列，电脑上占5列 */}
                <div className="col-span-1 lg:col-span-5 flex flex-col">
                    <CloudPlayer/>
                </div>
              </div>

              {/* 歌词栏 */}
              <div className="w-full mt-[-10px]"><LyricBar/></div>

              {/* 第二行：文章轮播 + 照片墙 + 说说 + 主题切换 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

                {/* 左侧：文章轮播 (电脑端占4列，手机端排最上面) */}
                <div className="col-span-1 lg:col-span-4 flex flex-col min-h-[300px]">
                  <LatestPostsCarousel posts={top5Posts} />
                </div>

                {/* 右侧：组合面板 (电脑端占8列) */}
                <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">

                  {/* 照片墙大海报 */}
                  <Link href="/photowall" className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:scale-[1.02] relative group min-h-[200px] sm:min-h-[220px] flex-shrink-0">
                    <img src={latestAlbum.cover} alt={latestAlbum.title} className="w-full h-full absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"/>
                    <div className="absolute inset-0 bg-black/30 dark:bg-black/50 group-hover:bg-black/10 transition-colors duration-500"></div>
                    <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-6">
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 underline decoration-pink-400">{latestAlbum.title}</h3>
                      <p className="text-white/90 text-sm sm:text-lg line-clamp-1">{latestAlbum.description}</p>
                    </div>
                  </Link>

                  {/* 底层网格：说说轮播 + 主题切换器 */}
                  {/* 手机上单列，平板上分3列比例分布 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full flex-1">
                    <div className="sm:col-span-2 flex flex-col min-h-[200px]">
                      <LatestChatterCarousel chatters={top5Chatters} />
                    </div>
                    <div className="sm:col-span-1 flex flex-col min-h-[120px]">
                      <ThemeToggleBlock />
                    </div>
                  </div>

                </div>
              </div>

              {/* 底部数据面板 */}
              <div className="w-full mt-4"><SiteDashboard/></div>
            </main>
          </div>
        </PageTransition>
      </div>
    </ToastProvider>
  );
}
