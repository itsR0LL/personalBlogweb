"use client";

import {
  ChangeEvent,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { siteConfig } from "../siteConfig";

export type LyricLine = {
  time: number;
  text: string;
};

export type PlaybackType = "full" | "preview" | "restricted" | "unavailable" | "unknown";

export type MusicAvailability = {
  status: PlaybackType;
  playable: boolean;
  reasonCode?: string;
  reason?: string;
  checkedAt?: string;
  evidence?: {
    declaredDurationMs?: number;
    contentLengthBytes?: number;
    contentRange?: string;
    estimatedBitrateKbps?: number;
    durationRatio?: number;
    previewLike?: boolean;
    officialPlayable?: boolean;
    [key: string]: unknown;
  };
};

export type MusicLibraryItem = {
  id: string;
  provider: "netease";
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  durationMs?: number;
  externalUrl: string;
  playbackType: PlaybackType;
  publicPlayable: boolean;
  lastCheckedAt: string;
  reason?: string;
  availability?: MusicAvailability;
};

export type MusicSong = MusicLibraryItem & {
  src: string;
  lrcUrl?: string;
  lyrics: LyricLine[];
  name?: string;
  author?: string;
  pic?: string;
  lrc?: string;
  lyric?: string;
};

type PlayMode = "loop" | "single" | "random";

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
  loadError: string;
  skippedSongCount: number;
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

type SiteConfigWithMusic = Omit<typeof siteConfig, "musicLibrary" | "cloudMusicIds"> & {
  musicLibrary?: MusicLibraryItem[];
  cloudMusicIds?: Array<string | number>;
};

const MusicContext = createContext<MusicContextType | null>(null);
const fallbackCover = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || lrcText.length > 30000) return [];

  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];
  const timeExp = /\[(\d{2,}):(\d{2})(?:[.:](\d{2,3}))?\]/g;

  for (const line of lines) {
    const text = line.replace(/\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/g, "").trim();
    if (!text) continue;

    let match: RegExpExecArray | null;
    timeExp.lastIndex = 0;
    while ((match = timeExp.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) / 1000 : 0;
      result.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function isSafePublicUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return false;
    if (host === "localhost" || host.endsWith(".local")) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function isLikelyPreviewEvidence(track: MusicLibraryItem) {
  const evidence = track.availability?.evidence;
  if (!evidence) return false;
  if (evidence.previewLike) return true;
  if (evidence.officialPlayable === false) return true;
  if (typeof evidence.estimatedBitrateKbps === "number" && evidence.estimatedBitrateKbps < 32) return true;
  if (typeof evidence.durationRatio === "number" && evidence.durationRatio < 0.65) return true;
  return false;
}

function isTrustedFullTrack(track: MusicLibraryItem) {
  return track.publicPlayable && track.playbackType === "full" && !isLikelyPreviewEvidence(track);
}

function isRuntimePreviewStream(track: MusicLibraryItem, actualDurationSeconds: number) {
  const declaredDurationMs = track.durationMs || track.availability?.evidence?.declaredDurationMs || 0;
  if (!Number.isFinite(actualDurationSeconds) || actualDurationSeconds <= 0 || declaredDurationMs < 60000) {
    return false;
  }
  const actualDurationMs = actualDurationSeconds * 1000;
  const ratio = actualDurationMs / declaredDurationMs;
  return actualDurationMs <= 45000 && ratio < 0.65;
}

function configuredTracks(config: SiteConfigWithMusic) {
  const library = Array.isArray(config.musicLibrary) ? config.musicLibrary : [];
  if (library.length > 0) {
    const tracks = library.filter(isTrustedFullTrack);
    return {
      tracks,
      skippedBeforeLoad: library.length - tracks.length,
      usingStructuredLibrary: true,
    };
  }

  return {
    tracks: [],
    skippedBeforeLoad: (config.cloudMusicIds || []).length,
    usingStructuredLibrary: false,
  };
}

async function loadRuntimeMusicConfig(): Promise<SiteConfigWithMusic> {
  try {
    const response = await fetch("/api/content?collection=music", { cache: "no-store" });
    if (!response.ok) return siteConfig as SiteConfigWithMusic;
    const payload = await response.json();
    if (!payload?.success || !payload.data) return siteConfig as SiteConfigWithMusic;
    return {
      ...(siteConfig as SiteConfigWithMusic),
      ...payload.data,
    };
  } catch {
    return siteConfig as SiteConfigWithMusic;
  }
}

async function resolvePlayableSong(track: MusicLibraryItem): Promise<MusicSong | null> {
  try {
    if (!isTrustedFullTrack(track)) return null;
    const response = await fetch(`https://api.injahow.cn/meting/?server=netease&type=song&id=${track.id}`);
    if (!response.ok) return null;
    const result = await response.json();
    if (!Array.isArray(result) || !result[0]) return null;

    const song = result[0] as Record<string, unknown>;
    const src = toStringValue(song.url);
    if (!src || !isSafePublicUrl(src)) return null;

    const title = toStringValue(song.name, toStringValue(song.title, track.title || `歌曲 #${track.id}`));
    const artist = toStringValue(song.author, toStringValue(song.artist, track.artist || "未知歌手"));
    const cover = toStringValue(song.pic, toStringValue(song.cover, track.cover || fallbackCover));
    const rawLrcUrl = toStringValue(song.lrc);
    const lrcUrl = rawLrcUrl && isSafePublicUrl(rawLrcUrl) ? rawLrcUrl : undefined;

    return {
      ...track,
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
  } catch {
    return null;
  }
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<MusicSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在加载音乐...");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [skippedSongCount, setSkippedSongCount] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentSong = playlist[currentIndex] ?? null;
  const currentSongId = currentSong?.id;
  const currentSongLrcUrl = currentSong?.lrcUrl;

  useEffect(() => {
    let isMounted = true;

    async function fetchMusicData() {
      const musicConfig = await loadRuntimeMusicConfig();
      const { tracks, skippedBeforeLoad, usingStructuredLibrary } = configuredTracks(musicConfig);
      setSkippedSongCount(skippedBeforeLoad);

      if (tracks.length === 0) {
        setPlaylist([]);
        setCurrentLyric(usingStructuredLibrary ? "音乐库中暂无完整可公开播放的歌曲。" : "请先在管理端同步结构化音乐库。");
        setLoadError(usingStructuredLibrary ? "当前音乐库没有完整可公开播放的歌曲。" : "旧版音乐 ID 不再直接播放，请通过管理端检测并同步音乐库。");
        setIsLoading(false);
        return;
      }

      try {
        const results = await Promise.all(tracks.map(resolvePlayableSong));
        const nextPlaylist = results.filter((song): song is MusicSong => Boolean(song));
        if (!isMounted) return;

        setPlaylist(nextPlaylist);
        setCurrentIndex(0);
        setSkippedSongCount(skippedBeforeLoad + (tracks.length - nextPlaylist.length));
        setLoadError(nextPlaylist.length ? "" : "已配置的公开音乐暂时无法加载。");
        setCurrentLyric(nextPlaylist.length ? "准备就绪" : "暂无完整可公开播放的音乐。");
      } catch {
        if (!isMounted) return;
        setPlaylist([]);
        setLoadError("音乐列表加载失败。");
        setCurrentLyric("音乐列表加载失败。");
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
    setCurrentLyric("正在缓冲...");

    async function loadLyrics() {
      if (!lrcUrl) {
        if (isMounted) setCurrentLyric("纯音乐，请欣赏");
        return;
      }

      try {
        const response = await fetch(lrcUrl);
        const text = await response.text();
        const parsed = parseLrc(text);

        if (!isMounted) return;

        setLyrics(parsed);
        setCurrentLyric(parsed.length ? "准备就绪" : "纯音乐，请欣赏");
        setPlaylist((previous) =>
          previous.map((song) => (song.id === songId ? { ...song, lyrics: parsed } : song)),
        );
      } catch {
        if (!isMounted) return;
        setLyrics([]);
        setCurrentLyric("歌词加载失败");
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

  const skipCurrentSong = (message: string, emptyMessage = "暂无完整可公开播放的音乐。") => {
    const failedId = currentSong?.id;
    if (!failedId) return;

    audioRef.current?.pause();
    setSkippedSongCount((previous) => previous + 1);
    setPlaylist((previous) => {
      const failedIndex = previous.findIndex((song) => song.id === failedId);
      const nextPlaylist = previous.filter((song) => song.id !== failedId);
      if (nextPlaylist.length === 0) {
        setCurrentIndex(0);
        setIsPlaying(false);
        setLoadError(emptyMessage);
        setCurrentLyric(emptyMessage);
        return [];
      }

      setCurrentIndex(Math.min(Math.max(failedIndex, 0), nextPlaylist.length - 1));
      setCurrentLyric(message);
      return nextPlaylist;
    });
  };

  const nextSong = () => {
    if (playlist.length === 0) return;

    setCurrentIndex((previous) => {
      if (playMode === "random") {
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
      if (playMode === "random") {
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
    const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
    setDuration(nextDuration);
    if (currentSong && isRuntimePreviewStream(currentSong, nextDuration)) {
      skipCurrentSong("已跳过一首疑似试听音源。");
    }
  };

  const handleEnded = () => {
    if (playMode === "single" && audioRef.current) {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
      return;
    }

    nextSong();
  };

  const handleAudioError = () => {
    skipCurrentSong("已跳过一首不可用歌曲。", "所有已配置音乐在播放时都失败了。");
  };

  const setVolume = (value: number) => {
    const nextVolume = Math.min(Math.max(value, 0), 1);
    setVolumeState(nextVolume);
    if (nextVolume > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted((previous) => !previous);

  const togglePlayMode = () => {
    setPlayMode((previous) => {
      if (previous === "loop") return "single";
      if (previous === "single") return "random";
      return "loop";
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
        loadError,
        skippedSongCount,
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
          onError={handleAudioError}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};
