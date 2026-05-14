import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  CloudUpload,
  Image as ImageIcon,
  Link2,
  Loader2,
  Moon,
  Sparkles,
  Sun,
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
  newBgUrl?: string;
  picBedUrl?: string;
  picBedToken?: string;
};

type BackgroundSectionProps = {
  formData: BackgroundFormData;
  handleUpdate: (field: string, value: unknown) => void;
  pushToQueue: (label: string, key?: string, value?: unknown) => void;
};

const getImageList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

export default function BackgroundSection({ formData, handleUpdate, pushToQueue }: BackgroundSectionProps) {
  const { showToast } = useToast();
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('light');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lightImages = getImageList(
    formData.lightBgImages?.length ? formData.lightBgImages : formData.bgImages
  );
  const darkImages = getImageList(formData.darkBgImages);
  const currentImages = activeTheme === 'light' ? lightImages : darkImages;
  const isGradientMode = Boolean(formData.useGradient);

  const updateThemeImages = (theme: ThemeKey, images: string[]) => {
    const cleanedImages = images.filter(Boolean);

    if (theme === 'light') {
      handleUpdate('lightBgImages', cleanedImages);
      handleUpdate('bgImages', cleanedImages);
      return;
    }

    handleUpdate('darkBgImages', cleanedImages);
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
        showToast('上传完成，请确认是否加入当前主题组', 'success');
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
    pushToQueue('视觉背景图', undefined, {
      useGradient: isGradientMode,
      bgImages: lightImages,
      lightBgImages: lightImages,
      darkBgImages: darkImages,
    });
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl flex flex-col gap-8 relative overflow-hidden"
    >
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <ImageIcon size={22} strokeWidth={2.4} className="text-indigo-500" />
            视觉背景配置
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">
            Light {lightImages.length} 张 / Dark {darkImages.length} 张
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
              图片背景
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
              渐变背景
            </button>
          </div>

          <button
            type="button"
            onClick={saveBackgroundConfig}
            className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            暂存背景修改
          </button>
        </div>
      </header>

      {isGradientMode ? (
        <div className="relative z-10 rounded-3xl border border-white/40 dark:border-slate-700/50 bg-white/45 dark:bg-slate-800/45 p-6">
          <p className="text-sm font-black text-slate-700 dark:text-slate-100 mb-4">
            当前运行时使用渐变背景。图片组会保留，但不会显示。
          </p>
          <div className="flex flex-wrap gap-3">
            {getImageList(formData.themeColors).map((color) => (
              <div
                key={color}
                className="h-12 w-24 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-inner"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 relative z-10">
          <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-3xl p-6 custom-scrollbar max-h-[520px] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-5">
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
                当前组：{currentImages.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {currentImages.map((url: string, index: number) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    key={`${activeTheme}-${url}-${index}`}
                    className="relative group rounded-2xl overflow-hidden aspect-video shadow-md border border-white/20 bg-slate-200 dark:bg-slate-900"
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
                        aria-label="Delete background image"
                      >
                        <X size={20} strokeWidth={2.6} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {currentImages.length === 0 && (
              <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-400 text-xs font-bold">
                当前主题组还没有背景图。
              </div>
            )}
          </div>

          <div className="space-y-6 flex flex-col relative">
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-3xl p-5 border border-white/40 dark:border-slate-700/50 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                <Link2 size={12} strokeWidth={2.4} />
                添加到当前主题组
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.newBgUrl || ''}
                  onChange={(e) => handleUpdate('newBgUrl', e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none shadow-inner text-slate-700 dark:text-slate-100"
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
              className={`flex-1 min-h-[220px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                  : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-indigo-400'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                className="hidden"
                accept="image/*"
              />

              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-xl transition-all duration-300 ${
                  isDragging ? 'bg-indigo-500 text-white rotate-12' : 'bg-white dark:bg-slate-800 text-slate-500'
                }`}
              >
                {isUploading ? (
                  <Loader2 size={28} strokeWidth={2.4} className="animate-spin" />
                ) : (
                  <CloudUpload size={28} strokeWidth={2.4} />
                )}
              </div>

              <div className="text-center z-10 px-6">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {isUploading ? '正在上传到图床...' : '点击或拖入图片'}
                </p>
                <p className="mt-2 text-[10px] font-bold text-slate-400">
                  成功后会加入当前选中的 {activeTheme === 'light' ? 'Light' : 'Dark'} 组。
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
      )}

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
                  仅上传
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
