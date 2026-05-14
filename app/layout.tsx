import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import BackgroundEffects from "../components/BackgroundEffects";
import { MusicProvider } from "../components/MusicProvider";
import FloatingPlayer from "../components/FloatingPlayer";
import { siteConfig } from "../siteConfig";
import ClickEffect from "../components/ClickEffect";
import BackgroundSlider from "../components/BackgroundSlider";
import FloatingThemePanel from "../components/FloatingThemePanel";
import SplashScreen from "../components/SplashScreen";
import CyberCat from '../components/CyberCat';
import DanmakuBackground from '../components/DanmakuBackground';

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

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.bio,
  icons: {
    icon: siteConfig.faviconUrl,
    apple: siteConfig.faviconUrl,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const visualConfig = siteConfig as typeof siteConfig & BackgroundVisualConfig;
  const backgroundBlurPx = clampNumber(visualConfig.backgroundBlurPx, 0, 16, 4);
  const backgroundOverlayLight = clampNumber(visualConfig.backgroundOverlayLight, 0, 0.6, 0.22);
  const backgroundOverlayDark = clampNumber(visualConfig.backgroundOverlayDark, 0, 0.7, 0.32);
  const gradientIntensity = clampNumber(visualConfig.gradientIntensity, 0, 1, 0.48);
  const gradientGlowBlurPx = clampNumber(visualConfig.gradientGlowBlurPx, 40, 140, 72);

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

      <body className="w-full overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>

          <SplashScreen />

          <MusicProvider>
            <div id="app-mount-root" className="flex-1 flex flex-col transition-opacity duration-1000">
              <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                {!siteConfig.useGradient && <BackgroundSlider />}
                <div
                  className="absolute inset-0 z-[-9] opacity-100 dark:opacity-0 transition-opacity duration-1000"
                  style={{
                    backgroundColor: `rgb(255 255 255 / ${backgroundOverlayLight})`,
                    backdropFilter: `blur(${backgroundBlurPx}px)`,
                    WebkitBackdropFilter: `blur(${backgroundBlurPx}px)`,
                  }}
                />
                <div
                  className="absolute inset-0 z-[-9] opacity-0 dark:opacity-100 transition-opacity duration-1000"
                  style={{
                    backgroundColor: `rgb(15 23 42 / ${backgroundOverlayDark})`,
                  }}
                />

                <div
                  className="absolute inset-0 z-[-8] mix-blend-color transition-opacity duration-1000 transform-gpu"
                  style={{
                    background: `linear-gradient(-45deg, ${siteConfig.themeColors.join(', ')})`,
                    backgroundSize: '400% 400%',
                    opacity: siteConfig.useGradient ? gradientIntensity : gradientIntensity * 0.45,
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

        </ThemeProvider>
      </body>
    </html>
  );
}
