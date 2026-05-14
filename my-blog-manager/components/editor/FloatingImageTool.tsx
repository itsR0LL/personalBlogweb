"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  Copy,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import { useToast } from "../ToastProvider";
import { siteConfig } from "../../siteConfig";

interface FloatingImageToolProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string) => void;
}

type ImageToolTab = "library" | "upload" | "url";

interface PicBedImage {
  key?: string;
  name: string;
  url: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  date?: string;
  directUrlAvailable?: boolean;
}

interface SiteConfigWithPicBed {
  picBedUrl?: string;
  picBedToken?: string;
}

interface BackendConfig {
  api_port: number;
}

const getPicBedConfig = () => ({
  url: (siteConfig as SiteConfigWithPicBed).picBedUrl || "",
  token: (siteConfig as SiteConfigWithPicBed).picBedToken || "",
});

const readBackendConfig = async () => {
  const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
  return configRes.json() as Promise<BackendConfig>;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "未知错误";

export default function FloatingImageTool({ isOpen, onClose, onInsert }: FloatingImageToolProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ImageToolTab>("library");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<PicBedImage[]>([]);
  const [libraryMessage, setLibraryMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<PicBedImage | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadLibrary = async () => {
    const { url, token } = getPicBedConfig();

    if (!url || !token) {
      setLibraryImages([]);
      setLibraryMessage("请先在设置页配置图床 API 地址和 Token");
      return;
    }

    setIsLoadingLibrary(true);
    setLibraryMessage("");

    try {
      const configData = await readBackendConfig();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/picbed/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, token, page: 1 }),
      });

      const data = await res.json();

      if (data.success) {
        const images = Array.isArray(data.images) ? data.images : [];
        setLibraryImages(images);
        setLibraryMessage(images.length ? "" : "当前图床账号暂无图片");
      } else {
        setLibraryImages([]);
        setLibraryMessage(data.message || "图库读取失败");
      }
    } catch (error: unknown) {
      setLibraryImages([]);
      setLibraryMessage(`连接异常：${getErrorMessage(error)}`);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("library");
    setUploadedUrl("");
    setSelectedImage(null);
    setExternalUrl("");
    loadLibrary();
  }, [isOpen]);

  const selectImage = (image: PicBedImage) => {
    setUploadedUrl(image.url);
    setSelectedImage(image);
  };

  const handleFileUpload = async (file: File) => {
    const { url, token } = getPicBedConfig();

    if (!url || !token) {
      showToast("请先配置图床 API 地址和 Token", "error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("只能上传图片文件", "warning");
      return;
    }

    setIsUploading(true);
    showToast("正在上传到图床...", "info");

    try {
      const configData = await readBackendConfig();
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("url", url);
      uploadData.append("token", token);

      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/picbed/upload`, {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();

      if (data.success && data.url) {
        const image = {
          key: data.originalUrl || data.url,
          name: file.name,
          url: data.url,
          originalUrl: data.originalUrl,
          thumbnailUrl: data.thumbnailUrl,
          directUrlAvailable: data.directUrlAvailable,
        };
        setUploadedUrl(data.url);
        setSelectedImage(image);
        showToast(data.directUrlAvailable === false ? "上传成功，原始直链不可访问，已使用可访问预览图" : "上传成功", "success");
        loadLibrary();
      } else {
        showToast(`上传失败：${data.message || "未知错误"}`, "error");
      }
    } catch (error: unknown) {
      showToast(`连接异常：${getErrorMessage(error)}`, "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleConfirmExternalUrl = () => {
    const nextUrl = externalUrl.trim();

    if (!nextUrl) {
      showToast("请输入有效的图片 URL", "warning");
      return;
    }

    if (!nextUrl.match(/\.(jpeg|jpg|gif|png|webp|svg|avif)(\?.*)?$|^data:image/i)) {
      showToast("这看起来不是标准图片链接，但仍会尝试预览", "warning");
    }

    setUploadedUrl(nextUrl);
    setSelectedImage(null);
    showToast("预览已生成", "success");
  };

  const copyUrlToClipboard = () => {
    if (!uploadedUrl) return;
    navigator.clipboard.writeText(uploadedUrl);
    showToast("链接已复制到剪贴板", "success");
  };

  const resetSelection = () => {
    setUploadedUrl("");
    setSelectedImage(null);
    setExternalUrl("");
  };

  const insertSelectedImage = () => {
    if (!uploadedUrl) return;
    onInsert(uploadedUrl);
    resetSelection();
  };

  const tabs: { id: ImageToolTab; label: string }[] = [
    { id: "library", label: "图库" },
    { id: "upload", label: "上传" },
    { id: "url", label: "外链" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{ position: "fixed", top: "12vh", right: "5vw", zIndex: 99999 }}
          className="w-[360px] bg-white/45 dark:bg-slate-900/45 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/50 dark:border-white/10 overflow-hidden flex flex-col cursor-move"
        >
          <div className="flex justify-between items-center p-5 border-b border-white/30 dark:border-slate-700/50 bg-white/55 dark:bg-slate-800/55">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Cloud size={18} strokeWidth={2.4} className="text-emerald-500" />
              图床工作台
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/60 dark:bg-slate-700/60 flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-sm"
              aria-label="关闭图床工作台"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          </div>

          <div className="p-6 cursor-default bg-white/20 dark:bg-slate-900/20">
            {!uploadedUrl && (
              <div className="flex bg-slate-200/55 dark:bg-slate-800/55 p-1 rounded-2xl mb-5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      activeTab === tab.id
                        ? "bg-white dark:bg-slate-700 text-emerald-500 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {!uploadedUrl ? (
              <>
                {activeTab === "library" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black text-slate-400 uppercase">
                        云端图库 {libraryImages.length ? `${libraryImages.length} 张` : ""}
                      </p>
                      <button
                        onClick={loadLibrary}
                        disabled={isLoadingLibrary}
                        className="h-8 px-3 rounded-xl bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={isLoadingLibrary ? "animate-spin" : ""} />
                        刷新
                      </button>
                    </div>

                    {libraryImages.some((image) => image.directUrlAvailable === false) && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        部分 Lsky 原始直链返回 404，已自动改用可访问的缩略图链接。
                      </div>
                    )}

                    {isLoadingLibrary ? (
                      <div className="h-44 flex flex-col items-center justify-center gap-3 text-slate-500">
                        <Loader2 size={30} className="animate-spin text-emerald-500" />
                        <p className="text-xs font-bold">正在读取图库...</p>
                      </div>
                    ) : libraryImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                        {libraryImages.map((image) => (
                          <button
                            key={image.key || image.url}
                            onClick={() => selectImage(image)}
                            className="group relative aspect-square rounded-2xl overflow-hidden bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/60 shadow-sm"
                            title={image.name}
                          >
                            <img
                              src={image.thumbnailUrl || image.url}
                              alt={image.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center gap-3 text-center rounded-2xl border border-dashed border-slate-300/70 dark:border-slate-700/70 bg-white/35 dark:bg-slate-900/35 px-6">
                        <ImageIcon size={30} className="text-slate-400" />
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {libraryMessage || "当前没有可选图片"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "upload" && (
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all shadow-inner ${
                      isDragging
                        ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/40"
                        : "border-slate-300/80 dark:border-slate-600/80 hover:bg-white/60 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(event) => event.target.files && handleFileUpload(event.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="drop-shadow-sm text-emerald-500">
                      {isUploading ? (
                        <Loader2 size={40} strokeWidth={2.4} className="animate-spin" />
                      ) : (
                        <UploadCloud size={40} strokeWidth={2.4} />
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {isUploading ? "正在上传..." : "点击或拖入图片"}
                    </p>
                  </div>
                )}

                {activeTab === "url" && (
                  <div className="w-full space-y-4">
                    <textarea
                      value={externalUrl}
                      onChange={(event) => setExternalUrl(event.target.value)}
                      placeholder="粘贴图片链接"
                      className="w-full h-24 p-4 text-xs font-medium bg-white/55 dark:bg-slate-800/55 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-slate-700 dark:text-slate-200"
                    />
                    <button
                      onClick={handleConfirmExternalUrl}
                      className="w-full py-3 bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-black shadow-lg hover:opacity-90 transition-all active:scale-95"
                    >
                      确认图片链接
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="w-full h-40 rounded-2xl overflow-hidden bg-white/55 dark:bg-slate-950/55 border border-white/40 dark:border-slate-700/50 flex items-center justify-center p-2 shadow-inner group relative">
                  <img
                    src={uploadedUrl}
                    alt="preview"
                    className="max-w-full max-h-full object-contain rounded-xl drop-shadow-md"
                  />
                  <button
                    onClick={resetSelection}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
                  >
                    重新选择
                  </button>
                </div>

                {selectedImage?.directUrlAvailable === false && (
                  <p className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    原始直链不可访问，当前将写入可访问的缩略图链接。
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={copyUrlToClipboard}
                    className="py-2.5 rounded-xl bg-white/65 dark:bg-slate-800/65 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Copy size={14} strokeWidth={2.4} />
                    <span>复制链接</span>
                  </button>
                  <button
                    onClick={insertSelectedImage}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Send size={14} strokeWidth={2.4} />
                    <span>使用图片</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
