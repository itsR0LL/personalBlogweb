"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  GitBranch,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";

type ManagerTarget = {
  label: string;
  path: string;
  description: string;
};

type ManagerStatus = {
  managerEnabled: boolean;
  githubConfigured: boolean;
  githubOwner: string | null;
  githubRepo: string | null;
  githubBranch: string;
  targets: ManagerTarget[];
  writablePatterns: string[];
};

type ManagerMessage = {
  type: "info" | "success" | "error";
  text: string;
};

const passwordStorageKey = "r0l1-manager-password";

function createPostTemplate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const slug = `${yyyy}-${mm}-${dd}-manager-note`;

  return {
    path: `posts/${slug}.md`,
    content: `---\ntitle: \"New Manager Note\"\ndate: \"${yyyy}-${mm}-${dd} ${hh}:${mi}:00\"\ndescription: \"Draft created from /manager.\"\ncover: \"\"\ntags: [\"Draft\"]\n---\n\nWrite the article here.\n`,
  };
}

export default function ManagerClient() {
  const [status, setStatus] = useState<ManagerStatus | null>(null);
  const [password, setPassword] = useState("");
  const [path, setPath] = useState("siteConfig.ts");
  const [content, setContent] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<ManagerMessage | null>(null);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${password}` }), [password]);
  const canUseManager = Boolean(status?.managerEnabled && password);

  useEffect(() => {
    const storedPassword = window.sessionStorage.getItem(passwordStorageKey) || "";
    if (storedPassword) setPassword(storedPassword);
    loadStatus();
  }, []);

  function rememberPassword(nextPassword: string) {
    setPassword(nextPassword);
    if (nextPassword) {
      window.sessionStorage.setItem(passwordStorageKey, nextPassword);
    } else {
      window.sessionStorage.removeItem(passwordStorageKey);
    }
  }

  async function loadStatus() {
    setLoadingStatus(true);
    try {
      const response = await fetch("/api/manager/status", { cache: "no-store" });
      const data = (await response.json()) as ManagerStatus;
      setStatus(data);
    } catch {
      setMessage({ type: "error", text: "Failed to load manager status." });
    } finally {
      setLoadingStatus(false);
    }
  }

  async function loadFile(selectedPath = path) {
    if (!password) {
      setMessage({ type: "error", text: "Enter the manager password first." });
      return;
    }

    setLoadingFile(true);
    setMessage({ type: "info", text: `Loading ${selectedPath}...` });

    try {
      const response = await fetch(`/api/manager/file?path=${encodeURIComponent(selectedPath)}`, {
        headers: authHeader,
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load file.");
      }

      setPath(data.path);
      setContent(data.content || "");
      setCommitMessage(`Update ${data.path} from manager`);
      setMessage({
        type: data.exists ? "success" : "info",
        text: data.exists ? `Loaded ${data.path} from ${data.source}.` : `${data.path} does not exist yet.`,
      });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    } finally {
      setLoadingFile(false);
    }
  }

  async function saveFile() {
    if (!password) {
      setMessage({ type: "error", text: "Enter the manager password first." });
      return;
    }

    setSaving(true);
    setMessage({ type: "info", text: "Committing file through GitHub..." });

    try {
      const response = await fetch("/api/manager/file", {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
          content,
          message: commitMessage,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save file.");
      }

      setMessage({
        type: "success",
        text: `Committed ${data.path}. Vercel should rebuild after GitHub receives the commit.`,
      });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  function useNewPostTemplate() {
    const template = createPostTemplate();
    setPath(template.path);
    setContent(template.content);
    setCommitMessage(`Add ${template.path} from manager`);
    setMessage({ type: "info", text: "Inserted a new post template. Edit it before saving." });
  }

  return (
    <main className="min-h-screen px-4 py-24 sm:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/50 bg-white/55 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Lock size={14} />
                Manager
              </div>
              <h1 className="text-3xl font-black text-slate-950 dark:text-white sm:text-5xl">
                R0L1 Studio Manager
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                Edit allowlisted source files from the same Vercel app. Saves are committed to GitHub, then Vercel
                rebuilds the public site.
              </p>
            </div>

            <div className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:min-w-[360px]">
              <StatusPill
                ok={Boolean(status?.managerEnabled)}
                label={status?.managerEnabled ? "Password configured" : "Password missing"}
              />
              <StatusPill
                ok={Boolean(status?.githubConfigured)}
                label={status?.githubConfigured ? "GitHub write ready" : "GitHub env missing"}
              />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="flex flex-col gap-4 rounded-3xl border border-white/50 bg-white/50 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Manager Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => rememberPassword(event.target.value)}
                placeholder="MANAGER_ADMIN_PASSWORD"
                className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm font-bold outline-none ring-indigo-500/30 transition focus:ring-4 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={loadStatus}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg transition active:scale-95 dark:bg-white dark:text-slate-950"
            >
              {loadingStatus ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh Status
            </button>

            <div className="rounded-2xl border border-slate-200/70 bg-white/55 p-4 dark:border-white/10 dark:bg-slate-950/40">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <GitBranch size={15} />
                Target Repository
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {status?.githubOwner && status?.githubRepo
                  ? `${status.githubOwner}/${status.githubRepo}`
                  : "Not configured"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Branch: {status?.githubBranch || "main"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Quick Targets
              </div>
              {status?.targets?.map((target) => (
                <button
                  key={target.path}
                  type="button"
                  onClick={() => {
                    setPath(target.path);
                    if (canUseManager) void loadFile(target.path);
                  }}
                  className="rounded-2xl border border-white/50 bg-white/55 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white/80 dark:border-white/10 dark:bg-slate-950/35 dark:hover:bg-slate-900"
                >
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                    <FileText size={15} />
                    {target.label}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{target.path}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-3xl border border-white/50 bg-white/55 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 sm:p-5">
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  File Path
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={path}
                    onChange={(event) => setPath(event.target.value)}
                    placeholder="posts/my-new-post.md"
                    className="min-w-0 flex-1 rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm font-bold outline-none ring-indigo-500/30 transition focus:ring-4 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => loadFile()}
                    disabled={loadingFile}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingFile ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={useNewPostTemplate}
                    className="rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-3 text-sm font-black text-slate-800 transition active:scale-95 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100"
                  >
                    New Post
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  spellCheck={false}
                  className="mt-2 h-[48vh] min-h-[420px] w-full resize-y rounded-2xl border border-white/60 bg-slate-950 px-4 py-4 font-mono text-xs leading-6 text-slate-100 outline-none ring-indigo-500/30 transition focus:ring-4"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Commit Message
                </label>
                <input
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  placeholder={`Update ${path} from manager`}
                  className="mt-2 w-full rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm font-bold outline-none ring-indigo-500/30 transition focus:ring-4 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
                />
              </div>

              {message && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                    message.type === "success"
                      ? "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : message.type === "error"
                        ? "border-rose-300/70 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300"
                        : "border-sky-300/70 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-300"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-200/60 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                  Only allowlisted paths can be read or committed. Secrets are never returned to the browser.
                </div>
                <button
                  type="button"
                  onClick={saveFile}
                  disabled={saving || !content || !path}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-xl transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Commit to GitHub
                </button>
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 ${
        ok
          ? "border-emerald-300/70 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-amber-300/70 bg-amber-50/80 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300"
      }`}
    >
      {ok ? <CheckCircle2 size={15} /> : <ShieldAlert size={15} />}
      {label}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown manager error.";
}
