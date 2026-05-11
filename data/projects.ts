export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
};

export const projectsData: Project[] = [
  {
    id: "ai-agent-workflow",
    name: "AI Agent Workflow Team",
    githubUrl: "",
    description: "A solo-developer workflow that routes product, design, architecture, implementation, QA, security, review, docs, and release work through focused AI roles.",
    icon: "AI",
    tags: ["AI Agent", "Workflow", "Solo Dev"],
  },
  {
    id: "personal-blog",
    name: "Personal Blog Web",
    githubUrl: "",
    description: "A glassmorphism personal blog based on XinghuisamaBlogs, customized for writing build notes, articles, moments, projects, and links.",
    icon: "Blog",
    tags: ["Next.js", "Markdown", "Blog"],
  },
];
