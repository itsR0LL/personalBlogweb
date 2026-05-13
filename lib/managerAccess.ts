import crypto from "crypto";

export type ManagerFileTarget = {
  label: string;
  path: string;
  description: string;
};

export const managerFileTargets: ManagerFileTarget[] = [
  {
    label: "Site Config",
    path: "siteConfig.ts",
    description: "Global title, profile, theme, background, music, footer, and assistant settings.",
  },
  {
    label: "Albums",
    path: "data/albums.ts",
    description: "Photo wall albums and image metadata.",
  },
  {
    label: "Friends",
    path: "data/friends.ts",
    description: "Friend links shown on the friends page.",
  },
  {
    label: "Projects",
    path: "data/projects.ts",
    description: "Project cards and metadata.",
  },
  {
    label: "About Page",
    path: "app/about/about.md",
    description: "Markdown content for the about page.",
  },
];

const allowedExactPaths = new Set([
  "siteConfig.ts",
  "data/albums.ts",
  "data/friends.ts",
  "data/projects.ts",
  "app/about/about.md",
  "USER_MANUAL.md",
  "DEPLOYMENT.md",
]);

const allowedPatterns = [
  /^posts\/[a-z0-9][a-z0-9._-]*\.md$/i,
  /^chatters\/[a-z0-9][a-z0-9._-]*\.md$/i,
  /^moments\/[a-z0-9][a-z0-9._-]*\.md$/i,
];

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function getManagerConfig() {
  return {
    adminPassword: (process.env.MANAGER_ADMIN_PASSWORD || "").trim(),
    githubToken: (process.env.GITHUB_TOKEN || "").trim(),
    githubOwner: (process.env.GITHUB_OWNER || "").trim(),
    githubRepo: (process.env.GITHUB_REPO || "").trim(),
    githubBranch: (process.env.GITHUB_BRANCH || "main").trim(),
    committerName: (process.env.GITHUB_COMMITTER_NAME || "R0L1 Blog Manager").trim(),
    committerEmail: (process.env.GITHUB_COMMITTER_EMAIL || "").trim(),
  };
}

export function getManagerStatus() {
  const config = getManagerConfig();

  return {
    managerEnabled: Boolean(config.adminPassword),
    githubConfigured: Boolean(config.githubToken && config.githubOwner && config.githubRepo),
    githubOwner: config.githubOwner || null,
    githubRepo: config.githubRepo || null,
    githubBranch: config.githubBranch,
    targets: managerFileTargets,
    writablePatterns: ["posts/*.md", "chatters/*.md", "moments/*.md"],
  };
}

export function verifyManagerRequest(request: Request) {
  const expected = getManagerConfig().adminPassword;
  if (!expected) {
    return {
      ok: false as const,
      status: 503,
      error: "MANAGER_ADMIN_PASSWORD is not configured.",
    };
  }

  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!provided || !safeEqual(provided, expected)) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid manager password.",
    };
  }

  return { ok: true as const };
}

export function normalizeManagerPath(input: unknown) {
  if (typeof input !== "string") {
    throw new Error("path must be a string.");
  }

  const normalized = input.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("\0") || normalized.includes("..") || isAbsolutePath(normalized)) {
    throw new Error("Invalid manager file path.");
  }

  if (!isAllowedManagerPath(normalized)) {
    throw new Error("Path is outside the manager write allowlist.");
  }

  return normalized;
}

function isAllowedManagerPath(relativePath: string) {
  if (allowedExactPaths.has(relativePath)) return true;
  return allowedPatterns.some((pattern) => pattern.test(relativePath));
}

function isAbsolutePath(relativePath: string) {
  return relativePath.startsWith("/") || /^[a-z]:\//i.test(relativePath) || relativePath.startsWith("//");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
