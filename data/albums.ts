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
    title: "Workspace",
    description: "Daily scenes from building, reading, writing, and debugging.",
    cover: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop",
    date: "2026.05",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1200&auto=format&fit=crop",
        caption: "Morning planning desk",
      },
      {
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
        caption: "Build notes and browser checks",
      },
      {
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
        caption: "Code, coffee, and a short test loop",
      },
    ],
  },
  {
    id: "outside",
    title: "Outside",
    description: "A small reminder that ideas need fresh air.",
    cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    date: "2026.05",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
        caption: "Walk after a release",
      },
      {
        url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
        caption: "Open road, open backlog",
      },
    ],
  },
];
