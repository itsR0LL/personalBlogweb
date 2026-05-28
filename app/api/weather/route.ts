import { NextResponse } from "next/server";

type OpenMeteoCurrent = {
  time?: string;
  temperature_2m?: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
};

const latitude = process.env.WEATHER_LATITUDE || "30.5728";
const longitude = process.env.WEATHER_LONGITUDE || "104.0668";
const locationName = process.env.WEATHER_LOCATION_NAME || process.env.QWEATHER_LOCATION_NAME || "成都";
const timezone = process.env.WEATHER_TIMEZONE || "Asia/Shanghai";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
    },
  });
}

function weatherText(code: number) {
  if (code === 0) return "晴";
  if ([1, 2].includes(code)) return "少云";
  if (code === 3) return "阴";
  if ([45, 48].includes(code)) return "有雾";
  if ([51, 53, 55].includes(code)) return "毛毛雨";
  if ([56, 57].includes(code)) return "冻毛毛雨";
  if ([61, 63].includes(code)) return "小雨";
  if ([65, 66, 67].includes(code)) return "大雨";
  if ([71, 73, 75, 77].includes(code)) return "降雪";
  if ([80, 81, 82].includes(code)) return "阵雨";
  if ([85, 86].includes(code)) return "阵雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "未知";
}

function weatherIcon(code: number) {
  if (code === 0) return "100";
  if ([1, 2].includes(code)) return "101";
  if (code === 3 || [45, 48].includes(code)) return "104";
  if ([95, 96, 99].includes(code)) return "302";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "305";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "400";
  return "999";
}

function windDirection(degrees?: number) {
  if (!Number.isFinite(degrees)) return "";
  const directions = ["北风", "东北风", "东风", "东南风", "南风", "西南风", "西风", "西北风"];
  const index = Math.round((degrees as number) / 45) % 8;
  return directions[index];
}

function windScale(speedKmh?: number) {
  if (!Number.isFinite(speedKmh)) return "";
  const speed = speedKmh as number;
  if (speed < 1) return "0级";
  if (speed < 6) return "1级";
  if (speed < 12) return "2级";
  if (speed < 20) return "3级";
  if (speed < 29) return "4级";
  if (speed < 39) return "5级";
  if (speed < 50) return "6级";
  if (speed < 62) return "7级";
  return "8级以上";
}

export async function GET() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
  );
  url.searchParams.set("timezone", timezone);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "PersonalBlogWeb-SelfHosted/1.0",
      },
    });
    const payload = await response.json();
    const current = payload?.current as OpenMeteoCurrent | undefined;

    if (!response.ok || !current) {
      return json({
        success: false,
        code: "upstream_failed",
        message: payload?.reason || payload?.error || `天气服务暂时不可用：HTTP ${response.status}`,
      });
    }

    const code = Number(current.weather_code ?? -1);
    return json({
      success: true,
      code: "200",
      location: {
        id: `${latitude},${longitude}`,
        name: locationName,
      },
      now: {
        obsTime: current.time,
        temp: Number(current.temperature_2m),
        feelsLike: Number(current.apparent_temperature),
        icon: weatherIcon(code),
        text: weatherText(code),
        windDir: windDirection(current.wind_direction_10m),
        windScale: windScale(current.wind_speed_10m),
        humidity: Number(current.relative_humidity_2m),
      },
      source: "open-meteo",
    });
  } catch (error) {
    return json({
      success: false,
      code: "upstream_failed",
      message: error instanceof Error ? `天气服务暂时不可用：${error.message}` : "天气服务暂时不可用，请稍后再试",
    });
  }
}
