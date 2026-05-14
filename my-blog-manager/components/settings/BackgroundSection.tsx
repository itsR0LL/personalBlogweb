import { useRef, useState, type DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  CloudUpload,
  Image as ImageIcon,
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
} from 'lucide-react';
import { useToast } from '../ToastProvider';

type ThemeKey = 'light' | 'dark';

type BackgroundFormData = {
  [key: string]: unknown;
  useGradient?: boolean;
  bgImages?: string[];
  lightBgImages?: string[];
  darkBgImages?: string[];
  themeColors?: string[];
  backgroundBlurPx?: number;
  backgroundOverlayLight?: number;
  backgroundOverlayDark?: number;
  gradientIntensity?: number;
  gradientGlowBlurPx?: number;
  newBgUrl?: string;
  picBedUrl?: string;
  picBedToken?: string;
};

type BackgroundSectionProps = {
  formData: BackgroundFormData;
  handleUpdate: (field: string, value: unknown) => void;
  pushToQueue: (label: string, key?: string, value?: unknown) => void;
};

type SliderConfig = {
  key: 'backgroundBlurPx' | 'backgroundOverlayLight' | 'backgroundOverlayDark' | 'gradientIntensity' | 'gradientGlowBlurPx';
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
  help: string;
};

const DEFAULT_BACKGROUND_VISUALS = {
  backgroundBlurPx: 4,
  backgroundOverlayLight: 0.22,
  backgroundOverlayDark: 0.32,
  gradientIntensity: 0.48,
  gradientGlowBlurPx: 72,
};

const sliderConfigs: SliderConfig[] = [
  { key: 'backgroundBlurPx', label: '背景模糊', min: 0, max: 16, step: 1, suffix: 'px', help: '数值越低，背景图片越清晰。' },
  { key: 'backgroundOverlayLight', label: 'Light 遮罩', min: 0, max: 0.6, step: 0.01, suffix: '', help: '浅色模式白色雾面强度。' },
  { key: 'backgroundOverlayDark', label: 'Dark 遮罩', min: 0, max: 0.7, step: 0.01, suffix: '', help: '深色模式暗色压层强度。' },
  { key: 'gradientIntensity', label: '渐变深度', min: 0, max: 1, step: 0.01, suffix: '', help: '渐变色叠加在图片上的透明度。' },
  { key: 'gradientGlowBlurPx', label: '光晕柔化', min: 40, max: 140, step: 1, suffix: 'px', help: '背景光晕的扩散范围。' },
];

const getStringList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

const getNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeHex = (value: string) => value.trim();

const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value.trim());

