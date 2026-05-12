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
    cover: "https://images.pexels.com/photos/12815225/pexels-photo-12815225.jpeg?auto=compress&cs=tinysrgb&w=1200",
    date: "2026.05",
    photos: [
      {
        url: "https://images.pexels.com/photos/12815225/pexels-photo-12815225.jpeg?auto=compress&cs=tinysrgb&w=1200",
        caption: "Morning planning desk",
      },
      {
        url: "https://images.pexels.com/photos/25435827/pexels-photo-25435827.jpeg?auto=compress&cs=tinysrgb&w=1200",
        caption: "Build notes and color references",
      },
      {
        url: "https://images.pexels.com/photos/11447114/pexels-photo-11447114.jpeg?auto=compress&cs=tinysrgb&w=1200",
        caption: "Late-night implementation room",
      },
      {
        url: "https://images.pexels.com/photos/30547594/pexels-photo-30547594.jpeg?auto=compress&cs=tinysrgb&w=1200",
        caption: "Abstract system map",
      },
    ],
  },
  {
    id: "outside",
    title: "Outside",
    description: "A small reminder that ideas need fresh air.",
    cover: "https://images.pexels.com/photos/31359811/pexels-photo-31359811.jpeg?auto=compress&cs=tinysrgb&w=1200",
    date: "2026.05",
    photos: [
      {
        url: "https://images.pexels.com/photos/31359811/pexels-photo-31359811.jpeg?auto=compress&cs=tinysrgb&w=1200",
        caption: "Rainy side street after a release",
      },
      {
        url: "https://images.pexels.com/photos/33269330/pexels-photo-33269330.jpeg?auto=compress&cs=tinysrgb&w=1200",
        caption: "Neon alley between backlog passes",
      },
      {
        url: "https://images.pexels.com/photos/31118383/pexels-photo-31118383.jpeg?auto=compress&cs=tinysrgb&w=1200",
        caption: "Night rain and quiet streets",
      },
      {
        url: "https://images.pexels.com/photos/34991521/pexels-photo-34991521.jpeg?auto=compress&cs=tinysrgb&w=1200",
        caption: "Tokyo dusk lights",
      },
    ],
  },
];
