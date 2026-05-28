import { NextResponse } from "next/server";

type QWeatherNow = {
  obsTime?: string;
  temp?: string;
  feelsLike?: string;
  icon?: string;
  text?: string;
  windDir?: string;
  windScale?: string;
  humidity?: string;
};

const locationId = process.env.QWEATHER_LOCATION || "101010100";
const locationName = process.env.QWEATHER_LOCATION_NAME || "北京";
const configuredApiHost = process.env.QWEATHER_API_HOST || process.env.QWEATHER_HOST || "";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
    },
  });
}

function normalizeApiHost(value: string) {
  const host = value.trim().replace(/\/+$/, "");
  if (!host) return "";
  return host.startsWith("http://") || host.startsWith("https://") ? host : `https://${host}`;
}

function apiEndpoints() {
  const apiHost = normalizeApiHost(configuredApiHost);
  if (apiHost) {
    return [`${apiHost}/v7/weather/now`];
  }
  return [
    "https://api.qweather.com/v7/weather/now",
    "https://devapi.qweather.com/v7/weather/now",
  ];
}

function authHeaders(token: string) {
  const mode = (process.env.QWEATHER_AUTH_MODE || "auto").toLowerCase();
  const looksLikeJwt = token.split(".").length === 3;
  const headers: Record<string, string> = {
    "Accept-Encoding": "gzip",
    "User-Agent": "PersonalBlogWeb-SelfHosted/1.0",
  };

  if (mode === "jwt" || (mode === "auto" && looksLikeJwt)) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers["X-QW-Api-Key"] = token;
  }

  return headers;
}

export async function GET() {
  const token = process.env.QWEATHER_KEY;

  if (!token) {
    return json({
      success: false,
      code: "missing_key",
      message: "当前运行环境未配置 QWEATHER_KEY",
    });
  }

  let lastError = "";

  for (const host of apiEndpoints()) {
    try {
      const url = `${host}?location=${encodeURIComponent(locationId)}`;
      const response = await fetch(url, {
        headers: authHeaders(token),
        cache: "no-store",
      });

      const payload = await response.json();
      if (payload?.code !== "200" || !payload?.now) {
        lastError = payload?.error?.title || payload?.error?.detail || payload?.code || `HTTP ${response.status}`;
        continue;
      }

      const now = payload.now as QWeatherNow;
      return json({
        success: true,
        code: "200",
        location: {
          id: locationId,
          name: locationName,
        },
        now: {
          obsTime: now.obsTime,
          temp: Number(now.temp),
          feelsLike: Number(now.feelsLike),
          icon: now.icon || "999",
          text: now.text || "未知",
          windDir: now.windDir || "",
          windScale: now.windScale || "",
          humidity: Number(now.humidity),
        },
        source: "qweather",
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : "unknown_error";
      continue;
    }
  }

  return json({
    success: false,
    code: "upstream_failed",
    message: lastError ? `天气服务暂时不可用：${lastError}` : "天气服务暂时不可用，请稍后再试",
  });
}
