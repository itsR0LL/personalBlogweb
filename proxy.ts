import { NextResponse, type NextProxy } from "next/server";

const collectPath = "/collect";

function trimmed(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function collectorEndpoint() {
  const baseUrl = trimmed(process.env.SECURITY_LOG_COLLECTOR_URL).replace(/\/$/, "");
  return baseUrl ? `${baseUrl}${collectPath}` : "";
}

function firstForwardedIp(value: string) {
  return value.split(",")[0]?.trim() || "";
}

function clientIpFromHeaders(request: Parameters<NextProxy>[0]) {
  return (
    trimmed(request.headers.get("cf-connecting-ip")) ||
    firstForwardedIp(trimmed(request.headers.get("x-forwarded-for"))) ||
    trimmed(request.headers.get("x-real-ip"))
  );
}

function shouldCollect(request: Parameters<NextProxy>[0]) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (!collectorEndpoint()) return false;
  if (!trimmed(process.env.SECURITY_LOG_INGEST_TOKEN)) return false;
  return true;
}

function collectAccessLog(request: Parameters<NextProxy>[0]) {
  const url = request.nextUrl;
  const endpoint = collectorEndpoint();
  const token = trimmed(process.env.SECURITY_LOG_INGEST_TOKEN);
  const cfRay = trimmed(request.headers.get("cf-ray"));
  const requestId = cfRay || crypto.randomUUID();

  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Security-Ingest-Token": token,
    },
    body: JSON.stringify({
      id: requestId,
      occurredAt: new Date().toISOString(),
      clientIp: clientIpFromHeaders(request),
      country: trimmed(request.headers.get("cf-ipcountry")),
      method: request.method,
      host: url.host,
      path: url.pathname,
      query: url.search.replace(/^\?/, ""),
      statusCode: 0,
      userAgent: trimmed(request.headers.get("user-agent")),
      referer: trimmed(request.headers.get("referer")),
      cfRay,
      source: "personal-blog",
    }),
  }).catch(() => undefined);
}

export const proxy: NextProxy = (request, event) => {
  if (shouldCollect(request)) {
    event.waitUntil(collectAccessLog(request));
  }
  return NextResponse.next();
};

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
