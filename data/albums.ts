// 本文件由 Blog Manager 自动生成，请勿手动修改。
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    id: "album-placeholder",
    title: "占位相册",
    description: "用于验证画廊页面的示例相册，正式上线前请替换为自己的图片。",
    cover: "https://img.r0l1dehome.asia/site/2026/07/20260710T074808Z-79789f1221ceadf8.jpg",
    date: "2026-05-11",
    photos: [
      {
        url: "https://img.r0l1dehome.asia/site/2026/07/20260710T074808Z-7fca204c3d0162d0.webp",
        caption: "占位照片",
      },
    ],
  },
];
