"use client";

import {
  ChangeEvent,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { siteConfig } from '../siteConfig';

export type LyricLine = {
  time: number;
  text: string;
};

export type MusicSong = {
  id: string | number;
  title: string;
  artist: string;
  cover: string;
  src: string;
  lrcUrl?: string;
  lyrics: LyricLine[];
  name?: string;
  author?: string;
  pic?: string;
  lrc?: string;
  lyric?: string;
};

type PlayMode = 'loop' | 'single' | 'random';

interface MusicContextType {
  playlist: MusicSong[];
  currentIndex: number;
  currentSong: MusicSong | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (e: ChangeEvent<HTMLInputElement>) => void;
  seekToTime: (time: number) => void;
  playSong: (index: number) => void;
  selectSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

const fallbackCover = siteConfig.musicFallbackCover;

function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || lrcText.length > 30000) return [];

  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];
  const timeExp = /\[(\d{2,}):(\d{2})(?:[.:](\d{2,3}))?\]/g;

  for (const line of lines) {
    const text = line.replace(/\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/g, '').trim();
    if (!text) continue;

    let match: RegExpExecArray | null;
    timeExp.lastIndex = 0;
    while ((match = timeExp.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) / 1000 : 0;
      result.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

function toStringValue(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function toStableCover(value: unknown, fallback = fallbackCover) {
  const cover = toStringValue(value);

  if (!cover || cover.includes('api.injahow.cn/meting/?server=netease&type=pic')) {
    return fallback;
  }

  return cover;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<MusicSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyric, setCurrentLyric] = useState('正在加载音乐...');
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentSong = playlist[currentIndex] ?? null;
  const currentSongId = currentSong?.id;
  const currentSongLrcUrl = currentSong?.lrcUrl;

  useEffect(() => {
    let isMounted = true;

    async function fetchMusicData() {
      if (!siteConfig.cloudMusicIds?.length) {
        setPlaylist([]);
        setCurrentLyric('请先配置音乐 ID');
        setIsLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          siteConfig.cloudMusicIds.map(async (id) => {
            try {
              const response = await fetch(`https://api.injahow.cn/meting/?server=netease&type=song&id=${id}`);
              if (!response.ok) return null;
              return response.json();
            } catch {
              return null;
            }
          })
        );

        const nextPlaylist = results
          .map((result, index): MusicSong | null => {
            if (!Array.isArray(result) || !result[0]) return null;

            const song = result[0] as Record<string, unknown>;
            const src = toStringValue(song.url);
            if (!src) return null;

            const title = toStringValue(song.name, toStringValue(song.title, '未命名歌曲'));
            const artist = toStringValue(song.author, toStringValue(song.artist, '未知歌手'));
            const cover = toStableCover(song.pic, toStableCover(song.cover));
            const lrcUrl = toStringValue(song.lrc) || undefined;

            return {
              id:
                typeof song.id === 'string' || typeof song.id === 'number'
                  ? song.id
                  : siteConfig.cloudMusicIds[index],
              title,
              artist,
              cover,
              src,
              lrcUrl,
              lyrics: [],
              name: title,
              author: artist,
              pic: cover,
              lrc: lrcUrl,
            };
          })
          .filter((song): song is MusicSong => Boolean(song));

        if (!isMounted) return;

        setPlaylist(nextPlaylist);
        setCurrentIndex(0);
        setCurrentLyric(nextPlaylist.length ? '准备就绪' : '没有可播放的音乐，请检查歌曲 ID 或网络连接');
      } catch {
        if (!isMounted) return;
        setPlaylist([]);
        setCurrentLyric('音乐列表加载失败，请稍后重试');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchMusicData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (currentSongId === undefined || currentSongId === null) {
      setLyrics([]);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    let isMounted = true;
    const songId = currentSongId;
    const lrcUrl = currentSongLrcUrl;
    setLyrics([]);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setCurrentLyric('正在缓冲...');

    async function loadLyrics() {
      if (!lrcUrl) {
        if (isMounted) setCurrentLyric('纯音乐，请欣赏');
        return;
      }

      try {
        const response = await fetch(lrcUrl);
        const text = await response.text();
        const parsed = parseLrc(text);

        if (!isMounted) return;

        setLyrics(parsed);
        setCurrentLyric(parsed.length ? '准备就绪' : '纯音乐，请欣赏');
        setPlaylist((previous) =>
          previous.map((song) => (song.id === songId ? { ...song, lyrics: parsed } : song))
        );
      } catch {
        if (!isMounted) return;
        setLyrics([]);
        setCurrentLyric('歌词加载失败');
      }
    }

    loadLyrics();

    return () => {
      isMounted = false;
    };
  }, [currentSongId, currentSongLrcUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.src) return;

    if (!isPlaying) {
      audio.pause();
      return;
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => setIsPlaying(false));
    }
  }, [isPlaying, currentSong?.src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => setIsPlaying(false));
    }
  };

  const nextSong = () => {
    if (playlist.length === 0) return;

    setCurrentIndex((previous) => {
      if (playMode === 'random') {
        if (playlist.length === 1) return previous;

        let nextIndex = previous;
        while (nextIndex === previous) {
          nextIndex = Math.floor(Math.random() * playlist.length);
        }
        return nextIndex;
      }

      return (previous + 1) % playlist.length;
    });
  };

  const prevSong = () => {
    if (playlist.length === 0) return;

    setCurrentIndex((previous) => {
      if (playMode === 'random') {
        if (playlist.length === 1) return previous;
        return Math.floor(Math.random() * playlist.length);
      }

      return (previous - 1 + playlist.length) % playlist.length;
    });
  };

  const playSong = (index: number) => {
    if (playlist.length === 0) return;

    const nextIndex = Math.min(Math.max(index, 0), playlist.length - 1);
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  };

  const seekToTime = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;

    const nextTime = duration > 0 ? Math.min(Math.max(time, 0), duration) : Math.max(time, 0);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
    if (duration > 0) setProgress((nextTime / duration) * 100);
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const nextProgress = Number(e.target.value);
    setProgress(nextProgress);
    if (duration > 0) seekToTime((nextProgress / 100) * duration);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextCurrentTime = audio.currentTime;
    const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;

    setCurrentTime(nextCurrentTime);
    setDuration(nextDuration);
    setProgress(nextDuration > 0 ? (nextCurrentTime / nextDuration) * 100 : 0);

    if (lyrics.length > 0) {
      const activeLyric = [...lyrics].reverse().find((line) => nextCurrentTime >= line.time);
      if (activeLyric && activeLyric.text !== currentLyric) {
        setCurrentLyric(activeLyric.text);
      }
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
  };

  const handleEnded = () => {
    if (playMode === 'single' && audioRef.current) {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
      return;
    }

    nextSong();
  };

  const setVolume = (value: number) => {
    const nextVolume = Math.min(Math.max(value, 0), 1);
    setVolumeState(nextVolume);
    if (nextVolume > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted((previous) => !previous);

  const togglePlayMode = () => {
    setPlayMode((previous) => {
      if (previous === 'loop') return 'single';
      if (previous === 'single') return 'random';
      return 'loop';
    });
  };

  return (
    <MusicContext.Provider
      value={{
        playlist,
        currentIndex,
        currentSong,
        isPlaying,
        progress,
        currentTime,
        duration,
        currentLyric,
        isLoading,
        volume,
        isMuted,
        playMode,
        togglePlay,
        nextSong,
        prevSong,
        handleSeek,
        seekToTime,
        playSong,
        selectSong: playSong,
        setVolume,
        toggleMute,
        togglePlayMode,
      }}
    >
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.src}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within MusicProvider');
  return context;
};
