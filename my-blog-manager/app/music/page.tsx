"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import MusicLibraryManager from '../../components/music/MusicLibraryManager';
import { LyricLine, MusicSong, useMusic } from '../../components/MusicProvider';

type MusicTab = 'lyrics' | 'playlist';

const fallbackCover = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1000&auto=format&fit=crop';

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

  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLButtonElement>(null);
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

  const playModeIcon = useMemo(() => {
    if (playMode === 'single') return <RefreshCcw size={20} className="text-indigo-500" />;
    if (playMode === 'random') return <Shuffle size={20} className="text-slate-500 hover:text-indigo-500" />;
    return <Repeat size={20} className="text-slate-500 hover:text-indigo-500" />;
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
        <PageTransition>
          <main className="w-full max-w-7xl mx-auto mt-28 px-4 sm:px-10 relative z-10">
            <MusicLibraryManager />
            <div className="min-h-[360px] flex flex-col items-center justify-center gap-4 px-6 text-center rounded-[28px] bg-white/45 dark:bg-slate-900/45 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl">
              <Music2 size={48} className="text-indigo-500" />
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">暂无可播放音乐</h1>
              <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                请先在上方输入网易云歌曲 ID，加入队列后点击右上角“更新本地”写入配置。
              </p>
            </div>
          </main>
        </PageTransition>
      </div>
    );
  }

  const songCover = currentSong.cover || fallbackCover;

  return (
    <div className="min-h-screen relative pb-10 flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-[-10%] bg-cover bg-center transition-all duration-1000 blur-[50px] opacity-40 dark:opacity-20 saturate-150"
          style={{ backgroundImage: `url(${songCover})` }}
        />
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm" />
      </div>

      <Navbar />

      <PageTransition>
        <main className="w-full max-w-7xl mx-auto mt-28 px-4 sm:px-10 relative z-10">
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-wide mb-2">
              后台音乐测试
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              用于确认管理端播放器的数据、控制和歌词展示是否正常。
            </p>
          </header>

          <MusicLibraryManager />

          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-stretch h-[calc(100vh-320px)] min-h-[600px] max-h-[720px]">
            <div className="md:col-span-5 h-full flex flex-col bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-[28px] shadow-2xl p-10 relative overflow-hidden transition-all duration-500">
              <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full overflow-hidden">
                <div className="relative w-48 h-48 lg:w-64 lg:h-64 flex-shrink-0 aspect-square mb-10 flex items-center justify-center">
                  <div className={`absolute inset-0 m-auto w-[85%] h-[85%] bg-indigo-500/25 blur-[35px] rounded-full transition-all duration-1000 z-0 ${isPlaying ? 'opacity-90 scale-105' : 'opacity-20 scale-100'}`} />
                  <motion.div
                    className={`absolute inset-0 w-full h-full rounded-full border-[6px] border-white/80 dark:border-slate-600/80 shadow-2xl overflow-hidden transition-transform duration-700 z-10 rotating-disc ${isPlaying ? 'scale-100' : 'scale-95'}`}
                    style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                  >
                    <img src={songCover} alt={currentSong.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 m-auto w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full z-30 shadow-inner border border-slate-300 dark:border-slate-700" />
                    <div className="absolute inset-0 z-20 rounded-full pointer-events-none opacity-20" style={{ background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.4), transparent, rgba(255,255,255,0.4), transparent)' }} />
                  </motion.div>
                </div>

                <div className="w-full text-center px-4 mb-6">
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white truncate drop-shadow-sm tracking-tight">
                    {currentSong.title}
                  </h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 truncate mt-2 tracking-widest">
                    {currentSong.artist}
                  </p>
                </div>
              </div>

              <div className="w-full mt-auto relative z-20">
                <div className="w-full flex flex-col gap-1.5 mb-8 px-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleSeek}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #4f46e5 ${progress}%, rgba(0, 0, 0, 0.15) 0)` }}
                    aria-label="播放进度"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between px-2 lg:px-4">
                  <button onClick={togglePlayMode} className="p-2 transition-transform hover:scale-110" aria-label="切换播放模式">
                    {playModeIcon}
                  </button>
                  <div className="flex items-center gap-4 lg:gap-6">
                    <button onClick={prevSong} className="p-2 text-slate-700 dark:text-slate-300 hover:text-indigo-500 transition-transform hover:scale-110" aria-label="上一首">
                      <SkipBack size={28} fill="currentColor" />
                    </button>
                    <button onClick={togglePlay} className="w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center bg-indigo-500 text-white rounded-full hover:scale-105 shadow-xl shadow-indigo-500/40" aria-label={isPlaying ? '暂停' : '播放'}>
                      {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={nextSong} className="p-2 text-slate-700 dark:text-slate-300 hover:text-indigo-500 transition-transform hover:scale-110" aria-label="下一首">
                      <SkipForward size={28} fill="currentColor" />
                    </button>
                  </div>
                  <div className="flex items-center" onMouseLeave={() => setShowVolumeSlider(false)}>
                    <AnimatePresence>
                      {showVolumeSlider && (
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 100, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="overflow-hidden flex items-center mr-2 bg-white/30 dark:bg-black/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20"
                        >
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={(event) => setVolume(Number(event.target.value))}
                            className="w-20 h-1 appearance-none rounded-full cursor-pointer"
                            aria-label="音量"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button onClick={() => setShowVolumeSlider((value) => !value)} onDoubleClick={toggleMute} className={`p-2 rounded-full transition-all ${showVolumeSlider ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-500'}`} aria-label="音量控制">
                      {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 h-full flex flex-col bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-[28px] shadow-2xl relative transition-colors duration-700 overflow-hidden">
              <div className="flex items-center justify-center gap-1 p-1 mt-6 mx-auto bg-white/50 dark:bg-slate-900/50 rounded-full shadow-inner border border-white/40 w-64 z-20 shrink-0">
                <button onClick={() => setActiveTab('lyrics')} className={`flex-1 py-2 rounded-full font-black text-[13px] transition-all ${activeTab === 'lyrics' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500'}`}>
                  歌词
                </button>
                <button onClick={() => setActiveTab('playlist')} className={`flex-1 py-2 rounded-full font-black text-[13px] transition-all ${activeTab === 'playlist' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500'}`}>
                  歌单
                </button>
              </div>

              <div className="flex-1 relative mt-2 flex flex-col overflow-hidden">
                {activeTab === 'lyrics' && (
                  <div className="absolute inset-0 flex flex-col h-full animate-in fade-in duration-300">
                    <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/40 dark:from-slate-800/60 to-transparent z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/40 dark:from-slate-800/60 to-transparent z-10 pointer-events-none" />
                    <div ref={lyricContainerRef} className="h-full overflow-y-auto no-scrollbar scroll-smooth relative px-6 lyric-mask-container">
                      <div className="py-[35vh] flex flex-col gap-6 text-center lg:px-10">
                        {lyrics.length > 0 ? (
                          lyrics.map((line, index) => {
                            const isActive = index === activeLyricIndex;
                            return (
                              <button
                                key={`${line.time}-${line.text}`}
                                ref={isActive ? activeLyricRef : null}
                                className={`transition-all duration-700 cursor-pointer px-4 rounded-2xl text-center ${isActive ? 'opacity-100 scale-105 py-3 bg-white/10' : 'opacity-25 hover:opacity-60'}`}
                                onClick={() => seekToTime(line.time)}
                              >
                                <span className={`block font-black leading-relaxed transition-all duration-700 ${isActive ? 'text-xl md:text-2xl text-indigo-600 dark:text-indigo-400' : 'text-base md:text-lg text-slate-700 dark:text-slate-300'}`}>
                                  {line.text}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <Disc3 className="animate-spin text-indigo-500/40" size={40} />
                              <p className="text-xl font-black text-indigo-500">{currentLyric}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'playlist' && (
                  <div className="absolute inset-0 px-8 pb-8 pt-4 animate-in fade-in duration-300 flex flex-col">
                    <div className="relative w-full max-w-md mx-auto group mb-8 shrink-0">
                      <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="搜索音乐或艺人..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full h-12 pl-12 pr-12 bg-white/30 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-inner transition-all"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/10 rounded-full transition-colors" aria-label="清空搜索">
                          <X size={16} className="text-slate-500" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2.5">
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
                              className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border text-left ${isCurrentSong ? 'bg-white/60 dark:bg-slate-700/80 shadow-md border-indigo-500/30' : 'border-transparent hover:bg-white/30 dark:hover:bg-slate-700/40'}`}
                            >
                              <span className="flex items-center gap-4 min-w-0">
                                <span className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden shadow-sm">
                                  <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                                  {isCurrentSong && isPlaying && (
                                    <span className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                      <span className="flex gap-[3px] items-end h-3">
                                        <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_0ms]" />
                                        <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_200ms]" />
                                        <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_400ms]" />
                                      </span>
                                    </span>
                                  )}
                                </span>
                                <span className="flex flex-col min-w-0">
                                  <span className={`text-[15px] font-black truncate ${isCurrentSong ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {song.title}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
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

          <section className="mt-12 mb-20 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700 relative">
            <div className="px-8 md:px-16 py-12 relative">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <MessageSquare className="text-indigo-500" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">音乐备注</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">后台测试时记录播放体验和配置问题。</p>
                </div>
              </div>
              <Comments />
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
