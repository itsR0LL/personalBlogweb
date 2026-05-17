import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import BackgroundEffects from "../components/BackgroundEffects";
import { MusicProvider } from "../components/MusicProvider";
import FloatingPlayer from "../components/FloatingPlayer";
import ClickEffect from "../components/ClickEffect";
import BackgroundSlider from "../components/BackgroundSlider";
import FloatingThemePanel from "../components/FloatingThemePanel";
import SplashScreen from "../components/SplashScreen";
import CyberCat from '../components/CyberCat';
import DanmakuBackground from '../components/DanmakuBackground';
import MotionProvider from '../components/MotionProvider';
import ThemeTransitionVeil from '../components/motion/ThemeTransitionVeil';
import { RuntimeConfigProvider } from "../components/RuntimeConfigProvider";
import { getRuntimeSiteConfig } from "../lib/contentSource";

type BackgroundVisualConfig = {
  backgroundBlurPx?: number;
  backgroundOverlayLight?: number;
  backgroundOverlayDark?: number;
  gradientIntensity?: number;
  gradientGlowBlurPx?: number;
};

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const numericValue = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, numericValue));
};

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-serif",
  display: 'swap',
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const runtimeConfig = getRuntimeSiteConfig();
  return {
    title: runtimeConfig.title,
    description: runtimeConfig.bio,
    icons: {
      icon: runtimeConfig.faviconUrl,
      apple: runtimeConfig.faviconUrl,
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const runtimeConfig = getRuntimeSiteConfig();
  const visualConfig = runtimeConfig as typeof runtimeConfig & BackgroundVisualConfig;
  const backgroundBlurPx = clampNumber(visualConfig.backgroundBlurPx, 0, 16, 4);
  const backgroundOverlayLight = clampNumber(visualConfig.backgroundOverlayLight, 0, 0.6, 0.22);
  const backgroundOverlayDark = clampNumber(visualConfig.backgroundOverlayDark, 0, 0.7, 0.32);
  const gradientIntensity = clampNumber(visualConfig.gradientIntensity, 0, 1, 0.48);
  const gradientGlowBlurPx = clampNumber(visualConfig.gradientGlowBlurPx, 40, 140, 72);
  const themeColors = Array.isArray(runtimeConfig.themeColors) && runtimeConfig.themeColors.length > 0
    ? runtimeConfig.themeColors
    : ["#e2e8f0", "#bfdbfe", "#bbf7d0", "#fde68a"];

  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              #app-mount-root { opacity: 0; visibility: hidden; pointer-events: none; }
              html.splash-seen #app-mount-root { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
            `
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('hasSeenSplash') === 'true') {
                  document.documentElement.classList.add('splash-seen');
                }
              } catch (e) {}
            `
          }}
        />
      </head>

      <body className="w-full overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-[900ms] bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>
          <MotionProvider>
          <RuntimeConfigProvider config={runtimeConfig}>

          <SplashScreen />

          <MusicProvider>
            <div id="app-mount-root" className="flex-1 flex flex-col transition-opacity duration-[900ms]">
              <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                <BackgroundSlider />
                <div
                  className="absolute inset-0 z-[-9] opacity-100 dark:opacity-0 transition-opacity duration-[900ms]"
                  style={{
                    backgroundColor: `rgb(255 255 255 / ${backgroundOverlayLight})`,
                    backdropFilter: `blur(${backgroundBlurPx}px)`,
                    WebkitBackdropFilter: `blur(${backgroundBlurPx}px)`,
                  }}
                />
                <div
                  className="absolute inset-0 z-[-9] opacity-0 dark:opacity-100 transition-opacity duration-[900ms]"
                  style={{
                    backgroundColor: `rgb(15 23 42 / ${backgroundOverlayDark})`,
                  }}
                />

                <div
                  className="absolute inset-0 z-[-8] mix-blend-color transition-opacity duration-[900ms] transform-gpu"
                  style={{
                    background: `linear-gradient(-45deg, ${themeColors.join(', ')})`,
                    backgroundSize: '400% 400%',
                    opacity: runtimeConfig.useGradient ? gradientIntensity : Math.min(0.24, gradientIntensity * 0.35),
                    animation: 'gradientMove 15s ease infinite' // 🌟 全端保留渐变流动
                  }}
                ></div>

                {/* 👇 🌟 优化：手机端去掉了 mix-blend-overlay，但保留了 blur 模糊光晕，确保视觉不打折 */}
                <div
                  className="hidden md:block absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/40 dark:bg-indigo-900/20 rounded-full z-[-7] md:mix-blend-overlay"
                  style={{ filter: `blur(${gradientGlowBlurPx}px)` }}
                ></div>
                <div
                  className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/30 dark:bg-purple-900/30 rounded-full z-[-7] md:mix-blend-overlay"
                  style={{ filter: `blur(${gradientGlowBlurPx}px)` }}
                ></div>

                {/* 隐藏手机端高负载粒子特效 */}
                <div className="hidden md:block absolute inset-0 w-full h-full">
                  <BackgroundEffects />
                </div>
              </div>

              {/* 隐藏手机端弹幕 */}
              <div className="hidden md:block">
                <DanmakuBackground />
              </div>

              <div className="relative z-10 flex-1 flex flex-col">
                {children}
              </div>

              <div className="hidden md:block">
                <FloatingPlayer />
              </div>

              <FloatingThemePanel />
              <ThemeTransitionVeil />

              {/* 隐藏手机端点击粒子 */}
              <div className="hidden md:block">
                <ClickEffect />
              </div>
            </div>

            <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
              @keyframes gradientMove { 
                0% { background-position: 0% 50%; } 
                50% { background-position: 100% 50%; } 
                100% { background-position: 0% 50%; } 
              }
            `}} />
          </MusicProvider>

          <div className="hidden md:block">
            <CyberCat />
          </div>
          </RuntimeConfigProvider>
          </MotionProvider>

        </ThemeProvider>
      </body>
    </html>
  );
}
