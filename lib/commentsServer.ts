import { randomUUID, timingSafeEqual } from "node:crypto";

const DEFAULT_TIMEOUT_MS = 8000;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

type TurnstileResult = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

function envValue(name: string) {
  return process.env[name]?.trim() || "";
}

export function getTurnstileSiteKey() {
  const configured = envValue("TURNSTILE_SITE_KEY");
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? "" : TURNSTILE_TEST_SITE_KEY;
}

function getTurnstileSecretKey() {
  const configured = envValue("TURNSTILE_SECRET_KEY");
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? "" : TURNSTILE_TEST_SECRET_KEY;
}

export function getVisitorIp(request: Request) {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function validateTurnstile(token: string, remoteIp: string) {
  const secret = getTurnstileSecretKey();
  if (!secret) {
    return { valid: false, status: 503, message: "留言安全验证尚未配置" };
  }
  if (!token || token.length > 2048) {
    return { valid: false, status: 400, message: "请先完成人机验证" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: remoteIp,
        idempotency_key: randomUUID(),
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      return { valid: false, status: 502, message: "人机验证服务暂时不可用" };
    }
    const result = (await response.json()) as TurnstileResult;
    if (!result.success) {
      return { valid: false, status: 403, message: "人机验证失败，请刷新后重试" };
    }
    if (result.action && result.action !== "comment_submit") {
      return { valid: false, status: 403, message: "人机验证场景不匹配" };
    }
    const expectedHostname = envValue("TURNSTILE_EXPECTED_HOSTNAME");
    if (expectedHostname && result.hostname !== expectedHostname) {
      return { valid: false, status: 403, message: "人机验证来源不匹配" };
    }
    return { valid: true, status: 200, message: "ok" };
  } catch {
    return { valid: false, status: 502, message: "人机验证请求超时，请稍后重试" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function commentsServiceRequest(path: string, init?: RequestInit) {
  const serviceUrl = envValue("COMMENTS_SERVICE_URL");
  const serviceToken = envValue("COMMENTS_SERVICE_TOKEN");
  if (!serviceUrl || !serviceToken) {
    return Response.json(
      { success: false, message: "评论服务尚未配置" },
      { status: 503 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const headers = new Headers(init?.headers);
  headers.set("X-Comments-Service-Token", serviceToken);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    return await fetch(new URL(path, serviceUrl), {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    return Response.json(
      { success: false, message: "评论服务暂时不可用" },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function passthroughJson(response: Response) {
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function isAdminRequestAuthorized(request: Request) {
  const expected = envValue("COMMENTS_ADMIN_TOKEN");
  const authorization = request.headers.get("authorization") || "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}
