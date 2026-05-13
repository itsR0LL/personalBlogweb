import {
  json,
  normalizeManagerPath,
  verifyManagerRequest,
} from "../../../../lib/managerAccess";
import { isGitHubConfigured, readGitHubFile, writeGitHubFile } from "../../../../lib/githubContent";

export const runtime = "nodejs";

const maxContentLength = 512 * 1024;

export async function GET(request: Request) {
  const auth = verifyManagerRequest(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const { searchParams } = new URL(request.url);
  let relativePath: string;

  try {
    relativePath = normalizeManagerPath(searchParams.get("path"));
  } catch (error) {
    return json({ error: getErrorMessage(error) }, 400);
  }

  try {
    if (!isGitHubConfigured()) {
      return json({ error: "GitHub read environment variables are not configured." }, 503);
    }

    const githubFile = await readGitHubFile(relativePath);
    return json({
      path: relativePath,
      content: githubFile.content,
      exists: githubFile.exists,
      source: "github",
    });
  } catch (error) {
    return json({ error: getErrorMessage(error) }, 500);
  }
}

export async function POST(request: Request) {
  const auth = verifyManagerRequest(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  if (!isGitHubConfigured()) {
    return json({ error: "GitHub write environment variables are not configured." }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be JSON." }, 400);
  }

  const payload = body as { path?: unknown; content?: unknown; message?: unknown };
  let relativePath: string;

  try {
    relativePath = normalizeManagerPath(payload.path);
  } catch (error) {
    return json({ error: getErrorMessage(error) }, 400);
  }

  if (typeof payload.content !== "string") {
    return json({ error: "content must be a string." }, 400);
  }

  if (payload.content.length > maxContentLength) {
    return json({ error: "content is too large for the manager endpoint." }, 413);
  }

  const message =
    typeof payload.message === "string" && payload.message.trim()
      ? payload.message.trim()
      : `Update ${relativePath} from manager`;

  try {
    const result = await writeGitHubFile(relativePath, payload.content, message);
    return json({ success: true, ...result });
  } catch (error) {
    return json({ error: getErrorMessage(error) }, 502);
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown manager error.";
}
