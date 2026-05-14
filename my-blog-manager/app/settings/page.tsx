"use client";

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bot, Database, Download, Image as ImageIcon, MessageCircle, Monitor, Music, Palette, Puzzle, Rocket, User, Zap } from 'lucide-react';
import { useOperations } from '../../context/OperationContext';
import { siteConfig } from '../../siteConfig';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { ToastProvider, useToast } from '../../components/ToastProvider';

import ProfileSection from '../../components/settings/ProfileSection';
import BackgroundSection from '../../components/settings/BackgroundSection';
import MusicSection from '../../components/settings/MusicSection';
import GallerySection from '../../components/settings/GallerySection';
import RepoSection from '../../components/settings/RepoSection';
import DisplaySection from '../../components/settings/DisplaySection';
import CommentSection from '../../components/settings/CommentSection';
import DanmakuSection from '../../components/settings/DanmakuSection';
import FooterSection from '../../components/settings/FooterSection';
// 👇 🌟 引入刚写的 AI 配置组件
import AICatSection from '../../components/settings/AICatSection';

type MusicDetail = {
  id?: string | number;
  name?: string;
  error?: boolean;
  [key: string]: unknown;
};

type SettingsFormData = {
  [key: string]: unknown;
  authorName: string;
  bio: string;
  avatarUrl: string;
  social: Record<string, unknown>;
  cloudMusicIds: Array<string | number>;
  useGradient: boolean;
  themeColors: string[];
  bgImages: string[];
  lightBgImages: string[];
  darkBgImages: string[];
  backgroundBlurPx: number;
  backgroundOverlayLight: number;
  backgroundOverlayDark: number;
  gradientIntensity: number;
  gradientGlowBlurPx: number;
  gitalkConfig: {
    clientID: string;
    clientSecret: string;
    repo: string;
    owner: string;
    admin: string[];
  };
  danmakuList: string[];
  buildDate: string;
  icpConfig: unknown;
  footerBadges: unknown[];
  geminiConfig: Record<string, unknown>;
  newMusicId?: string;
};

