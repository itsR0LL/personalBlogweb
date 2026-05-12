export interface Friend {
  id: string;
  name: string;
  url: string;
  description: string;
  avatar: string;
  themeColor: string;
}

export const friendsData: Friend[] = [
  {
    id: "nextjs",
    name: "Next.js",
    description: "The React framework used by this blog.",
    avatar: "https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png",
    url: "https://nextjs.org/",
    themeColor: "rgba(15, 23, 42, 0.45)",
  },
  {
    id: "openai",
    name: "OpenAI Developers",
    description: "References for building AI products, agents, tools, and eval workflows.",
    avatar: "https://images.pexels.com/photos/25630342/pexels-photo-25630342.jpeg?auto=compress&cs=tinysrgb&w=400",
    url: "https://platform.openai.com/docs",
    themeColor: "rgba(20, 184, 166, 0.45)",
  },
];
