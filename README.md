# Personal Blog Web

A glassmorphism personal blog based on the open-source `XinghuisamaBlogs` project.

This version is customized as a solo-developer writing space for articles, build notes, moments, projects, friends, and photo albums.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Content

- Edit global profile and theme settings in `siteConfig.ts`.
- Add long-form articles under `posts/*.md`.
- Add shorter notes under `chatters/*.md`.
- Add timeline-style moments under `moments/*.md`.
- Edit projects, friends, and albums under `data/`.

## Images

Put local images under `public/images` and reference them from code with `/images/...` paths.

Recommended structure:

```text
public/images/avatar.jpg
public/images/backgrounds/background-1.jpg
public/images/covers/ai-agent.jpg
public/images/albums/workspace-1.jpg
```

Common replacements:

```ts
// siteConfig.ts
avatarUrl: "/images/avatar.jpg"
bgImages: [
  "/images/backgrounds/background-1.jpg",
  "/images/backgrounds/background-2.jpg",
  "/images/backgrounds/background-3.jpg",
]
defaultPostCover: "/images/covers/default.jpg"
photoWallImage: "/images/albums/workspace-1.jpg"
```

Article cover example:

```md
---
cover: "/images/covers/ai-agent.jpg"
---
```

Album image example:

```ts
{
  url: "/images/albums/workspace-1.jpg",
  caption: "Workspace"
}
```

## Validation

```bash
npm run lint
npm run build
```

## Manager App

The original webmaster manager is kept as a separate app under
`my-blog-manager/`. Do not copy it into the public site's `app/manager`
route. Deploy it as a second Vercel project from the same GitHub repository
with the project Root Directory set to `my-blog-manager`.

The manager UI is available at the deployment root `/`. Do not use `/admin`;
that route is intentionally absent so the standalone app stays aligned with
the original manager entrypoint. Its current write and deploy controls call
the local Python backend through
`my-blog-manager/public/backend_config.json`, so Vercel can host the UI, but
online content writing still requires a reachable backend with the manager
origin explicitly allowed by CORS, or a future GitHub API migration.

## Attribution

Based on `https://github.com/heiehiehi/XinghuisamaBlogs`.

The upstream project is licensed under CC BY-NC 4.0. Keep attribution and do not use this derivative for commercial purposes unless you have compatible permission.

## Deploy on Vercel

Import this project into Vercel as a Next.js project. If you use the optional AI assistant, configure the required AI provider environment variable before enabling it publicly.
