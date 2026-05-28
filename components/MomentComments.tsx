"use client";

interface MomentCommentsProps {
  id: string;
}

export default function MomentComments({ id }: MomentCommentsProps) {
  return (
    <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
      动态留言正在规划中，当前暂不开放公开写入。记录位置：{id}
    </div>
  );
}
