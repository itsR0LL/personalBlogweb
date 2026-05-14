// siteConfig.ts - Blog Manager placeholder configuration.

export const siteConfig = {
  title: "个人博客管理后台",
  faviconUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=400&auto=format&fit=crop",
  authorName: "站点管理员",
  bio: "这里是个人博客管理端的占位资料，请在设置页面替换为真实简介。",

  navTitle: "Personal Blog",
  navSuffix: "·",
  navAfter: "Manager",

  avatarUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=400&auto=format&fit=crop",

  useGradient: false,
  themeColors: ["#e2e8f0", "#bfdbfe", "#bbf7d0", "#fde68a"],
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

  defaultPostCover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
  photoWallImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop",
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
    photos: 1,
  },

  chatterTitle: "管理随笔",
  chatterDescription: "用于记录站点建设、内容整理和发布检查的占位文字。",

  picBedName: "图床",
  picBedUrl: "",
  picBedToken: "",

  danmakuList: [
    "欢迎来到管理端",
    "记得替换占位资料",
    "发布前请检查内容",
    "保持内容清晰",
  ],

  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [""],
  },

  buildDate: "2026-05-11T00:00:00",
  footerBadges: [
    {
      name: "Blog Manager",
      color: "text-sky-500",
      svg: "<path d=\"M4 5a2 2 0 012-2h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5zm4 3h8v2H8V8zm0 4h6v2H8v-2z\"/>",
    },
  ],

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
};
