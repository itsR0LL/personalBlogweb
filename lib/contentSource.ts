import fs from "fs";
import path from "path";

import { albums as bundledAlbums } from "../data/albums";
import { friendsData as bundledFriends } from "../data/friends";
import { projectsData as bundledProjects } from "../data/projects";
import { siteConfig as bundledSiteConfig } from "../siteConfig";

export type ContentManifest = {
  schemaVersion: number;
  contentVersion: string;
  exportedAt: string;
  itemCounts?: Record<string, number>;
};

const DEFAULT_CONTENT_DIR = "/srv/personalblogweb/shared/content/current";

function contentDirCandidate() {
  return process.env.PERSONALBLOG_CONTENT_DIR || DEFAULT_CONTENT_DIR;
}

export function getRuntimeContentDir() {
  const candidate = contentDirCandidate();
  try {
    if (fs.existsSync(path.join(candidate, "manifest.json"))) {
      return candidate;
    }
  } catch {
    return null;
  }
  return null;
}

export function getContentCollectionDir(collection: "posts" | "chatters" | "moments") {
  const contentDir = getRuntimeContentDir();
  if (contentDir) {
    const runtimeDir = path.join(contentDir, collection);
    if (fs.existsSync(runtimeDir)) return runtimeDir;
  }
  return path.join(process.cwd(), collection);
}

export function readContentJson<T>(fileName: string, fallback: T): T {
  const contentDir = getRuntimeContentDir();
  if (!contentDir) return fallback;

  try {
    const fullPath = path.join(contentDir, fileName);
    if (!fs.existsSync(fullPath)) return fallback;
    return JSON.parse(fs.readFileSync(fullPath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function getContentManifest(): ContentManifest | null {
  return readContentJson<ContentManifest | null>("manifest.json", null);
}

export function getRuntimeSiteConfig() {
  const site = readContentJson<Record<string, unknown>>("site.json", {});
  const music = readContentJson<Record<string, unknown>>("music.json", {});
  const config: Record<string, any> = {
    ...bundledSiteConfig,
    ...site,
    ...music,
  };
  delete config.picBedToken;
  if (config.gitalkConfig && typeof config.gitalkConfig === "object") {
    config.gitalkConfig = {
      ...(config.gitalkConfig as Record<string, unknown>),
      clientSecret: "",
    };
  }
  return config;
}

export function getRuntimeAlbums() {
  return readContentJson("albums.json", bundledAlbums);
}

export function getRuntimeProjects() {
  return readContentJson("projects.json", bundledProjects);
}

export function getRuntimeFriends() {
  return readContentJson("friends.json", bundledFriends);
}

export function getRuntimeMusicConfig() {
  return readContentJson("music.json", {
    musicLibrary: bundledSiteConfig.musicLibrary || [],
    cloudMusicIds: bundledSiteConfig.cloudMusicIds || [],
  });
}
