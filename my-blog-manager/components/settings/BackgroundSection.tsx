"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  CloudUpload,
  ImageIcon,
  Link2,
  Loader2,
  Moon,
  Palette,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { useToast } from "../ToastProvider";

type ConfigValue = string | number | boolean | string[] | undefined;
type SettingsFormData = Record<string, ConfigValue>;

interface BackgroundSectionProps {
  formData: SettingsFormData;
  handleUpdate: (key: string, value: ConfigValue) => void;
  pushToQueue: (label: string, syncPath?: string, payload?: Record<string, ConfigValue>) => void;
}

type ThemeKey = "light" | "dark";

interface PendingImage {
  url: string;
  theme: ThemeKey;
}

interface SliderConfig {
  key:
    | "backgroundBlurPx"
    | "backgroundOverlayLight"
    | "backgroundOverlayDark"
    | "gradientIntensity"
    | "gradientGlowBlurPx";
  label: string;
  helper: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}

const imageSliderConfigs: SliderConfig[] = [
  {
    key: "backgroundBlurPx",
    label: "背景模糊",
    helper: "数值越低，图片细节越清晰。",
    min: 0,
    max: 16,
    step: 1,
    suffix: "px",
  },
  {
    key: "backgroundOverlayLight",
    label: "Light 遮罩",
    helper: "控制浅色模式白色遮罩强度。",
    min: 0,
    max: 0.6,
    step: 0.01,
    suffix: "",
  },
  {
    key: "backgroundOverlayDark",
    label: "Dark 遮罩",
    helper: "控制深色模式黑色遮罩强度。",
    min: 0,
    max: 0.7,
    step: 0.01,
    suffix: "",
  },
];

const gradientSliderConfigs: SliderConfig[] = [
  {
    key: "gradientIntensity",
    label: "渐变深度",
    helper: "控制渐变叠加层的不透明度。",
    min: 0,
    max: 1,
    step: 0.01,
    suffix: "",
  },
  {
    key: "gradientGlowBlurPx",
    label: "光晕柔化",
    helper: "控制渐变光晕的扩散范围。",
    min: 40,
    max: 140,
    step: 1,
    suffix: "px",
  },
];

const DEFAULT_LIGHT_IMAGES = [
  "/images/backgrounds/light-1.png",
  "/images/backgrounds/light-2.jpg",
  "/images/backgrounds/light-3.jpg",
  "/images/backgrounds/light-4.webp",
  "/images/backgrounds/light-5.jpg",
  "/images/backgrounds/light-6.jpg",
];

const DEFAULT_DARK_IMAGES = [
  "/images/backgrounds/dark-1.jpg",
  "/images/backgrounds/dark-2.jpg",
  "/images/backgrounds/dark-3.png",
  "/images/backgrounds/dark-4.jpg",
  "/images/backgrounds/dark-5.webp",
  "/images/backgrounds/dark-6.jpg",
];

const DEFAULT_GRADIENT_COLORS = ["#0f172a", "#1e3a8a", "#7c3aed", "#f472b6"];

const getStringList = (value: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(value)) return fallback;
  const next = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return next.length > 0 ? next : fallback;
};

