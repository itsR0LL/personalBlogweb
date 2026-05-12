// siteConfig.ts - central site settings

export const siteConfig = {
  title: "R0L1 Studio | Personal Blog",
  faviconUrl: "https://images.pexels.com/photos/30547594/pexels-photo-30547594.jpeg?auto=compress&cs=tinysrgb&w=256",
  authorName: "R0L1",
  bio: "A solo developer's field notes on AI agents, product building, software engineering, and independent creation.",

  navTitle: "R0L1 Studio",
  navSuffix: "|",
  navAfter: "Personal Blog",

  avatarUrl: "https://images.pexels.com/photos/11447114/pexels-photo-11447114.jpeg?auto=compress&cs=tinysrgb&w=400",

  useGradient: false,
  themeColors: ["#f472b6", "#818cf8", "#22d3ee", "#facc15"],
  bgImages: [
    "https://images.pexels.com/photos/18358477/pexels-photo-18358477.jpeg?auto=compress&cs=tinysrgb&w=2400",
    "https://images.pexels.com/photos/34991521/pexels-photo-34991521.jpeg?auto=compress&cs=tinysrgb&w=2400",
    "https://images.pexels.com/photos/37144806/pexels-photo-37144806/free-photo-of-rainy-nightscape-in-a-bustling-asian-city.jpeg?auto=compress&cs=tinysrgb&w=2400",
  ],
  timeThemeBackgrounds: [
    {
      id: "dawn",
      label: "Morning Skyline",
      hours: [5, 10],
      image:
        "https://images.pexels.com/photos/18358477/pexels-photo-18358477.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source: "Pexels / Shakur Muller",
      sourceUrl: "https://www.pexels.com/photo/foggy-tokyo-cityscape-at-sunrise-18358477/",
    },
    {
      id: "day",
      label: "Sunlit Workspace",
      hours: [10, 16],
      image:
        "https://images.pexels.com/photos/34109400/pexels-photo-34109400.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source: "Pexels / Jakub Zerdzicki",
      sourceUrl: "https://www.pexels.com/photo/sunlit-laptop-workspace-with-red-wall-34109400/",
    },
    {
      id: "dusk",
      label: "Tokyo at Dusk",
      hours: [16, 19],
      image:
        "https://images.pexels.com/photos/34991521/pexels-photo-34991521.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source: "Pexels / Anh Nguyen",
      sourceUrl: "https://www.pexels.com/photo/tokyo-skyline-at-dusk-with-illuminated-tower-34991521/",
    },
    {
      id: "night",
      label: "Neon Rain",
      hours: [19, 5],
      image:
        "https://images.pexels.com/photos/37144806/pexels-photo-37144806/free-photo-of-rainy-nightscape-in-a-bustling-asian-city.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source: "Pexels / Clarence Chan",
      sourceUrl: "https://www.pexels.com/photo/rainy-nightscape-in-a-bustling-asian-city-37144806/",
    },
  ],

  defaultPostCover: "https://images.pexels.com/photos/25630342/pexels-photo-25630342.jpeg?auto=compress&cs=tinysrgb&w=1600",
  fallbackChatterCover: "https://images.pexels.com/photos/30547594/pexels-photo-30547594.jpeg?auto=compress&cs=tinysrgb&w=1200",
  musicFallbackCover: "https://images.pexels.com/photos/30563921/pexels-photo-30563921.jpeg?auto=compress&cs=tinysrgb&w=1000",
  photoWallImage: "https://images.pexels.com/photos/31359811/pexels-photo-31359811.jpeg?auto=compress&cs=tinysrgb&w=1600",
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

  chatterTitle: "Build Notes",
  chatterDescription: "Short notes on ideas, experiments, and daily progress",

  danmakuList: [
    "Ship small, learn fast",
    "Document the decision",
    "Make the workflow visible",
    "Test the risky path",
    "Keep scope honest",
    "AI agents need clear handoffs",
    "Build notes are product memory",
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
