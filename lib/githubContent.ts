import { getManagerConfig } from "./managerAccess";

type GitHubContentResponse = {
  content?: string;
  encoding?: string;
  sha?: string;
  html_url?: string;
};

type GitHubErrorResponse = {
  message?: string;
  documentation_url?: string;
};

export function isGitHubConfigured() {
  const config = getManagerConfig();
  return Boolean(config.githubToken && config.githubOwner && config.githubRepo);
}

export async function readGitHubFile(relativePath: string) {
  const config = getManagerConfig();
  const response = await fetch(githubContentsUrl(relativePath), {
    method: "GET",
    headers: githubHeaders(config.githubToken),
    cache: "no-store",
  });

  if (response.status === 404) {
    return { exists: false, content: "", sha: undefined as string | undefined };
  }

  if (!response.ok) {
    throw new Error(await getGitHubError(response));
  }

  const data = (await response.json()) as GitHubContentResponse;
  const content =
    data.encoding === "base64" && data.content
      ? Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8")
      : "";

  return {
    exists: true,
    content,
    sha: data.sha,
  };
}

export async function writeGitHubFile(relativePath: string, content: string, message: string) {
  const config = getManagerConfig();
  const existing = await readGitHubFile(relativePath);
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: config.githubBranch,
  };

  if (existing.sha) {
    body.sha = existing.sha;
  }

  if (config.committerEmail) {
    body.committer = {
      name: config.committerName,
      email: config.committerEmail,
    };
  }

  const response = await fetch(githubContentsUrl(relativePath), {
    method: "PUT",
    headers: githubHeaders(config.githubToken),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getGitHubError(response));
  }

  const data = await response.json();
  return {
    path: relativePath,
    commitSha: data.commit?.sha || null,
    commitUrl: data.commit?.html_url || null,
    contentUrl: data.content?.html_url || null,
  };
}

function githubContentsUrl(relativePath: string) {
  const config = getManagerConfig();
  const pathPart = relativePath.split("/").map(encodeURIComponent).join("/");
  const branch = encodeURIComponent(config.githubBranch);

  return `https://api.github.com/repos/${encodeURIComponent(config.githubOwner)}/${encodeURIComponent(
    config.githubRepo
  )}/contents/${pathPart}?ref=${branch}`;
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function getGitHubError(response: Response) {
  let details = `${response.status} ${response.statusText}`;

  try {
    const data = (await response.json()) as GitHubErrorResponse;
    if (data.message) {
      details = `${details}: ${data.message}`;
    }
  } catch {
    // Keep status-only details when GitHub does not return JSON.
  }

  return details;
}
