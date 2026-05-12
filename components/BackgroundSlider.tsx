"use client";

import { useEffect, useState } from "react";

import { siteConfig } from "../siteConfig";

type TimeThemeBackground = {
  id: string;
  label: string;
  hours: [number, number];
  image: string;
  source?: string;
  sourceUrl?: string;
};

function isHourInRange(hour: number, [start, end]: [number, number]) {
  if (start === end) return true;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function getActiveTimeTheme(hour: number, themes: TimeThemeBackground[]) {
  return themes.find((theme) => isHourInRange(hour, theme.hours)) ?? themes[0];
}

export default function BackgroundSlider() {
  const [index, setIndex] = useState(0);
  const [hour, setHour] = useState(() => new Date().getHours());
  const timeThemes = (siteConfig.timeThemeBackgrounds ?? []) as TimeThemeBackground[];
  const activeTheme = timeThemes.length > 0 ? getActiveTimeTheme(hour, timeThemes) : null;
  const images = activeTheme ? [activeTheme.image] : siteConfig.bgImages;
  const imageKey = images.join("|");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHour(new Date().getHours());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [imageKey]);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-[-10] overflow-hidden"
      data-time-theme={activeTheme?.id}
    >
      {images.map((img, i) => (
        <div
          key={img}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out transform-gpu"
          style={{
            backgroundImage: `url(${img})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            opacity: i === index ? 1 : 0,
            visibility:
              Math.abs(i - index) <= 1 || (i === images.length - 1 && index === 0)
                ? "visible"
                : "hidden",
          }}
        />
      ))}
    </div>
  );
}