export default function BackgroundSection({ formData, handleUpdate, pushToQueue }: BackgroundSectionProps) {
  const { showToast } = useToast();
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('light');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [newGradientColor, setNewGradientColor] = useState('#ffffff');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lightImages = getStringList(
    formData.lightBgImages?.length ? formData.lightBgImages : formData.bgImages
  );
  const darkImages = getStringList(formData.darkBgImages);
  const currentImages = activeTheme === 'light' ? lightImages : darkImages;
  const gradientColors = getStringList(formData.themeColors);
  const isGradientMode = Boolean(formData.useGradient);

  const backgroundVisuals = {
    backgroundBlurPx: getNumber(formData.backgroundBlurPx, DEFAULT_BACKGROUND_VISUALS.backgroundBlurPx),
    backgroundOverlayLight: getNumber(formData.backgroundOverlayLight, DEFAULT_BACKGROUND_VISUALS.backgroundOverlayLight),
    backgroundOverlayDark: getNumber(formData.backgroundOverlayDark, DEFAULT_BACKGROUND_VISUALS.backgroundOverlayDark),
    gradientIntensity: getNumber(formData.gradientIntensity, DEFAULT_BACKGROUND_VISUALS.gradientIntensity),
    gradientGlowBlurPx: getNumber(formData.gradientGlowBlurPx, DEFAULT_BACKGROUND_VISUALS.gradientGlowBlurPx),
  };

  const updateThemeImages = (theme: ThemeKey, images: string[]) => {
    const cleanedImages = images.map((item) => item.trim()).filter(Boolean);

    if (theme === 'light') {
      handleUpdate('lightBgImages', cleanedImages);
      handleUpdate('bgImages', cleanedImages);
      return;
    }

    handleUpdate('darkBgImages', cleanedImages);
  };

  const updateSlider = (config: SliderConfig, value: number) => {
    handleUpdate(config.key, clamp(value, config.min, config.max));
  };

  const removeBg = (index: number) => {
    const nextImages = currentImages.filter((_, itemIndex) => itemIndex !== index);
    updateThemeImages(activeTheme, nextImages);
    showToast(`已移除一张 ${activeTheme === 'light' ? 'Light' : 'Dark'} 背景图`, 'success');
  };

  const addImageToCurrentTheme = (url: string) => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      showToast('URL 不能为空', 'warning');
      return false;
    }

    if (currentImages.includes(trimmedUrl)) {
      showToast('这张图片已经在当前主题组中', 'warning');
      return false;
    }

    updateThemeImages(activeTheme, [...currentImages, trimmedUrl]);
    return true;
  };

  const addBgUrl = () => {
    if (addImageToCurrentTheme(formData.newBgUrl || '')) {
      handleUpdate('newBgUrl', '');
      showToast(`已添加到 ${activeTheme === 'light' ? 'Light' : 'Dark'} 背景组`, 'success');
    }
  };

  const updateGradientColor = (index: number, value: string) => {
    const nextColors = [...gradientColors];
    nextColors[index] = normalizeHex(value);
    handleUpdate('themeColors', nextColors);
  };

  const removeGradientColor = (index: number) => {
    if (gradientColors.length <= 2) {
      showToast('渐变至少需要保留 2 个颜色', 'warning');
      return;
    }

    handleUpdate('themeColors', gradientColors.filter((_, itemIndex) => itemIndex !== index));
    showToast('已移除一个渐变颜色', 'success');
  };

  const addGradientColor = () => {
    const nextColor = normalizeHex(newGradientColor);

    if (!isHexColor(nextColor)) {
      showToast('请输入标准 HEX 颜色，例如 #8b5cf6', 'warning');
      return;
    }

    if (gradientColors.includes(nextColor)) {
      showToast('这个颜色已经在渐变列表中', 'warning');
      return;
    }

    handleUpdate('themeColors', [...gradientColors, nextColor]);
    setNewGradientColor('#ffffff');
    showToast('已添加渐变颜色', 'success');
  };

  const handleFileUpload = async (file: File) => {
    const picUrl = formData.picBedUrl || '';
    const picToken = formData.picBedToken || '';

    if (!picToken) {
      showToast('无法上传：请先配置图床 Token', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('只能上传图片文件', 'warning');
      return;
    }

    setIsUploading(true);
    showToast('正在上传图片...', 'info');

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('url', picUrl);
      uploadData.append('token', picToken);

      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/picbed/upload`, {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        const fallbackMessage = data.directUrlAvailable === false ? '直链不可用，已自动使用可访问预览图。' : '';
        showToast(`上传完成。${fallbackMessage}请确认是否加入当前主题组`, 'success');
        setPendingImageUrl(data.url);
      } else {
        showToast(`上传失败：${data.message || '未知错误'}`, 'error');
      }
    } catch {
      showToast('无法连接到 Python 上传接口', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const confirmAddPendingImage = () => {
    if (!pendingImageUrl) return;

    if (addImageToCurrentTheme(pendingImageUrl)) {
      showToast(`已加入 ${activeTheme === 'light' ? 'Light' : 'Dark'} 背景组`, 'success');
      setPendingImageUrl(null);
    }
  };

  const cancelPendingImage = () => {
    setPendingImageUrl(null);
    showToast('已保留上传结果，但没有加入背景组', 'info');
  };

  const saveBackgroundConfig = () => {
    pushToQueue('视觉背景配置（需点击右上角更新本地后生效）', undefined, {
      useGradient: isGradientMode,
      themeColors: gradientColors,
      bgImages: lightImages,
      lightBgImages: lightImages,
      darkBgImages: darkImages,
      ...backgroundVisuals,
    });
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFileUpload(event.dataTransfer.files[0]);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-6 md:p-8 shadow-2xl flex flex-col gap-7 relative overflow-hidden"
    >
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <ImageIcon size={22} strokeWidth={2.4} className="text-indigo-500" />
            视觉背景配置
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">
            Light {lightImages.length} 张 / Dark {darkImages.length} 张 / 渐变 {gradientColors.length} 色
          </p>
          <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            图片始终作为底层背景；渐变开关只控制色彩叠加，不会再把图片背景卸载掉。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-2xl bg-slate-100/70 dark:bg-slate-800/70 p-1 border border-white/50 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => handleUpdate('useGradient', false)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                !isGradientMode
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/70'
              }`}
            >
              轻量图片背景
            </button>
            <button
              type="button"
              onClick={() => handleUpdate('useGradient', true)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                isGradientMode
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/70'
              }`}
            >
              图片 + 渐变叠加
            </button>
          </div>

          <button
            type="button"
            onClick={saveBackgroundConfig}
            className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            加入待保存队列
          </button>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div className="min-w-0 flex flex-col gap-6">
          <div className="rounded-3xl border border-white/40 dark:border-slate-700/50 bg-slate-100/45 dark:bg-slate-800/45 p-5 md:p-6 min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
              <div className="flex rounded-2xl bg-white/70 dark:bg-slate-900/60 p-1 border border-white/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setActiveTheme('light')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    activeTheme === 'light'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Sun size={14} strokeWidth={2.4} />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    activeTheme === 'dark'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Moon size={14} strokeWidth={2.4} />
                  Dark
                </button>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase">
                当前组：{currentImages.length} 张，新增图片会向下滚动排列
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {currentImages.map((url, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    key={`${activeTheme}-${url}-${index}`}
                    className="relative group rounded-2xl overflow-hidden aspect-video shadow-md border border-white/30 bg-slate-200 dark:bg-slate-900"
                  >
                    <img
                      src={url}
                      alt={`${activeTheme}-background-${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-sm">
                      {activeTheme === 'light' ? 'Light' : 'Dark'} {index + 1}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => removeBg(index)}
                        className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-xl hover:bg-red-600 scale-0 group-hover:scale-100 transition-transform"
                        aria-label="删除背景图"
                      >
                        <X size={20} strokeWidth={2.6} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {currentImages.length === 0 && (
                <div className="w-full h-36 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-400 text-xs font-bold">
                  当前主题组还没有背景图。
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/40 dark:border-slate-700/50 bg-white/45 dark:bg-slate-800/45 p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Palette size={18} strokeWidth={2.4} className="text-indigo-500" />
              <div>
                <p className="text-sm font-black text-slate-700 dark:text-slate-100">渐变叠加颜色</p>
                <p className="text-[10px] font-bold text-slate-400">
                  这些颜色会以透明层叠在图片上，强度由右侧“渐变深度”控制。
                </p>
              </div>
            </div>

            <div
              className="h-24 rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-inner mb-5"
              style={{
                background: `linear-gradient(135deg, ${gradientColors.join(', ')})`,
                opacity: backgroundVisuals.gradientIntensity,
              }}
            />

            <div className="space-y-3">
              {gradientColors.map((color, index) => (
                <div
                  key={`${color}-${index}`}
                  className="flex items-center gap-3 rounded-2xl bg-white/55 dark:bg-slate-900/45 border border-white/50 dark:border-slate-700/50 px-3 py-3"
                >
                  <input
                    type="color"
                    value={isHexColor(color) ? color : '#ffffff'}
                    onChange={(event) => updateGradientColor(index, event.target.value)}
                    className="h-10 w-12 shrink-0 rounded-xl border-none bg-transparent cursor-pointer"
                    aria-label={`编辑第 ${index + 1} 个渐变颜色`}
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(event) => updateGradientColor(index, event.target.value)}
                    className="min-w-0 flex-1 bg-white dark:bg-slate-950 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeGradientColor(index)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                    aria-label="删除渐变颜色"
                  >
                    <Trash2 size={16} strokeWidth={2.4} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="color"
                value={isHexColor(newGradientColor) ? newGradientColor : '#ffffff'}
                onChange={(event) => setNewGradientColor(event.target.value)}
                className="h-11 w-14 shrink-0 rounded-xl border-none bg-transparent cursor-pointer"
                aria-label="选择新渐变颜色"
              />
              <input
                type="text"
                value={newGradientColor}
                onChange={(event) => setNewGradientColor(event.target.value)}
                placeholder="#8b5cf6"
                className="min-w-0 flex-1 bg-white dark:bg-slate-950 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={addGradientColor}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <Plus size={14} strokeWidth={2.6} />
                添加
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-3xl p-5 border border-white/40 dark:border-slate-700/50 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                <Link2 size={12} strokeWidth={2.4} />
                添加到当前图片主题组
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.newBgUrl || ''}
                  onChange={(event) => handleUpdate('newBgUrl', event.target.value)}
                  className="min-w-0 flex-1 bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none shadow-inner text-slate-700 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={addBgUrl}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  添加
                </button>
              </div>
            </div>

            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`min-h-[132px] border-2 border-dashed rounded-3xl flex items-center justify-center gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden px-5 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-indigo-400'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(event) => event.target.files && handleFileUpload(event.target.files[0])}
                className="hidden"
                accept="image/*"
              />

              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                isDragging ? 'bg-indigo-500 text-white rotate-12' : 'bg-white dark:bg-slate-800 text-slate-500'
              }`}
              >
                {isUploading ? (
                  <Loader2 size={22} strokeWidth={2.4} className="animate-spin" />
                ) : (
                  <CloudUpload size={22} strokeWidth={2.4} />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {isUploading ? '正在上传到图床...' : '点击或拖入图片'}
                </p>
                <p className="mt-1 text-[10px] font-bold text-slate-400">
                  成功后可加入当前 {activeTheme === 'light' ? 'Light' : 'Dark'} 组。
                </p>
              </div>

              {isUploading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/40 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 p-5 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal size={18} strokeWidth={2.4} className="text-indigo-500" />
            <div>
              <p className="text-sm font-black text-slate-700 dark:text-slate-100">背景清晰度</p>
              <p className="text-[10px] font-bold text-slate-400">只影响全局背景层，不改页面卡片。</p>
            </div>
          </div>

          <div className="space-y-5">
            {sliderConfigs.map((config) => {
              const value = backgroundVisuals[config.key];
              const displayValue = config.step < 1 ? value.toFixed(2) : Math.round(value).toString();

              return (
                <label key={config.key} className="block">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-200">{config.label}</span>
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg">
                      {displayValue}{config.suffix}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={value}
                    onChange={(event) => updateSlider(config, Number(event.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <p className="mt-1 text-[10px] font-bold text-slate-400">{config.help}</p>
                </label>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-[11px] font-bold text-amber-700 dark:text-amber-300 leading-relaxed">
            当前按钮只是加入待保存队列。要写入配置并在刷新后回填滑块，请点击右上角操作队列里的“更新本地”。
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {pendingImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-md rounded-[40px] flex items-center justify-center p-6"
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/20">
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center justify-center gap-2">
                <CheckCircle2 size={20} strokeWidth={2.4} className="text-emerald-500" />
                上传完成
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
                是否加入当前 {activeTheme === 'light' ? 'Light' : 'Dark'} 背景组？
              </p>

              <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 shadow-inner border border-slate-200 dark:border-slate-700">
                <img src={pendingImageUrl} alt="preview" className="w-full h-full object-cover" />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelPendingImage}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  仅保留上传
                </button>
                <button
                  type="button"
                  onClick={confirmAddPendingImage}
                  className="flex-1 py-3 bg-pink-500 text-white rounded-xl text-xs font-black shadow-lg shadow-pink-500/30 hover:bg-pink-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} strokeWidth={2.4} />
                  <span>加入背景组</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
