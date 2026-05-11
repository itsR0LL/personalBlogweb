// 本文件由 Blog Manager 自动生成，请勿手动修改。
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    id: "album-placeholder",
    title: "占位相册",
    description: "用于验证画廊页面的示例相册，正式上线前请替换为自己的图片。",
    cover: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop",
    date: "2026-05-11",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop",
        caption: "占位照片",
      },
    ],
  },
];
