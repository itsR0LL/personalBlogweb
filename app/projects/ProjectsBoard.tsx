"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Code2, ExternalLink, GitBranch, Layers3, Search } from "lucide-react";

import BackButton from "../../components/BackButton";
import { Project, projectsData as bundledProjects } from "../../data/projects";

const softEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
const slowEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ProjectsBoard({ projects = bundledProjects }: { projects?: Project[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const reduceMotion = Boolean(useReducedMotion());

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) => {
      const searchable = [
        project.name,
        project.description,
        project.githubUrl,
        ...project.tags,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [projects, searchQuery]);

  const originalCount = projects.filter((project) => project.tags.includes("原创项目")).length;
  const derivativeCount = projects.filter((project) => project.tags.includes("二次开发")).length;

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 lg:px-10">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.18 } : { duration: 0.72, ease: slowEase }}
        className="mb-8 flex justify-start"
      >
        <BackButton />
      </motion.div>

      <motion.section
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.18 } : { duration: 0.86, ease: softEase }}
        className="mb-10 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end"
      >
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:text-slate-300">
            <Layers3 size={14} />
            公开项目边界已收敛
          </div>
          <h1 className="text-4xl font-black tracking-normal text-slate-950 drop-shadow-sm dark:text-white sm:text-5xl">
            项目作品
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            这里仅展示可以公开说明的项目。涉及买断、第三方源码、私有客户或敏感二开边界的内容，不进入公开项目页。
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-white/60 bg-white/55 text-center shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-black/20">
          <ProjectMetric label="公开项目" value={projects.length} />
          <ProjectMetric label="原创主导" value={originalCount} />
          <ProjectMetric label="二次开发" value={derivativeCount} />
        </div>
      </motion.section>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.18 } : { duration: 0.78, delay: 0.08, ease: softEase }}
        className="mb-10 flex justify-center"
      >
        <label className="sr-only" htmlFor="project-search">
          搜索项目
        </label>
        <div className="relative w-full max-w-xl">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            id="project-search"
            type="search"
            placeholder="搜索项目名称、说明或技术标签..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-white/65 bg-white/58 px-11 py-3 text-sm text-slate-900 shadow-xl shadow-slate-900/5 outline-none backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-700 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white/72 focus:shadow-indigo-500/10 focus:ring-2 focus:ring-indigo-400/20 dark:border-white/10 dark:bg-slate-900/50 dark:text-white dark:focus:border-indigo-300/60 dark:focus:bg-slate-900/68"
          />
        </div>
      </motion.div>

      <motion.div layout="position" className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              index={index}
              project={project}
              reduceMotion={reduceMotion}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0.18 : 0.62, ease: softEase }}
          className="mt-12 rounded-lg border border-dashed border-slate-300/80 bg-white/45 px-6 py-12 text-center text-sm text-slate-500 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-400"
        >
          没有找到匹配“{searchQuery}”的公开项目。
        </motion.div>
      )}
    </main>
  );
}

function ProjectMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-slate-200/70 px-3 py-4 last:border-r-0 dark:border-white/10">
      <div className="text-2xl font-black text-slate-950 dark:text-white">{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  reduceMotion,
}: {
  project: Project;
  index: number;
  reduceMotion: boolean;
}) {
  const projectType =
    project.tags.find((tag) => tag === "原创项目" || tag === "二次开发") ?? "公开项目";
  const displayTags = project.tags.filter((tag) => tag !== projectType);
  const isDerivative = projectType === "二次开发";

  return (
    <motion.article
      layout="position"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.965 }}
      animate={
        reduceMotion
          ? { opacity: 1, transition: { duration: 0.18 } }
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.82, delay: index * 0.09, ease: softEase },
            }
      }
      exit={
        reduceMotion
          ? { opacity: 0, transition: { duration: 0.14 } }
          : { opacity: 0, y: 14, scale: 0.97, transition: { duration: 0.42, ease: softEase } }
      }
      whileHover={
        reduceMotion
          ? undefined
          : { y: -6, scale: 1.012, transition: { duration: 0.55, ease: softEase } }
      }
      className="h-full transform-gpu will-change-transform"
    >
      <a
        href={project.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-lg border border-white/60 bg-white/60 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-md transition-colors duration-700 hover:border-indigo-300/70 hover:bg-white/74 dark:border-white/10 dark:bg-slate-900/52 dark:shadow-black/20 dark:hover:border-indigo-300/40 dark:hover:bg-slate-900/68 md:p-8"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/55 to-transparent opacity-55 transition-opacity duration-700 group-hover:opacity-100 dark:via-indigo-200/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/36 via-transparent to-indigo-100/22 opacity-0 transition-opacity duration-[900ms] group-hover:opacity-100 dark:from-white/5 dark:to-indigo-500/10" />

        <div className="relative z-10 mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200/80 bg-white/64 text-base font-black tracking-wide text-slate-700 shadow-sm transition-colors duration-700 group-hover:border-indigo-300 group-hover:bg-indigo-50/75 group-hover:text-indigo-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:group-hover:border-indigo-300/40 dark:group-hover:bg-indigo-400/10 dark:group-hover:text-indigo-200">
              {project.icon}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                isDerivative
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
              }`}
            >
              {isDerivative ? <GitBranch size={12} /> : <Code2 size={12} />}
              {projectType}
            </span>
          </div>
          <ExternalLink
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-slate-400 transition-[color,transform] duration-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-300"
          />
        </div>

        <h2 className="relative z-10 text-2xl font-black leading-snug text-slate-950 transition-colors duration-700 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-200">
          {project.name}
        </h2>

        <p className="relative z-10 mt-5 flex-1 text-sm leading-7 text-slate-700 dark:text-slate-300">
          {project.description}
        </p>

        <div className="relative z-10 mt-7 flex flex-wrap gap-2">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg border border-slate-200/75 bg-white/56 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors duration-700 group-hover:border-indigo-200 group-hover:bg-indigo-50/55 group-hover:text-indigo-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:group-hover:border-indigo-300/25 dark:group-hover:bg-indigo-400/10 dark:group-hover:text-indigo-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </a>
    </motion.article>
  );
}
