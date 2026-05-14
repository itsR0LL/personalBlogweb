"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Disc3, Loader2, Music2, Plus, Search, Trash2 } from 'lucide-react';
import { useOperations } from '../../context/OperationContext';
import { siteConfig } from '../../siteConfig';
import { useToast } from '../ToastProvider';

type MusicDetail = {
  id: string;
  name: string;
  artist?: string;
  album?: string;
  cover?: string;
  error?: boolean;
};

function normalizeMusicId(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return '';

  const queryMatch = value.match(/[?&]id=(\d+)/);
  if (queryMatch) return queryMatch[1];

  const pathMatch = value.match(/\/song\/(?:media\/outer\/url\?id=)?(\d+)/);
  if (pathMatch) return pathMatch[1];

  if (/^\d+$/.test(value)) return value;
  return '';
}

async function getApiBase() {
  const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
  if (!configRes.ok) throw new Error('Cannot read backend port config.');
  const configData = await configRes.json();
  return `http://127.0.0.1:${configData.api_port}`;
}

async function queryMusicDetail(id: string): Promise<MusicDetail> {
  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/api/music/query/${id}`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) {
    return { id, name: data.message || 'Music lookup failed.', error: true };
  }
  return data.data;
}

export default function MusicLibraryManager() {
  const { addOperation } = useOperations();
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  const [musicIds, setMusicIds] = useState<string[]>(() => (siteConfig.cloudMusicIds || []).map(String));
  const [musicDetails, setMusicDetails] = useState<Record<string, MusicDetail>>({});
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loadingIds, setLoadingIds] = useState(false);
  const [lastAdded, setLastAdded] = useState<MusicDetail | null>(null);

  const idCountLabel = useMemo(() => `${musicIds.length} tracks`, [musicIds.length]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const enqueueMusicIds = (nextIds: string[], detailLabel?: string) => {
    addOperation({
      type: 'CONFIG',
      label: 'Music config: NetEase playlist',
      description: detailLabel || `Update NetEase playlist with ${nextIds.length} tracks.`,
      payload: { cloudMusicIds: nextIds },
    });
  };

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const apiBase = await getApiBase();
        const res = await fetch(`${apiBase}/api/config/get`, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.data?.cloudMusicIds)) {
          setMusicIds(data.data.cloudMusicIds.map(String));
        }
      } catch {
        if (!cancelled) {
          showToastRef.current('Local Python backend is unavailable; using bundled config.', 'warning');
        }
      }
    };

    loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      const missingIds = musicIds.filter((id) => !musicDetails[id]);
      if (missingIds.length === 0) return;

      setLoadingIds(true);
      const nextDetails: Record<string, MusicDetail> = {};

      for (const id of missingIds) {
        try {
          nextDetails[id] = await queryMusicDetail(id);
        } catch {
          nextDetails[id] = { id, name: 'Backend connection failed.', error: true };
        }
      }

      if (!cancelled) {
        setMusicDetails((previous) => ({ ...previous, ...nextDetails }));
        setLoadingIds(false);
      }
    };

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [musicIds, musicDetails]);

  const handleAddMusic = async () => {
    const targetId = normalizeMusicId(inputValue);
    if (!targetId) {
      showToast('Enter a NetEase song ID or paste a song link containing id=.', 'warning');
      return;
    }

    if (musicIds.includes(targetId)) {
      showToast(`Song #${targetId} is already in the playlist.`, 'warning');
      return;
    }

    setIsAdding(true);
    setLastAdded(null);

    try {
      const detail = await queryMusicDetail(targetId);
      if (detail.error) {
        showToast(detail.name || 'Song was not found.', 'error');
        return;
      }

      const nextIds = [...musicIds, targetId];
      setMusicIds(nextIds);
      setMusicDetails((previous) => ({ ...previous, [targetId]: detail }));
      setInputValue('');
      setLastAdded(detail);
      enqueueMusicIds(nextIds, `Added "${detail.name}" to NetEase playlist.`);
      showToast('Added to playlist and queued for local update.', 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'backend unavailable';
      showToast(`Cannot query song: ${message}`, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMusic = (id: string) => {
    const nextIds = musicIds.filter((item) => item !== id);
    const detail = musicDetails[id];
    setMusicIds(nextIds);
    enqueueMusicIds(
      nextIds,
      detail && !detail.error ? `Removed "${detail.name}" from NetEase playlist.` : `Removed #${id} from NetEase playlist.`,
    );
    showToast('Removed from playlist and queued for local update.', 'success');
  };

  return (
    <section className="mb-8 rounded-[28px] bg-white/45 dark:bg-slate-900/45 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-0">
        <div className="p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-white/40 dark:border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-pink-500/15 text-pink-500 flex items-center justify-center">
              <Music2 size={22} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Music Update Queue</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Validate a NetEase song ID and queue it for config update.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddMusic();
                  }
                }}
                placeholder="Song ID or NetEase link"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/70 dark:bg-slate-950/60 border border-white/60 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-500/40 transition-all"
              />
            </div>
            <button
              onClick={handleAddMusic}
              disabled={isAdding}
              className="h-12 px-5 rounded-2xl bg-pink-500 text-white text-xs font-black shadow-lg shadow-pink-500/25 hover:bg-pink-600 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2.4} />}
              Validate & Queue
            </button>
          </div>

          <AnimatePresence>
            {lastAdded && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3"
              >
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">
                  Queued: {lastAdded.name} {lastAdded.artist ? `- ${lastAdded.artist}` : ''}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-4 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            This follows the manager queue model. The config is written only after you open the top-right inbox and run
            Update Local.
          </p>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current NetEase Playlist</p>
              <h3 className="text-base font-black text-slate-800 dark:text-white">{idCountLabel}</h3>
            </div>
            {loadingIds && (
              <span className="flex items-center gap-2 text-[11px] font-black text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                Loading
              </span>
            )}
          </div>

          <div className="max-h-[310px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {musicIds.length === 0 ? (
              <div className="h-36 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Disc3 size={28} />
                <p className="text-xs font-black">No song IDs yet</p>
              </div>
            ) : (
              musicIds.map((id) => {
                const detail = musicDetails[id];
                return (
                  <div key={id} className="group flex items-center gap-3 rounded-2xl bg-white/45 dark:bg-slate-800/55 border border-white/40 dark:border-slate-700/60 p-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 shadow-sm">
                      {detail?.cover && !detail.error ? (
                        <img src={detail.cover} alt={detail.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Disc3 size={18} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-black truncate ${detail?.error ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                        {detail?.name || 'Loading song detail'}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                        {detail?.artist || detail?.album || `#${id}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveMusic(id)}
                      className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                      aria-label={`Remove song ${id}`}
                    >
                      <Trash2 size={16} strokeWidth={2.4} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
