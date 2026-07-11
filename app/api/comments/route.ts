import {
  commentsServiceRequest,
  getVisitorIp,
  passthroughJson,
  validateTurnstile,
} from "../../../lib/commentsServer";

export const dynamic = "force-dynamic";

const CHANNELS = new Set(["music", "guestbook"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const channel = url.searchParams.get("channel") || "";
  if (!CHANNELS.has(channel)) {
    return Response.json({ success: false, message: "评论频道无效" }, { status: 400 });
  }
  const page = url.searchParams.get("page") || "1";
  const pageSize = url.searchParams.get("pageSize") || "20";
  const response = await commentsServiceRequest(
    `/api/public/comments?channel=${encodeURIComponent(channel)}&page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`,
  );
  return passthroughJson(response);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ success: false, message: "请求内容不是有效 JSON" }, { status: 400 });
  }

  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
  const visitorIp = getVisitorIp(request);
  const validation = await validateTurnstile(turnstileToken, visitorIp);
  if (!validation.valid) {
    return Response.json(
      { success: false, message: validation.message },
      { status: validation.status },
    );
  }

  const payload = {
    channel: body.channel,
    authorName: body.authorName,
    content: body.content,
    song: body.song ?? null,
  };
  const response = await commentsServiceRequest("/api/public/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Visitor-IP": visitorIp,
      "User-Agent": request.headers.get("user-agent") || "unknown",
    },
    body: JSON.stringify(payload),
  });
  return passthroughJson(response);
}
