// siteConfig.ts - Blog Manager placeholder configuration.

export const siteConfig = {
  title: "R0L1_の小家",
  faviconUrl: "https://v1.lskypro.com/thumbnails/01f4a4584bace1a3b670c6791a0f5f57.png",
  authorName: "R0L1_",
  bio: "",

  navTitle: "R0L1_",
  navSuffix: "·",
  navAfter: "の小家",

  avatarUrl: "https://v1.lskypro.com/thumbnails/01f4a4584bace1a3b670c6791a0f5f57.png",

  useGradient: false,
  themeColors: ["#e2e8f0", "#bfdbfe", "#bbf7d0", "#fde68a"],
  bgImages: ["/images/backgrounds/light-1.png", "/images/backgrounds/light-2.jpg", "/images/backgrounds/light-3.jpg", "/images/backgrounds/light-4.webp", "/images/backgrounds/light-5.jpg", "/images/backgrounds/light-6.jpg"],
  lightBgImages: ["/images/backgrounds/light-1.png", "/images/backgrounds/light-2.jpg", "/images/backgrounds/light-3.jpg", "/images/backgrounds/light-4.webp", "/images/backgrounds/light-5.jpg", "/images/backgrounds/light-6.jpg"],
  darkBgImages: ["/images/backgrounds/dark-1.jpg", "/images/backgrounds/dark-2.jpg", "/images/backgrounds/dark-3.png", "/images/backgrounds/dark-4.jpg", "/images/backgrounds/dark-5.webp", "/images/backgrounds/dark-6.jpg"],

  defaultPostCover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
  photoWallImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop",
  cloudMusicIds: ["1809646618", "3361076230", "1859390262"],

  social: {
    github: "",
    gitee: "",
    google: "",
    email: "954811360@qq.com",
    qq: "",
    wechat: "",
  },

  counts: {
    photos: 1,
  },

  chatterTitle: "管理随笔",
  chatterDescription: "用于记录站点建设、内容整理和发布检查的占位文字。",


  danmakuList: ["留下你的足迹呗", "欢迎大家访问", "好困"],

  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [""],
  },

  buildDate: "2026-05-11T00:00:00",
  footerBadges: [{"name": "Blog Manager", "color": "text-sky-500", "svg": "<path d=\"M4 5a2 2 0 012-2h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5zm4 3h8v2H8V8zm0 4h6v2H8v-2z\"/>"}],

  icpConfig: {
    name: "",
    link: "",
  },

  geminiConfig: {
    modelId: "gemini-2.5-flash-lite",
    systemPrompt: "你是个人博客的简洁助手。请使用用户的语言回答，保持简短、准确、实用；不知道时说明需要补充配置。",
    maxOutputTokens: 150,
    temperature: 0.7,
  },
  backgroundBlurPx: 4,
  backgroundOverlayLight: 0.21,
  backgroundOverlayDark: 0.24,
  gradientIntensity: 0.44,
  gradientGlowBlurPx: 62,
};