const getNumber = (value: unknown, fallback: number) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeHex = (value: string) => {
  const trimmed = value.trim();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

const isHexColor = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

export default function BackgroundSection({ formData, handleUpdate, pushToQueue }: BackgroundSectionProps) {
  const { showToast } = useToast();
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("light");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [newGradientColor, setNewGradientColor] = useState("#8b5cf6");
  const [showImageToolsInGradient, setShowImageToolsInGradient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const lightImages = getStringList(formData.lightBgImages, getStringList(formData.bgImages, DEFAULT_LIGHT_IMAGES));
  const darkImages = getStringList(formData.darkBgImages, DEFAULT_DARK_IMAGES);
  const currentImages = activeTheme === "light" ? lightImages : darkImages;
  const gradientColors = getStringList(formData.themeColors, DEFAULT_GRADIENT_COLORS);
  const isGradientMode = Boolean(formData.useGradient);

  const backgroundVisuals = {
    backgroundBlurPx: clamp(getNumber(formData.backgroundBlurPx, 4), 0, 16),
    backgroundOverlayLight: clamp(getNumber(formData.backgroundOverlayLight, 0.22), 0, 0.6),
    backgroundOverlayDark: clamp(getNumber(formData.backgroundOverlayDark, 0.32), 0, 0.7),
    gradientIntensity: clamp(getNumber(formData.gradientIntensity, 0.48), 0, 1),
    gradientGlowBlurPx: clamp(getNumber(formData.gradientGlowBlurPx, 72), 40, 140),
  };

  const newBgUrl = typeof formData.newBgUrl === "string" ? formData.newBgUrl : "";
  const gradientPreview = gradientColors.length >= 2 ? gradientColors.join(", ") : "#e2e8f0, #bfdbfe";
  const activeThemeLabel = activeTheme === "light" ? "Light" : "Dark";

  const updateThemeImages = (theme: ThemeKey, images: string[]) => {
    if (theme === "light") {
      handleUpdate("lightBgImages", images);
      handleUpdate("bgImages", images);
      return;
    }

    handleUpdate("darkBgImages", images);
  };

  const updateSlider = (config: SliderConfig, rawValue: string) => {
    const nextValue = clamp(Number(rawValue), config.min, config.max);
    handleUpdate(config.key, nextValue);
  };

  const removeBg = (url: string) => {
    updateThemeImages(
      activeTheme,
      currentImages.filter((item) => item !== url),
    );
  };

  const addImageToTheme = (theme: ThemeKey, url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      showToast("请输入图片地址", "warning");
      return false;
    }

    const targetImages = theme === "light" ? lightImages : darkImages;
    if (targetImages.includes(trimmedUrl)) {
      showToast("该背景已存在", "warning");
      return false;
    }

    updateThemeImages(theme, [...targetImages, trimmedUrl]);
    return true;
  };

  const addBgUrl = () => {
    if (addImageToTheme(activeTheme, newBgUrl)) {
      handleUpdate("newBgUrl", "");
      showToast(`已加入 ${activeThemeLabel} 背景组`, "success");
    }
  };

  const updateGradientColor = (index: number, value: string) => {
    const next = [...gradientColors];
    next[index] = normalizeHex(value);
    handleUpdate("themeColors", next);
  };

  const addGradientColor = () => {
    const color = normalizeHex(newGradientColor);
    if (!isHexColor(color)) {
      showToast("请输入有效的 HEX 颜色", "warning");
      return;
    }

    handleUpdate("themeColors", [...gradientColors, color]);
    setNewGradientColor(color);
    showToast("渐变颜色已加入", "success");
  };

  const removeGradientColor = (index: number) => {
    if (gradientColors.length <= 2) {
      showToast("至少保留 2 个渐变颜色", "warning");
      return;
    }

    handleUpdate(
      "themeColors",
      gradientColors.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleFileUpload = async (file: File) => {
    const apiUrl = typeof formData.picBedUrl === "string" ? formData.picBedUrl : "";
    const token = typeof formData.picBedToken === "string" ? formData.picBedToken : "";
    const strategyId = typeof formData.picBedStrategyId === "string" ? formData.picBedStrategyId : "";

    if (!apiUrl || !token) {
      showToast("请先在图床引擎设置中补充 API 地址和 Token", "error");
      return;
    }

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_url", apiUrl);
    uploadForm.append("token", token);
    uploadForm.append("strategy_id", strategyId);

    setIsUploading(true);
    try {
      const response = await fetch("http://127.0.0.1:8012/api/picbed/upload", {
        method: "POST",
        body: uploadForm,
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.message || "上传失败");
      }

      if (data.directUrlAvailable === false) {
        showToast("图床原图直链不可访问，已使用缩略图地址", "warning");
      }

      setPendingImage({ url: data.url, theme: activeTheme });
      showToast(`上传成功，可加入 ${activeThemeLabel} 背景组`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "上传失败", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const confirmAddPendingImage = () => {
    if (!pendingImage) return;

    const targetLabel = pendingImage.theme === "light" ? "Light" : "Dark";
    if (addImageToTheme(pendingImage.theme, pendingImage.url)) {
      showToast(`已加入 ${targetLabel} 背景组`, "success");
      setPendingImage(null);
    }
  };

  const cancelPendingImage = () => {
    setPendingImage(null);
    showToast("图片已上传，但未加入背景组", "info");
  };

  const saveBackgroundConfig = () => {
    pushToQueue("视觉背景配置（需点击右上角更新本地后生效）", undefined, {
      useGradient: isGradientMode,
      themeColors: gradientColors,
      bgImages: lightImages,
      lightBgImages: lightImages,
      darkBgImages: darkImages,
      ...backgroundVisuals,
    });
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await handleFileUpload(file);
  };

  const renderModeButton = (mode: "image" | "gradient") => {
    const active = mode === "gradient" ? isGradientMode : !isGradientMode;
    const Icon = mode === "gradient" ? Sparkles : ImageIcon;
    const label = mode === "gradient" ? "图片 + 渐变" : "轻量图片";

    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => {
          handleUpdate("useGradient", mode === "gradient");
          setShowImageToolsInGradient(false);
        }}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
          active
            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
            : "text-slate-500 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-700/70"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    );
  };

  const renderThemeTabs = () => (
    <div className="flex rounded-2xl bg-white/70 p-1 dark:bg-slate-900/60" role="group" aria-label="背景主题组">
      <button
        type="button"
        aria-pressed={activeTheme === "light"}
        onClick={() => setActiveTheme("light")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
          activeTheme === "light"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-slate-800/80"
        }`}
      >
        <Sun className="h-4 w-4" />
        Light
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
          {lightImages.length}
        </span>
      </button>
      <button
        type="button"
        aria-pressed={activeTheme === "dark"}
        onClick={() => setActiveTheme("dark")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
          activeTheme === "dark"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-500 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-slate-800/80"
        }`}
      >
        <Moon className="h-4 w-4" />
        Dark
        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] text-cyan-700">
          {darkImages.length}
        </span>
      </button>
    </div>
  );

  const renderSliderControls = (configs: SliderConfig[], title: string, helper: string) => (
    <div className="rounded-3xl border border-white/40 bg-white/50 p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl bg-indigo-500/10 p-2 text-indigo-500">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-white">{title}</h4>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
      </div>

      <div className="space-y-5">
        {configs.map((config) => {
          const value = backgroundVisuals[config.key];
          const displayValue = config.suffix ? `${value}${config.suffix}` : value.toFixed(2);

          return (
            <div key={config.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{config.label}</p>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{config.helper}</p>
                </div>
                <span className="min-w-14 rounded-xl bg-white px-3 py-1 text-center text-xs font-black text-slate-700 shadow-sm dark:bg-white/10 dark:text-white">
                  {displayValue}
                </span>
              </div>
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={value}
                onChange={(event) => updateSlider(config, event.target.value)}
                className="h-2 w-full cursor-pointer accent-indigo-500"
                aria-label={config.label}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderImageCards = () => (
    <div className="grid max-h-[520px] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 custom-scrollbar">
      <AnimatePresence initial={false}>
        {currentImages.map((url, index) => (
          <motion.div
            key={`${activeTheme}-${url}`}
            layout
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className="group overflow-hidden rounded-2xl border border-white/30 bg-slate-200 shadow-md dark:bg-slate-900"
          >
            <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900">
              <img src={url} alt={`${activeThemeLabel} 背景 ${index + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-sm">
                {activeThemeLabel} {index + 1}
              </div>
              <button
                type="button"
                onClick={() => removeBg(url)}
                className="absolute right-3 top-3 rounded-full bg-red-500 p-2 text-white opacity-0 shadow-lg transition-all hover:bg-red-600 group-hover:opacity-100"
                aria-label={`删除 ${activeThemeLabel} 背景 ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="truncate px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400">{url}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderImageAddTools = () => (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="rounded-3xl border border-white/40 bg-white/50 p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50">
        <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">添加图片 URL</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={newBgUrl}
              onChange={(event) => handleUpdate("newBgUrl", event.target.value)}
              placeholder={`添加到 ${activeThemeLabel} 背景组`}
              className="w-full rounded-xl border-none bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 shadow-inner outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="button"
            onClick={addBgUrl}
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            添加
          </button>
        </div>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex min-h-[108px] flex-col items-center justify-center rounded-3xl border-2 border-dashed p-4 text-center transition-all ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-slate-300 bg-white/50 hover:border-indigo-400 hover:bg-slate-100/50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800/70"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) await handleFileUpload(file);
            event.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-60 dark:bg-white/10 dark:text-white"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
          {isUploading ? "上传中" : "上传图片"}
        </button>
        <p className="mt-2 text-[11px] font-bold text-slate-400">拖拽或选择文件，上传后确认加入当前主题组。</p>
      </div>
    </div>
  );

  const renderImageManager = (showEffectControls: boolean) => (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white">图片背景组</h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            当前管理 {activeThemeLabel} 图片。新增图片会向下排列，图片列表按纵向滚动浏览。
          </p>
        </div>
        <div className="w-full md:w-[320px]">{renderThemeTabs()}</div>
      </div>

      {renderImageCards()}
      {renderImageAddTools()}
      {showEffectControls &&
        renderSliderControls(imageSliderConfigs, "图片清晰度与遮罩", "这些参数直接影响主站和管理端的背景图片可见度。")}
    </div>
  );

  const renderGradientManager = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-black text-slate-800 dark:text-white">渐变叠加</h3>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          渐变只作为图片之上的透明叠加层，不会替换或删除 Light/Dark 图片背景。
        </p>
      </div>

      <div
        className="min-h-[180px] rounded-3xl border border-white/50 shadow-inner dark:border-slate-700/50"
        style={{
          background: `linear-gradient(135deg, ${gradientPreview})`,
        }}
      />

      <div className="rounded-3xl border border-white/40 bg-white/50 p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white">渐变颜色</h4>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">至少保留 2 个颜色。</p>
          </div>
          <Palette className="h-5 w-5 text-indigo-500" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {gradientColors.map((color, index) => (
            <div
              key={`${color}-${index}`}
              className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/55 p-3 dark:border-slate-700/50 dark:bg-slate-900/45"
            >
              <input
                type="color"
                value={isHexColor(color) ? normalizeHex(color) : "#8b5cf6"}
                onChange={(event) => updateGradientColor(index, event.target.value)}
                className="h-10 w-12 cursor-pointer rounded-xl border-none bg-transparent"
                aria-label={`渐变颜色 ${index + 1}`}
              />
              <input
                value={color}
                onChange={(event) => updateGradientColor(index, event.target.value)}
                className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-xs font-black uppercase outline-none dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={() => removeGradientColor(index)}
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                aria-label={`删除渐变颜色 ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={newGradientColor}
            onChange={(event) => setNewGradientColor(event.target.value)}
            placeholder="#8b5cf6"
                className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-sm font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950"
          />
          <button
            type="button"
            onClick={addGradientColor}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            新增颜色
          </button>
        </div>
      </div>

      {renderSliderControls(gradientSliderConfigs, "渐变强度", "这些参数只控制渐变叠加层和光晕，不会覆盖图片背景。")}
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="relative flex flex-col gap-7 overflow-hidden rounded-[40px] border border-white/50 bg-white/40 p-6 shadow-2xl backdrop-blur-2xl dark:border-slate-800/50 dark:bg-slate-900/40 md:p-8"
    >
      <div className="relative z-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-800 dark:text-white">
              <ImageIcon className="h-[22px] w-[22px] text-indigo-500" />
              视觉背景配置
            </h2>
            <div>
              <p className="mt-2 text-[10px] font-bold uppercase text-slate-400">
                Light {lightImages.length} 张 / Dark {darkImages.length} 张 / 渐变 {gradientColors.length} 色
              </p>
              <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                图片始终作为底层保留；渐变模式只是额外叠加透明氛围层。
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex rounded-2xl border border-white/50 bg-slate-100/70 p-1 dark:border-slate-700/50 dark:bg-slate-800/70">
              {renderModeButton("image")}
              {renderModeButton("gradient")}
            </div>
            <button
              type="button"
              onClick={saveBackgroundConfig}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              加入待保存队列
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/40 bg-slate-100/45 p-5 dark:border-slate-700/50 dark:bg-slate-800/45 md:p-6">
            {!isGradientMode ? renderImageManager(true) : renderGradientManager()}
          </div>

          {isGradientMode && (
            <div className="rounded-3xl border border-white/40 bg-white/45 p-5 dark:border-slate-700/50 dark:bg-slate-800/45 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">底图图片组</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    当前模式下先聚焦渐变；需要增删底图时再展开图片管理。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImageToolsInGradient((value) => !value)}
                  className="rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  {showImageToolsInGradient ? "收起底图管理" : "展开底图管理"}
                </button>
              </div>

              {showImageToolsInGradient ? (
                <div className="mt-5">{renderImageManager(false)}</div>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {(["light", "dark"] as ThemeKey[]).map((theme) => {
                    const images = theme === "light" ? lightImages : darkImages;
                    return (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setActiveTheme(theme)}
                        className={`overflow-hidden rounded-[1.75rem] border p-3 text-left transition-all ${
                          activeTheme === theme
                            ? "border-indigo-300 bg-white shadow-lg shadow-indigo-100 dark:border-indigo-400/50 dark:bg-slate-900/60"
                            : "border-white/50 bg-white/70 hover:border-indigo-200 dark:border-slate-700/50 dark:bg-slate-900/40"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-black text-slate-800 dark:text-white">
                            {theme === "light" ? "Light 底图" : "Dark 底图"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">
                            {images.length} 张
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {images.slice(0, 3).map((url, index) => (
                            <div key={`${theme}-thumb-${url}`} className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                              <img src={url} alt={`${theme} 底图 ${index + 1}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="h-fit rounded-3xl border border-white/40 bg-white/50 p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-500/10 p-2 text-indigo-500">
                {isGradientMode ? <Sparkles className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">当前工作区</h3>
                <p className="text-xs font-bold text-slate-400">{isGradientMode ? "图片 + 渐变叠加" : "轻量图片背景"}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
                <span className="font-bold text-slate-500 dark:text-slate-400">Light 图片</span>
                <span className="font-black text-slate-800 dark:text-white">{lightImages.length} 张</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
                <span className="font-bold text-slate-500 dark:text-slate-400">Dark 图片</span>
                <span className="font-black text-slate-800 dark:text-white">{darkImages.length} 张</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
                <span className="font-bold text-slate-500 dark:text-slate-400">背景模糊</span>
                <span className="font-black text-slate-800 dark:text-white">{backgroundVisuals.backgroundBlurPx}px</span>
              </div>
              {isGradientMode && (
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
                  <span className="font-bold text-slate-500 dark:text-slate-400">渐变深度</span>
                  <span className="font-black text-slate-800 dark:text-white">
                    {backgroundVisuals.gradientIntensity.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[11px] font-bold leading-relaxed text-amber-700 dark:text-amber-300">
              保存后仍需点击页面右上角的更新本地，主站和管理端才会读取新的视觉配置。
            </p>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {pendingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900"
            >
              <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800">
                <img src={pendingImage.url} alt="待加入背景" className="h-full w-full object-cover" />
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">是否加入背景组？</h3>
                  <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                    图片已上传到图床。确认后会加入 {pendingImage.theme === "light" ? "Light" : "Dark"} 背景组。
                  </p>
                </div>
                <p className="break-all rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:bg-white/5">
                  {pendingImage.url}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={cancelPendingImage}
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition-all hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    只上传，不加入背景
                  </button>
                  <button
                    type="button"
                    onClick={confirmAddPendingImage}
                    className="flex-1 rounded-2xl bg-pink-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02]"
                  >
                    加入 {pendingImage.theme === "light" ? "Light" : "Dark"} 组
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