function SettingsContent() {
  const { addOperation } = useOperations();
  const [activeTab, setActiveTab] = useState('profile');
  const { showToast } = useToast();
  const staticConfig = siteConfig as typeof siteConfig & Partial<Pick<
    SettingsFormData,
    'backgroundBlurPx' | 'backgroundOverlayLight' | 'backgroundOverlayDark' | 'gradientIntensity' | 'gradientGlowBlurPx'
  >>;

  const [formData, setFormData] = useState<SettingsFormData>({
    authorName: siteConfig.authorName || "",
    bio: siteConfig.bio || "",
    avatarUrl: siteConfig.avatarUrl || "",
    social: siteConfig.social || {},
    cloudMusicIds: [...(siteConfig.cloudMusicIds || [])],
    useGradient: siteConfig.useGradient ?? false,
    themeColors: [...(siteConfig.themeColors || [])],
    bgImages: [...(siteConfig.bgImages || [])],
    lightBgImages: [...(siteConfig.lightBgImages || siteConfig.bgImages || [])],
    darkBgImages: [...(siteConfig.darkBgImages || siteConfig.bgImages || [])],
    backgroundBlurPx: staticConfig.backgroundBlurPx ?? 4,
    backgroundOverlayLight: staticConfig.backgroundOverlayLight ?? 0.22,
    backgroundOverlayDark: staticConfig.backgroundOverlayDark ?? 0.32,
    gradientIntensity: staticConfig.gradientIntensity ?? 0.48,
    gradientGlowBlurPx: staticConfig.gradientGlowBlurPx ?? 72,
    gitalkConfig: siteConfig.gitalkConfig || {
      clientID: '',
      clientSecret: '',
      repo: '',
      owner: '',
      admin: []
    },
    danmakuList: [...(siteConfig.danmakuList || [])],
    buildDate: siteConfig.buildDate || "2026-05-11T00:00:00",
    icpConfig: siteConfig.icpConfig || { name: "", link: "" },
    footerBadges: [...(siteConfig.footerBadges || [])],
    // 👇 🌟 初始化 AI 助手配置数据
    geminiConfig: siteConfig.geminiConfig || {
      modelId: 'gemini-2.5-flash-lite',
      systemPrompt: '',
      maxOutputTokens: 150,
      temperature: 0.85
    }
  });

  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<MusicDetail | null>(null);
  const [musicDetails, setMusicDetails] = useState<Record<string, MusicDetail>>({});

  useEffect(() => {
    const fetchRealConfig = async () => {
      try {
        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const configData = await configRes.json();

        const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/config/get`, { cache: 'no-store' });
        const data = await res.json();

        if (data.success && data.data) {
          const backendBgImages = Array.isArray(data.data.bgImages) ? data.data.bgImages : undefined;
          const backendLightBgImages = Array.isArray(data.data.lightBgImages)
            ? data.data.lightBgImages
            : backendBgImages;
          const backendDarkBgImages = Array.isArray(data.data.darkBgImages) ? data.data.darkBgImages : undefined;
          const readNumber = (key: 'backgroundBlurPx' | 'backgroundOverlayLight' | 'backgroundOverlayDark' | 'gradientIntensity' | 'gradientGlowBlurPx') =>
            typeof data.data[key] === 'number' && Number.isFinite(data.data[key]) ? data.data[key] : undefined;
          console.log("✅ 成功从后端拉取到真实配置:", data.data);
          setFormData((prev) => ({
            ...prev,
            ...data.data,
            social: { ...(prev.social || {}), ...(data.data.social || {}) },
            gitalkConfig: { ...(prev.gitalkConfig || {}), ...(data.data.gitalkConfig || {}) },
            useGradient: typeof data.data.useGradient === 'boolean' ? data.data.useGradient : prev.useGradient,
            themeColors: Array.isArray(data.data.themeColors) ? [...data.data.themeColors] : prev.themeColors,
            bgImages: backendBgImages ? [...backendBgImages] : prev.bgImages,
            lightBgImages: backendLightBgImages ? [...backendLightBgImages] : prev.lightBgImages,
            darkBgImages: backendDarkBgImages ? [...backendDarkBgImages] : prev.darkBgImages,
            backgroundBlurPx: readNumber('backgroundBlurPx') ?? prev.backgroundBlurPx,
            backgroundOverlayLight: readNumber('backgroundOverlayLight') ?? prev.backgroundOverlayLight,
            backgroundOverlayDark: readNumber('backgroundOverlayDark') ?? prev.backgroundOverlayDark,
            gradientIntensity: readNumber('gradientIntensity') ?? prev.gradientIntensity,
            gradientGlowBlurPx: readNumber('gradientGlowBlurPx') ?? prev.gradientGlowBlurPx,
            danmakuList: data.data.danmakuList ? [...data.data.danmakuList] : prev.danmakuList,
            buildDate: data.data.buildDate || prev.buildDate,
            icpConfig: data.data.icpConfig || prev.icpConfig,
            footerBadges: data.data.footerBadges ? [...data.data.footerBadges] : prev.footerBadges,
            // 👇 🌟 合并后端发来的 AI 助手配置
            geminiConfig: { ...(prev.geminiConfig || {}), ...(data.data.geminiConfig || {}) }
          }));
        } else {
          console.error("❌ 后端返回失败:", data.message);
          showToast("读取后端配置失败，当前显示为本地静态数据", "warning");
        }
      } catch (error) {
        console.error("❌ 请求后端配置通道断开:", error);
        showToast("无法连接到 Python 后端服务", "error");
      }
    };

    fetchRealConfig();
  }, []);

  const handleUpdate = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const fetchMusicDetail = async (id: string) => {
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/music/query/${id}`, { cache: 'no-store' });
      const data = await res.json();
      return data.success ? data.data : { error: true, id, name: "查询失败或无版权" };
    } catch {
      return { error: true, id, name: "后端通信通道断开" };
    }
  };

  useEffect(() => {
    const loadInitialMusicDetails = async () => {
      const details: Record<string, MusicDetail> = { ...musicDetails };
      let hasUpdate = false;
      for (const id of formData.cloudMusicIds || []) {
        if (!details[id]) {
          const info = await fetchMusicDetail(String(id));
          if (info) {
            details[id] = info;
            hasUpdate = true;
          }
        }
      }
      if (hasUpdate) setMusicDetails(details);
    };
    if (formData.cloudMusicIds?.length > 0) {
      loadInitialMusicDetails();
    }
  }, [formData.cloudMusicIds]);

  const queryMusic = async () => {
    if (!formData.newMusicId) {
      showToast("ID不能为空哦", "warning");
      return;
    }
    setQueryLoading(true);
    setQueryResult(null);

    const info = await fetchMusicDetail(formData.newMusicId);
    if (info && !info.error) {
      setQueryResult(info);
      showToast("获取成功！", "success");
    } else {
      showToast(info?.name || "未找到该歌曲", "error");
    }
    setQueryLoading(false);
  };

  const removeSong = (index: number) => {
    const newList = [...formData.cloudMusicIds];
    newList.splice(index, 1);
    handleUpdate('cloudMusicIds', newList);
    showToast("已移除一首歌曲", "success");
  };

  const confirmAddMusic = () => {
    if (!queryResult) return;
    const targetId = String(queryResult.id);
    const exists = formData.cloudMusicIds.some((id: string | number) => String(id) === targetId);

    if (exists) {
      showToast(`《${queryResult.name}》已经在列表里啦，不要重复添加！`, "warning");
    } else {
      handleUpdate('cloudMusicIds', [...formData.cloudMusicIds, targetId]);
      setMusicDetails(prev => ({ ...prev, [targetId]: queryResult }));
      setQueryResult(null);
      handleUpdate('newMusicId', '');
      showToast("成功存入播放列表！", "success");
    }
  };

  const pushToQueue = (label: string, key?: string, value?: unknown) => {
    const payload = key
      ? { [key]: value }
      : value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : formData;

    addOperation({
      type: 'CONFIG',
      label: `配置暂存：${label}`,
      description: `修改了系统的 ${label}，等待同步至 my-blog`,
      payload,
      key: key,
      value: value
    });
    showToast(`【${label}】已加入右上角操作队列！`, "success");
  };

  // 👇 🌟 在菜单里增加 AI 助手入口
  const menuItems = [
    { id: 'profile', name: '个人名片设置', Icon: User },
    { id: 'display', name: '视窗画面设置', Icon: Monitor },
    { id: 'background', name: '视觉背景配置', Icon: Palette },
    { id: 'music', name: '音乐播放设置', Icon: Music },
    { id: 'gallery', name: '图库配置管理', Icon: ImageIcon },
    { id: 'footer', name: '首页底部设置', Icon: Puzzle },
    { id: 'danmaku', name: '全站弹幕设置', Icon: Zap },
    { id: 'comment', name: '评论系统配置', Icon: MessageCircle },
    { id: 'aicat', name: 'AI 助手配置', Icon: Bot },
    { id: 'repo', name: '项目仓库设置', Icon: Rocket },
  ];

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />

      <PageTransition>
        <main className="w-[95%] max-w-7xl mx-auto mt-24 flex flex-col md:flex-row gap-8 items-start relative z-10">

          <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-3xl p-4 shadow-xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4 ml-2 tracking-widest">系统管理维度</p>
              <nav className="flex flex-col gap-2">
                {menuItems.map((item) => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === item.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 translate-x-1' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                    <item.Icon size={16} strokeWidth={2.4} />{item.name}
                  </button>
                ))}
              </nav>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 mt-4">
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                <Database size={14} strokeWidth={2.4} />
                数据中枢操作
              </p>
              <button className="w-full py-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-white transition-all text-left px-4 flex justify-between">
                <span>拉取 my-blog 数据</span><Download size={14} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && <ProfileSection key="profile" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'display' && <DisplaySection key="display" />}
              {activeTab === 'background' && <BackgroundSection key="background" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'music' && <MusicSection key="music" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} musicDetails={musicDetails} queryMusic={queryMusic} queryLoading={queryLoading} queryResult={queryResult} confirmAddMusic={confirmAddMusic} removeSong={removeSong} />}
              {activeTab === 'gallery' && <GallerySection key="gallery" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'footer' && <FooterSection key="footer" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'danmaku' && <DanmakuSection key="danmaku" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'comment' && <CommentSection key="comment" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {/* 👇 🌟 挂载 AI 助手面板 */}
              {activeTab === 'aicat' && <AICatSection key="aicat" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}

              {activeTab === 'repo' && <RepoSection key="repo" />}
            </AnimatePresence>
          </div>

        </main>
      </PageTransition>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  );
}
