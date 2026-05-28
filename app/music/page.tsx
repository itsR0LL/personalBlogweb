"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Disc3,
  MessageSquare,
  Music2,
  Pause,
  Play,
  RefreshCcw,
  Repeat,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import Comments from '../../components/Comments';
import { LyricLine, MusicSong, useMusic } from '../../components/MusicProvider';

type MusicTab = 'lyrics' | 'playlist';

gsap.registerPlugin(useGSAP);

const fallbackCover = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop';

function formatTime(time: number) {
  if (!Number.isFinite(time) || time <= 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number) {
  if (lyrics.length === 0) return -1;

  let activeIndex = -1;
  for (let index = 0; index < lyrics.length; index += 1) {
    if (currentTime >= lyrics[index].time) activeIndex = index;
    else break;
  }

  return activeIndex;
}

export default function MusicPage() {
  const {
    playlist,
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    currentLyric,
    isLoading,
    loadError,
    skippedSongCount,
    togglePlay,
    nextSong,
    prevSong,
    handleSeek,
    seekToTime,
    playSong,
    playMode,
    togglePlayMode,
    volume,
    setVolume,
    isMuted,
    toggleMute,
  } = useMusic();

  const musicPageRef = useRef<HTMLDivElement>(null);
  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLButtonElement>(null);
  const hasPlayedEntrance = useRef(false);
  const [activeTab, setActiveTab] = useState<MusicTab>('lyrics');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const lyrics = useMemo(() => currentSong?.lyrics ?? [], [currentSong?.lyrics]);
  const activeLyricIndex = useMemo(() => getActiveLyricIndex(lyrics, currentTime), [lyrics, currentTime]);

  const filteredPlaylist = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return playlist;

    return playlist.filter((song) =>
      `${song.title} ${song.artist}`.toLowerCase().includes(query)
    );
  }, [playlist, searchQuery]);

  useEffect(() => {
    if (!activeLyricRef.current || !lyricContainerRef.current || activeTab !== 'lyrics') return;

    const container = lyricContainerRef.current;
    const activeItem = activeLyricRef.current;
    const scrollTarget = activeItem.offsetTop - container.offsetHeight / 2 + activeItem.offsetHeight / 2;
    container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }, [activeLyricIndex, activeTab]);

  useGSAP(
    () => {
      const root = musicPageRef.current;
      if (!root) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const panels = gsap.utils.toArray<HTMLElement>("[data-music-reveal]", root);
      if (!panels.length) return;

      const timeline = gsap.timeline({
        defaults: { ease: "power2.out", overwrite: "auto" },
        onComplete: () => {
          hasPlayedEntrance.current = true;
        },
      });

      timeline.from(panels, {
        autoAlpha: 0,
        y: reduceMotion ? 0 : 18,
        duration: reduceMotion ? 0.16 : 0.76,
        stagger: reduceMotion ? 0 : 0.1,
        clearProps: "visibility,opacity,transform",
      });
    },
    { scope: musicPageRef }
  );

  useGSAP(
    () => {
      const root = musicPageRef.current;
      if (!root || !currentSong || !hasPlayedEntrance.current) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const moodTargets = gsap.utils.toArray<HTMLElement>("[data-song-mood]", root);
      if (!moodTargets.length) return;

      gsap.fromTo(
        moodTargets,
        { autoAlpha: 0.68, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.99 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: reduceMotion ? 0.16 : 0.56,
          ease: "power2.out",
          stagger: reduceMotion ? 0 : 0.045,
          overwrite: "auto",
          clearProps: "visibility,opacity,transform",
        }
      );
    },
    { scope: musicPageRef, dependencies: [currentSong?.id ?? "empty"], revertOnUpdate: true }
  );

  const playModeIcon = useMemo(() => {
    if (playMode === 'single') return <RefreshCcw size={18} className="text-indigo-500" />;
    if (playMode === 'random') return <Shuffle size={18} className="text-slate-500 hover:text-indigo-500" />;
    return <Repeat size={18} className="text-slate-500 hover:text-indigo-500" />;
  }, [playMode]);

  const handlePlaylistClick = (song: MusicSong) => {
    const index = playlist.findIndex((item) => item.id === song.id);
    if (index >= 0) playSong(index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative pb-32 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Disc3 size={48} className="text-indigo-500 animate-spin" />
          <span className="font-black text-slate-500 tracking-widest text-sm">正在加载音乐...</span>
        </div>
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="min-h-screen relative pb-32 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <Music2 size={48} className="text-indigo-500" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">暂无可播放音乐</h1>
          <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
            {loadError || "当前歌单暂无可公开播放歌曲。请在本地管理端搜索并同步可公开播放的音乐。"}
          </p>
          {skippedSongCount > 0 && (
            <p className="text-xs font-bold text-slate-400">已跳过 {skippedSongCount} 首不可公开播放或加载失败的歌曲。</p>
          )}
        </div>
      </div>
    );
  }

  const songCover = currentSong.cover || fallbackCover;

  return (
    <div ref={musicPageRef} className="min-h-screen relative pb-10 flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-[-10%] bg-cover bg-center transition-all duration-1000 blur-[50px] opacity-40 dark:opacity-20 saturate-150"
          style={{ backgroundImage: `url(${songCover})` }}
        />
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm" />
      </div>

      <Navbar />

      <PageTransition>
        <main className="w-full max-w-7xl mx-auto mt-24 md:mt-28 px-4 sm:px-6 md:px-10 relative z-10">
          <header className="mb-6 md:mb-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-wide mb-2">
              云端乐律
            </h1>
            <p className="text-xs md:text-base text-slate-600 dark:text-slate-400 font-medium">
              在代码之外保留一段可播放的节奏。
            </p>
          </header>

          <section className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8 w-full md:items-stretch md:h-[calc(100vh-320px)] md:min-h-[600px] md:max-h-[720px]">
            <div data-music-reveal className="md:col-span-5 flex flex-col bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-[28px] shadow-2xl p-6 md:p-10 relative overflow-hidden transition-colors duration-700 min-h-[460px] md:min-h-0">
              <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full overflow-hidden py-4 md:py-0">
                <div data-song-mood className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64 flex-shrink-0 aspect-square mb-6 md:mb-10 flex items-center justify-center">
                  <div className={`absolute inset-0 m-auto w-[85%] h-[85%] bg-indigo-500/25 blur-[35px] rounded-full transition-all duration-1000 z-0 ${isPlaying ? 'opacity-90 scale-105' : 'opacity-20 scale-100'}`} />
                  <motion.div
                    data-ambient-motion="true"
                    className={`absolute inset-0 w-full h-full rounded-full border-[4px] md:border-[6px] border-white/80 dark:border-slate-600/80 shadow-2xl overflow-hidden transition-transform duration-700 z-10 rotating-disc ${isPlaying ? 'scale-100' : 'scale-95'}`}
                    style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                  >
                    <img src={songCover} alt={currentSong.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 m-auto w-10 h-10 md:w-12 md:h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full z-30 shadow-inner border border-slate-300 dark:border-slate-700" />
                    <div className="absolute inset-0 z-20 rounded-full pointer-events-none opacity-20" style={{ background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.4), transparent, rgba(255,255,255,0.4), transparent)' }} />
                  </motion.div>
                </div>

                <div data-song-mood className="w-full text-center px-2 md:px-4 mb-2 md:mb-6">
                  <h2 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white truncate drop-shadow-sm tracking-tight">
                    {currentSong.title}
                  </h2>
                  <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 truncate mt-1 md:mt-2 tracking-widest">
                    {currentSong.artist}
                  </p>
                </div>
              </div>

              <div className="w-full mt-auto relative z-20">
                <div className="w-full flex flex-col gap-1.5 mb-6 md:mb-8 px-1 md:px-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleSeek}
                    className="w-full h-1 md:h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #4f46e5 ${progress}%, rgba(0, 0, 0, 0.15) 0)` }}
                    aria-label="播放进度"
                  />
                  <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between px-1 md:px-2 lg:px-4">
                  <button onClick={togglePlayMode} className="p-2 transition-transform duration-300 hover:scale-105" aria-label="切换播放模式">
                    {playModeIcon}
                  </button>
                  <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
                    <button onClick={prevSong} className="p-2 text-slate-700 dark:text-slate-300 hover:text-indigo-500 transition-transform duration-300 hover:scale-105" aria-label="上一首">
                      <SkipBack size={24} className="md:w-7 md:h-7" fill="currentColor" />
                    </button>
                    <button onClick={togglePlay} className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center bg-indigo-500 text-white rounded-full hover:scale-105 shadow-xl shadow-indigo-500/40" aria-label={isPlaying ? '暂停' : '播放'}>
                      {isPlaying ? <Pause size={28} className="md:w-8 md:h-8" fill="currentColor" /> : <Play size={28} className="md:w-8 md:h-8 ml-1" fill="currentColor" />}
                    </button>
                    <button onClick={nextSong} className="p-2 text-slate-700 dark:text-slate-300 hover:text-indigo-500 transition-transform duration-300 hover:scale-105" aria-label="下一首">
                      <SkipForward size={24} className="md:w-7 md:h-7" fill="currentColor" />
                    </button>
                  </div>
                  <div className="flex items-center" onMouseLeave={() => setShowVolumeSlider(false)}>
                    <AnimatePresence>
                      {showVolumeSlider && (
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 80, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="hidden md:flex overflow-hidden items-center mr-2 bg-white/30 dark:bg-black/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20"
                        >
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={(event) => setVolume(Number(event.target.value))}
                            className="w-16 h-1 appearance-none rounded-full cursor-pointer"
                            aria-label="音量"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button onClick={() => setShowVolumeSlider((value) => !value)} onDoubleClick={toggleMute} className={`p-2 rounded-full transition-all ${showVolumeSlider ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-500'}`} aria-label="音量控制">
                      {isMuted || volume === 0 ? <VolumeX size={18} className="md:w-5 md:h-5" /> : <Volume2 size={18} className="md:w-5 md:h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div data-music-reveal className="md:col-span-7 flex flex-col bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-[28px] shadow-2xl relative transition-colors duration-700 overflow-hidden h-[450px] md:h-auto">
              <div className="flex items-center justify-center gap-1 p-1 mt-4 md:mt-6 mx-auto bg-white/50 dark:bg-slate-900/50 rounded-full shadow-inner border border-white/40 w-48 md:w-64 z-20 shrink-0">
                <button onClick={() => setActiveTab('lyrics')} className={`flex-1 py-1.5 md:py-2 rounded-full font-black text-xs md:text-[13px] transition-all ${activeTab === 'lyrics' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500'}`}>
                  歌词
                </button>
                <button onClick={() => setActiveTab('playlist')} className={`flex-1 py-1.5 md:py-2 rounded-full font-black text-xs md:text-[13px] transition-all ${activeTab === 'playlist' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500'}`}>
                  歌单
                </button>
              </div>

              <div className="flex-1 relative mt-2 flex flex-col overflow-hidden">
                {activeTab === 'lyrics' && (
                  <div className="absolute inset-0 flex flex-col h-full animate-in fade-in duration-300">
                    <div className="absolute top-0 left-0 right-0 h-32 md:h-40 bg-gradient-to-b from-white/40 dark:from-slate-800/60 to-transparent z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-32 md:h-40 bg-gradient-to-t from-white/40 dark:from-slate-800/60 to-transparent z-10 pointer-events-none" />
                    <div ref={lyricContainerRef} className="h-full overflow-y-auto no-scrollbar scroll-smooth relative px-4 md:px-6 lyric-mask-container">
                      <div className="py-[30vh] md:py-[35vh] flex flex-col gap-4 md:gap-6 text-center lg:px-10">
                        {lyrics.length > 0 ? (
                          lyrics.map((line, index) => {
                            const isActive = index === activeLyricIndex;
                            return (
                              <button
                                key={`${line.time}-${line.text}`}
                                ref={isActive ? activeLyricRef : null}
                                className={`transition-all duration-700 cursor-pointer px-2 md:px-4 rounded-2xl text-center ${isActive ? 'opacity-100 scale-105 py-2 md:py-3 bg-white/10' : 'opacity-25 hover:opacity-60'}`}
                                onClick={() => seekToTime(line.time)}
                              >
                                <span className={`block font-black leading-relaxed transition-all duration-700 ${isActive ? 'text-lg md:text-2xl text-indigo-600 dark:text-indigo-400' : 'text-sm md:text-lg text-slate-700 dark:text-slate-300'}`}>
                                  {line.text}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 md:gap-4">
                              <Disc3 className="animate-spin text-indigo-500/40" size={32} />
                              <p className="text-base md:text-xl font-black text-indigo-500">{currentLyric}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'playlist' && (
                  <div className="absolute inset-0 px-4 md:px-8 pb-4 md:pb-8 pt-2 md:pt-4 animate-in fade-in duration-300 flex flex-col">
                    <div className="relative w-full max-w-md mx-auto group mb-4 md:mb-8 shrink-0">
                      <Search className="w-4 h-4 md:w-5 md:h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="搜索音乐..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full h-10 md:h-12 pl-10 md:pl-12 pr-10 md:pr-12 bg-white/30 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-full text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-inner transition-all"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/10 rounded-full transition-colors" aria-label="清空搜索">
                          <X size={14} className="text-slate-500" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2 md:gap-2.5">
                      <AnimatePresence mode="popLayout">
                        {filteredPlaylist.map((song) => {
                          const isCurrentSong = song.id === currentSong.id;
                          return (
                            <motion.button
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              key={song.id}
                              onClick={() => handlePlaylistClick(song)}
                              className={`group flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer transition-all border text-left ${isCurrentSong ? 'bg-white/60 dark:bg-slate-700/80 shadow-md border-indigo-500/30' : 'border-transparent hover:bg-white/30 dark:hover:bg-slate-700/40'}`}
                            >
                              <span className="flex items-center gap-3 md:gap-4 min-w-0">
                                <span className="relative w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-lg md:rounded-xl overflow-hidden shadow-sm">
                                  <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                                  {isCurrentSong && isPlaying && (
                                    <span className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                      <span className="flex gap-[3px] items-end h-2 md:h-3">
                                        <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_0ms]" />
                                        <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_200ms]" />
                                        <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_400ms]" />
                                      </span>
                                    </span>
                                  )}
                                </span>
                                <span className="flex flex-col min-w-0">
                                  <span className={`text-sm md:text-[15px] font-black truncate ${isCurrentSong ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {song.title}
                                  </span>
                                  <span className="text-[10px] md:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {song.artist}
                                  </span>
                                </span>
                              </span>
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section data-music-reveal className="mt-8 md:mt-12 mb-20 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[28px] md:rounded-[32px] shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700 relative">
            <div className="px-5 sm:px-8 md:px-16 py-8 md:py-12 relative">
              <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-4 md:pb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <MessageSquare className="text-indigo-500 w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">音乐留言</h3>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">记录这首歌带来的想法。</p>
                </div>
              </div>
              <Comments variant="music" />
            </div>
          </section>
        </main>
      </PageTransition>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .rotating-disc { animation: spin 20s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .lyric-mask-container {
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
        }
      `}</style>
    </div>
  );
}
