export interface Photo {
  url: string;
  caption?: string;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  cover: string;
  date: string;
  photos: Photo[];
}

export const albums: Album[] = [
  {
    id: "workspace",
    title: "工作台",
    description: "记录构建、阅读、写作和调试时的日常片段。",
    cover: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop",
    date: "2026.05",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1200&auto=format&fit=crop",
        caption: "清晨的计划桌面",
      },
      {
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
        caption: "构建笔记与浏览器检查",
      },
      {
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
        caption: "代码、咖啡和一轮短测试",
      },
    ],
  },
  {
    id: "outside",
    title: "户外片刻",
    description: "提醒自己，灵感也需要新鲜空气。",
    cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    date: "2026.05",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
        caption: "发布后的散步",
      },
      {
        url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
        caption: "开阔道路与待办清单",
      },
    ],
  },
];
