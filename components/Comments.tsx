"use client";

type CommentVariant = "guestbook" | "music" | "article" | "moment";

const defaults: Record<CommentVariant, { title: string; description: string }> = {
  guestbook: {
    title: "留言板正在规划中",
    description: "这里后续会承载全站访客留言。正式上线前会先补齐反垃圾、审核和安全策略。",
  },
  music: {
    title: "音乐回声正在规划中",
    description: "这里会收集与当前歌曲、听歌心情和音乐推荐相关的短留言。",
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

export default function Comments({
  variant = "article",
  title,
  description,
}: {
  variant?: CommentVariant;
  title?: string;
  description?: string;
}) {
  const copy = defaults[variant];

  return (
    <div className="w-full mt-16 relative">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>
      <div className="relative z-10 rounded-3xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-6 shadow-xl">
        <p className="text-sm font-black text-slate-800 dark:text-white">{title || copy.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description || copy.description}</p>
      </div>
    </div>
  );
}
