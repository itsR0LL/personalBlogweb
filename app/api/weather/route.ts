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
const apiHosts = [
  "https://api.qweather.com/v7/weather/now",
  "https://devapi.qweather.com/v7/weather/now",
];

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
    },
  });
}

export async function GET() {
  const token = process.env.QWEATHER_KEY;

  if (!token) {
    return json(
      {
        success: false,
        code: "missing_key",
        message: "当前运行环境未配置 QWEATHER_KEY",
      },
    );
  }

  for (const host of apiHosts) {
    try {
      const url = `${host}?location=${encodeURIComponent(locationId)}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Encoding": "gzip",
          "User-Agent": "PersonalBlogWeb-SelfHosted/1.0",
        },
        cache: "no-store",
      });

      const payload = await response.json();
      if (payload?.code !== "200" || !payload?.now) continue;

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
    } catch {
      continue;
    }
  }

  return json(
    {
      success: false,
      code: "upstream_failed",
      message: "天气服务暂时不可用，请稍后再试",
    },
  );
}
