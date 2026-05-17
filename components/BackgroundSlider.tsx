"use client";

import { useEffect, useMemo, useState } from "react";
import { useRuntimeSiteConfig } from "./RuntimeConfigProvider";
import { useTheme } from "./ThemeProvider";

const randomDelay = () => 9000 + Math.floor(Math.random() * 5000);

const normalizeImages = (images?: string[]) =>
  Array.isArray(images) ? images.filter(Boolean) : [];

export default function BackgroundSlider() {
  const { isDark } = useTheme();
  const siteConfig = useRuntimeSiteConfig();
  const fallbackImages = useMemo(() => normalizeImages(siteConfig.bgImages), [siteConfig.bgImages]);
  const lightImages = useMemo(
    () => normalizeImages(siteConfig.lightBgImages || siteConfig.bgImages),
    [siteConfig.bgImages, siteConfig.lightBgImages]
  );
  const darkImages = useMemo(
    () => normalizeImages(siteConfig.darkBgImages || siteConfig.bgImages),
    [siteConfig.bgImages, siteConfig.darkBgImages]
  );
  const activeImages = isDark ? darkImages : lightImages;
  const inactiveImages = isDark ? lightImages : darkImages;
  const [index, setIndex] = useState(0);

  const imageCount = activeImages.length || fallbackImages.length;
  const safeIndex = imageCount > 0 ? index % imageCount : 0;

  useEffect(() => {
    if (imageCount <= 1) return;

    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % imageCount);
    }, randomDelay());

    return () => window.clearTimeout(timer);
  }, [safeIndex, imageCount, isDark]);

  useEffect(() => {
    const urls = [
      activeImages[safeIndex],
      activeImages[(safeIndex + 1) % Math.max(activeImages.length, 1)],
      inactiveImages[safeIndex % Math.max(inactiveImages.length, 1)],
    ].filter(Boolean);

    urls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
    });
  }, [activeImages, inactiveImages, safeIndex]);

  const renderGroup = (images: string[], group: "light" | "dark") =>
    images.map((img, i) => {
      const groupIsActive = group === (isDark ? "dark" : "light");
      const isCurrent = groupIsActive && i === safeIndex % images.length;
      const isNearCurrent =
        isCurrent ||
        Math.abs(i - safeIndex) <= 1 ||
        (safeIndex === 0 && i === images.length - 1) ||
        (safeIndex === images.length - 1 && i === 0);

      return (
        <div
          key={`${group}-${img}`}
          data-background-slide={`${group}-${i + 1}`}
          data-background-active={isCurrent ? "true" : "false"}
          className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out transform-gpu"
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: isCurrent ? 1 : 0,
            visibility: isNearCurrent ? "visible" : "hidden",
            willChange: "opacity",
          }}
        />
      );
    });

  return (
    <div className="absolute inset-0 z-[-10] overflow-hidden">
      {renderGroup(lightImages, "light")}
      {renderGroup(darkImages, "dark")}
    </div>
  );
}
