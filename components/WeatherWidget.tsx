"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudLightning,
  CloudRain,
  Loader2,
  Snowflake,
  Sun,
  ThermometerSun,
  Wind,
} from "lucide-react";

type WeatherState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      city: string;
      temp: number;
      feelsLike?: number;
      text: string;
      icon: string;
      windDir?: string;
      windScale?: string;
      humidity?: number;
      obsTime?: string;
    }
  | {
      status: "error";
      message: string;
    };

function weatherIcon(iconCode: string) {
  const code = Number(iconCode);
  if (code === 100 || (code >= 150 && code <= 153)) return <Sun className="text-amber-400" size={42} />;
  if (code >= 300 && code <= 304) return <CloudLightning className="text-violet-300" size={42} />;
  if (code >= 300 && code <= 399) return <CloudRain className="text-blue-400" size={42} />;
  if (code >= 400 && code <= 499) return <Snowflake className="text-sky-200" size={42} />;
  if (code >= 200 && code <= 213) return <Wind className="text-cyan-300" size={42} />;
  return <Cloud className="text-slate-300" size={42} />;
}

function formatObsTime(value?: string) {
  if (!value) return "刚刚更新";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚更新";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} 更新`;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function fetchWeather() {
      try {
        const response = await fetch(`/api/weather?t=${Date.now()}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload?.success || !payload?.now) {
          throw new Error(payload?.message || "天气服务暂时不可用");
        }

        if (!active) return;
        setWeather({
          status: "ready",
          city: payload.location?.name || "当前位置",
          temp: Number(payload.now.temp),
          feelsLike: Number.isFinite(payload.now.feelsLike) ? Number(payload.now.feelsLike) : undefined,
          text: payload.now.text || "未知",
          icon: payload.now.icon || "999",
          windDir: payload.now.windDir,
          windScale: payload.now.windScale,
          humidity: Number.isFinite(payload.now.humidity) ? Number(payload.now.humidity) : undefined,
          obsTime: payload.now.obsTime,
        });
      } catch (error) {
        if (!active) return;
        setWeather({
          status: "error",
          message: error instanceof Error ? error.message : "天气服务暂时不可用",
        });
      }
    }

    fetchWeather();
    return () => {
      active = false;
    };
  }, []);

  const ready = weather.status === "ready";

  return (
    <section className="group relative flex h-full min-h-[160px] w-full overflow-hidden rounded-2xl border border-white/40 bg-white/35 p-4 shadow-xl backdrop-blur-md transition-[transform,color,background-color,border-color] duration-700 hover:scale-[1.01] dark:border-white/10 dark:bg-slate-800/45 sm:rounded-3xl sm:p-6">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-400/20 blur-3xl transition-colors duration-1000 group-hover:bg-amber-300/25 dark:bg-indigo-400/15" />
      <div className="absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-emerald-300/15 blur-3xl transition-colors duration-1000 group-hover:bg-sky-300/20" />

      {weather.status === "loading" && (
        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-300">
          <Loader2 className="animate-spin text-sky-400" size={28} />
          <span className="text-[10px] font-black uppercase tracking-[0.24em]">正在读取天气</span>
        </div>
      )}

      {weather.status === "error" && (
        <div className="relative z-10 flex w-full flex-col justify-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-500 dark:bg-white/10 dark:text-slate-300">
            <Cloud size={26} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">天气暂不可用</p>
          <h3 className="mt-2 text-lg font-black text-slate-800 dark:text-white">等一阵风</h3>
          <p className="mt-1 line-clamp-2 text-xs font-bold leading-relaxed text-slate-500 dark:text-slate-400">
            {weather.message}
          </p>
        </div>
      )}

      {ready && (
        <div className="relative z-10 flex w-full flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-500 dark:text-sky-300">
                今日天气
              </p>
              <h3 className="mt-2 truncate text-base font-black text-slate-800 dark:text-white">{weather.city}</h3>
              <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{formatObsTime(weather.obsTime)}</p>
            </div>
            <div className="drop-shadow-md transition-transform duration-700 group-hover:scale-105">
              {weatherIcon(weather.icon)}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tracking-tighter text-slate-950 dark:text-white">{weather.temp}</span>
              <span className="pb-1 text-lg font-black text-slate-500">°C</span>
              <span className="pb-1 text-sm font-black text-slate-500 dark:text-slate-300">{weather.text}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-black text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 rounded-xl bg-white/45 px-2.5 py-2 dark:bg-white/5">
                <ThermometerSun size={13} />
                体感 {weather.feelsLike ?? weather.temp}°
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-white/45 px-2.5 py-2 dark:bg-white/5">
                <Wind size={13} />
                {weather.windDir || "微风"} {weather.windScale || ""}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
