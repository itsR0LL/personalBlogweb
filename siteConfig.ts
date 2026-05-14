// siteConfig.ts - 站点核心配置

export const siteConfig = {
  title: "R0L1 Studio | 个人博客",
  faviconUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=256&auto=format&fit=crop",
  authorName: "R0L1",
  bio: "记录 AI Agent、产品构建、软件工程与独立创造的个人开发笔记。",

  navTitle: "R0L1 Studio",
  navSuffix: "|",
  navAfter: "个人博客",

  avatarUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=400&auto=format&fit=crop",

  useGradient: false,
  themeColors: ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"],
  bgImages: [
    "/images/backgrounds/light-1.png",
    "/images/backgrounds/light-2.jpg",
    "/images/backgrounds/light-3.jpg",
    "/images/backgrounds/light-4.webp",
    "/images/backgrounds/light-5.jpg",
    "/images/backgrounds/light-6.jpg",
  ],
  lightBgImages: [
    "/images/backgrounds/light-1.png",
    "/images/backgrounds/light-2.jpg",
    "/images/backgrounds/light-3.jpg",
    "/images/backgrounds/light-4.webp",
    "/images/backgrounds/light-5.jpg",
    "/images/backgrounds/light-6.jpg",
  ],
  darkBgImages: [
    "/images/backgrounds/dark-1.jpg",
    "/images/backgrounds/dark-2.jpg",
    "/images/backgrounds/dark-3.png",
    "/images/backgrounds/dark-4.jpg",
    "/images/backgrounds/dark-5.webp",
    "/images/backgrounds/dark-6.jpg",
  ],

  defaultPostCover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop",
  photoWallImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
  cloudMusicIds: ["1809646618", "3361076230", "1859390262"],

  social: {
    github: "",
    gitee: "",
    google: "",
    email: "",
    qq: "",
    wechat: "",
  },

  counts: {
    photos: 8,
  },

  chatterTitle: "构建札记",
  chatterDescription: "记录灵感、实验和日常推进的短笔记",

  danmakuList: [
    "小步发布，快速学习",
    "把决策写下来",
    "让工作流可见",
    "优先测试高风险路径",
    "诚实控制范围",
    "AI Agent 需要清晰交接",
    "构建笔记就是产品记忆",
  ],

  buildDate: "2026-05-11T00:00:00",
  footerBadges: [
    {
      name: "Next.js",
      color: "text-sky-500",
      svg: "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>",
    },
    {
      name: "React",
      color: "text-cyan-400",
      svg: "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>",
    },
    {
      name: "Tailwind",
      color: "text-teal-400",
      svg: "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z\"/>",
    },
  ],

  icpConfig: {
    name: "",
    link: "",
  },

  geminiConfig: {
    modelId: "gemini-2.5-flash-lite",
    systemPrompt:
      "You are a concise personal blog assistant for a solo developer. Answer in the user's language. Keep replies brief, practical, and friendly. If configuration is missing, explain what is needed without inventing secrets.",
    maxOutputTokens: 150,
    temperature: 0.7,
  },
};
