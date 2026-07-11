"use client";

import Script from "next/script";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, MessageCircle, Music2, RefreshCw, Send, ShieldCheck } from "lucide-react";

type CommentVariant = "guestbook" | "music" | "article" | "moment";
type CommentChannel = "guestbook" | "music";

export type CommentSongOption = {
  id: string;
  title: string;
  artist: string;
};

type PublicComment = {
  id: string;
  channel: CommentChannel;
  authorName: string;
  content: string;
  song: CommentSongOption | null;
  reply: string | null;
  createdAt: string;
};

type CommentConfig = {
  enabled: boolean;
  siteKey: string;
  maxAuthorLength: number;
  maxContentLength: number;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
const defaults: Record<CommentVariant, { title: string; description: string }> = {
  guestbook: {
    title: "留言板",
    description: "写下想说的话。首次提交会先进入审核，公开后可以在这里看到。",
  },
  music: {
    title: "音乐留言",
    description: "选择一首歌，再记录它带来的想法。",
  },
  article: {
    title: "评论区正在规划中",
    description: "文章和随笔评论会在留言体系稳定后接入，当前暂不开放公开写入。",
  },
  moment: {
    title: "动态留言正在规划中",
    description: "短动态互动会在后续版本统一接入留言系统。",
  },
};

const emptyConfig: CommentConfig = {
  enabled: false,
  siteKey: "",
  maxAuthorLength: 24,
  maxContentLength: 300,
};

function formatCommentTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="w-full border-t border-slate-300/60 pt-6 dark:border-slate-700/70">
      <p className="text-sm font-black text-slate-800 dark:text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

export default function Comments({
  variant = "article",
  channel,
  title,
  description,
  songs = [],
  defaultSongId = "",
  showHeader = true,
}: {
  variant?: CommentVariant;
  channel?: CommentChannel;
  title?: string;
  description?: string;
  songs?: CommentSongOption[];
  defaultSongId?: string;
  showHeader?: boolean;
}) {
  const copy = defaults[variant];
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [config, setConfig] = useState<CommentConfig>(emptyConfig);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [selectedSongId, setSelectedSongId] = useState(defaultSongId);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef("");

  const selectedSong = useMemo(
    () => songs.find((song) => song.id === selectedSongId) || null,
    [selectedSongId, songs],
  );

  const loadComments = useCallback(async () => {
    if (!channel) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/comments?channel=${encodeURIComponent(channel)}&page=1&pageSize=30`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "读取留言失败");
      }
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "读取留言失败");
    } finally {
      setIsLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    if (!channel) return;
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/comments/config", { cache: "no-store" });
        const data = await response.json();
        if (response.ok && data.success) {
          setConfig({
            enabled: Boolean(data.enabled),
            siteKey: typeof data.siteKey === "string" ? data.siteKey : "",
            maxAuthorLength: Number(data.maxAuthorLength) || 24,
            maxContentLength: Number(data.maxContentLength) || 300,
          });
        }
      } catch {
        setConfig(emptyConfig);
      }
    };
    loadConfig();
    loadComments();
  }, [channel, loadComments]);

  useEffect(() => {
    if (!channel) return;
    const storedName = window.localStorage.getItem("blog-comment-author");
    if (storedName) setAuthorName(storedName.slice(0, 24));
  }, [channel]);

  useEffect(() => {
    if (channel !== "music" || songs.length === 0) return;
    const preferred = songs.some((song) => song.id === defaultSongId) ? defaultSongId : songs[0].id;
    setSelectedSongId((current) => songs.some((song) => song.id === current) ? current : preferred);
  }, [channel, defaultSongId, songs]);

  useEffect(() => {
    const container = turnstileContainerRef.current;
    const turnstile = window.turnstile;
    if (!channel || !config.enabled || !config.siteKey || !scriptReady || !container || !turnstile) return;

    if (widgetIdRef.current) {
      turnstile.remove(widgetIdRef.current);
    }
    widgetIdRef.current = turnstile.render(container, {
      sitekey: config.siteKey,
      action: "comment_submit",
      theme: "auto",
      size: "flexible",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => {
        setTurnstileToken("");
        setFormError("人机验证加载失败，请刷新后重试");
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = "";
      }
    };
  }, [channel, config.enabled, config.siteKey, scriptReady]);

  if (!channel) {
    return <Placeholder title={title || copy.title} description={description || copy.description} />;
  }

  const resetTurnstile = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    setTurnstileToken("");
  };

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    const normalizedName = authorName.trim();
    const normalizedContent = content.trim();

    if (normalizedName.length < 2 || normalizedName.length > config.maxAuthorLength) {
      setFormError(`昵称需要填写 2-${config.maxAuthorLength} 个字符`);
      return;
    }
    if (normalizedContent.length < 2 || normalizedContent.length > config.maxContentLength) {
      setFormError(`留言需要填写 2-${config.maxContentLength} 个字符`);
      return;
    }
    if (channel === "music" && !selectedSong) {
      setFormError("请选择这条评论对应的歌曲");
      return;
    }
    if (!turnstileToken) {
      setFormError("请等待人机验证完成");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          authorName: normalizedName,
          content: normalizedContent,
          song: channel === "music" ? selectedSong : null,
          turnstileToken,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "留言提交失败");
      }
      window.localStorage.setItem("blog-comment-author", normalizedName);
      setContent("");
      setSuccessMessage(data.message || "留言已提交，审核通过后会公开显示");
      resetTurnstile();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "留言提交失败");
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full" aria-label={title || copy.title}>
      {config.enabled && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      )}

      {showHeader && (
        <div className="mb-7 border-b border-slate-300/60 pb-5 dark:border-slate-700/70">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-indigo-500" aria-hidden="true" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{title || copy.title}</h2>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {description || copy.description}
          </p>
        </div>
      )}

      <form onSubmit={submitComment} className="border-b border-slate-300/60 pb-8 dark:border-slate-700/70">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${channel}-comment-name`} className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              昵称
            </label>
            <input
              id={`${channel}-comment-name`}
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              maxLength={config.maxAuthorLength}
              autoComplete="nickname"
              className="min-h-11 w-full rounded-xl border border-white/60 bg-white/55 px-4 text-base text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-slate-900/45 dark:text-white"
            />
          </div>

          {channel === "music" && (
            <div>
              <label htmlFor="music-comment-song" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                对应歌曲
              </label>
              <select
                id="music-comment-song"
                value={selectedSongId}
                onChange={(event) => setSelectedSongId(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-white/60 bg-white/55 px-4 text-base text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-slate-900/45 dark:text-white"
              >
                {songs.map((song) => (
                  <option key={song.id} value={song.id}>{song.title} - {song.artist}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-4">
            <label htmlFor={`${channel}-comment-content`} className="text-sm font-bold text-slate-700 dark:text-slate-200">
              留言内容
            </label>
            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {content.length}/{config.maxContentLength}
            </span>
          </div>
          <textarea
            id={`${channel}-comment-content`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={config.maxContentLength}
            rows={4}
            className="w-full resize-y rounded-xl border border-white/60 bg-white/55 px-4 py-3 text-base leading-7 text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 dark:border-white/10 dark:bg-slate-900/45 dark:text-white"
          />
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-h-[44px] min-w-0 flex-1">
            {config.enabled ? (
              <div ref={turnstileContainerRef} className="max-w-full overflow-hidden" />
            ) : (
              <p className="flex min-h-11 items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                留言安全验证尚未配置，当前只能阅读。
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!config.enabled || isSubmitting}
            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto dark:focus:ring-offset-slate-900"
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            {isSubmitting ? "正在提交" : "提交留言"}
          </button>
        </div>

        <div className="mt-4 min-h-6" aria-live="polite">
          {formError && <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">{formError}</p>}
          {successMessage && <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{successMessage}</p>}
        </div>
      </form>

      <div className="pt-8">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="text-sm font-black text-slate-800 dark:text-white">已公开留言</p>
          <button
            type="button"
            onClick={loadComments}
            disabled={isLoading}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 px-2 text-sm font-bold text-slate-600 transition-colors hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:text-indigo-300"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            刷新
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            正在读取留言
          </div>
        ) : loadError ? (
          <div className="py-8 text-center">
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
            <button type="button" onClick={loadComments} className="mt-3 min-h-11 px-4 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-indigo-300">
              重新读取
            </button>
          </div>
        ) : comments.length === 0 ? (
          <p className="py-10 text-center text-sm leading-7 text-slate-500 dark:text-slate-400">
            这里还没有公开留言。
          </p>
        ) : (
          <ol className="divide-y divide-slate-300/60 dark:divide-slate-700/70">
            {comments.map((comment) => (
              <li key={comment.id} className="py-6 first:pt-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-black text-slate-900 dark:text-white">{comment.authorName}</p>
                  <time className="text-xs tabular-nums text-slate-500 dark:text-slate-400" dateTime={comment.createdAt}>
                    {formatCommentTime(comment.createdAt)}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-base leading-8 text-slate-700 dark:text-slate-200">
                  {comment.content}
                </p>
                {comment.song && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Music2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {comment.song.title} · {comment.song.artist}
                  </p>
                )}
                {comment.reply && (
                  <div className="mt-4 border-l-2 border-indigo-400 pl-4">
                    <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">博主回复</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-200">{comment.reply}</p>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
