"use client";

export default function Comments() {
  return (
    <div className="w-full mt-16 relative">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>
      <div className="relative z-10 rounded-3xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-6 text-sm text-slate-600 dark:text-slate-300 shadow-xl">
        Comments are disabled in this starter build. Configure a modern comment provider before enabling public discussion.
      </div>
    </div>
  );
}
