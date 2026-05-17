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

On Windows, you can also double-click:

```text
start_all.bat
stop_all.bat
```

These scripts start and stop only the public site in this folder.

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

The local manager has been split out of this public site. The expected sibling
checkout is:

```text
E:\Project\my-blog-manager
```

Do not copy it into this public site's `app/manager` route, and do not deploy it
as an online CMS. It is a local high-privilege tool that writes to the public
blog path configured in its settings page.

Double-click `start-local-manager.bat` from this folder to start the sibling
manager, or use `E:\Project\my-blog-manager\start_all.bat` directly. The
manager launcher starts its own Next.js UI and local Python backend. Runtime
files such as `public/backend_config.json`, `manager_data/runtime_config.json`,
and `data/deploy_config.json` live in the manager repository and must remain
untracked.

Run `npm run secret:scan` before committing changes that touch configuration,
runtime files, or documentation with example secrets.

## Attribution

Based on `https://github.com/heiehiehi/XinghuisamaBlogs`.

The upstream project is licensed under CC BY-NC 4.0. Keep attribution and do not use this derivative for commercial purposes unless you have compatible permission.

## Self-hosted Docker Deploy

The self-hosted IPv6 server uses Docker and a high-port Nginx entrypoint. The
server-side deploy script is versioned at `deploy/server-deploy.sh` and installed
on the server as:

```text
/usr/local/bin/personalblogweb-deploy
```

The local manager can call that script over SSH after syncing local content and
pushing this public repository. The manager app itself remains local-only and is
not deployed to the server.

Content-only updates can be published from the local manager control page without
rebuilding Docker. The public site reads the active content bundle from:

```text
/srv/personalblogweb/shared/content/current
```

Use `/api/deploy-info` to verify both the running code commit and the active
content version.

Server runtime secrets belong in:

```text
/srv/personalblogweb/shared/.env.production
```

For the AI assistant on the self-hosted server, prefer the OpenAI-compatible
provider configuration:

```text
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=Qwen/Qwen3-8B
AI_API_KEY=your-provider-key
```

The legacy Gemini path is still supported with `AI_PROVIDER=gemini` and
`GEMINI_API_KEY`. Use `QWEATHER_KEY` for weather. Do not commit those values.
