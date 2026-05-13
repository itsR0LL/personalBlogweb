# Project Facts

This file is the source of truth for future recovery and manager rebuild work.
Update it before changing content ownership or deployment boundaries.

## Current Recovery State

- Public site target: the repository root Next.js app.
- Stable baseline: `7a0f035 chore: baseline before anime blog polish`.
- Local manager reference: `my-blog-manager/`.
- Vercel deployment excludes `my-blog-manager/`, local logs, `.env*`, `.next/`, and `node_modules/` through `.vercelignore`.
- `/manager` and `/api/manager/*` are intentionally not part of the recovered public site.

## Public Site Content Map

| Site area | Route | Source files |
| --- | --- | --- |
| Home | `/` | `posts/*.md`, `chatters/*.md`, `data/albums.ts`, `siteConfig.ts` |
| Articles | `/posts/[slug]` | `posts/*.md`, `siteConfig.ts` |
| Timeline | `/timeline` | `posts/*.md`, `siteConfig.ts` |
| Chatter | `/chatter`, `/chatter/[slug]` | `chatters/*.md`, `siteConfig.ts` |
| Moments | `/moments` | `moments/*.md`, `siteConfig.ts` |
| Photo wall | `/photowall` | `data/albums.ts` |
| Friends | `/friends` | `data/friends.ts` |
| Projects | `/projects` | `data/projects.ts` |
| About | `/about` | `app/about/about.md`, `siteConfig.ts` |
| Music | `/music` and global player | `siteConfig.cloudMusicIds` |
| Global shell | all routes | `siteConfig.ts`, `components/Navbar.tsx`, `app/layout.tsx` |
| AI chat | `/api/chat` | `siteConfig.geminiConfig`, `GOOGLE_API_KEY` |

## Future Manager Coverage

Rebuild the manager in small modules. Each module must prove that the public
site changed correctly after save, not only that the manager UI saved data.

1. v1 Markdown content:
   - `posts/*.md`
   - `chatters/*.md`
   - `moments/*.md`
   - `app/about/about.md`
2. v2 site settings:
   - `siteConfig.ts`
   - profile, nav, theme, background, music IDs, footer, chat settings
3. v3 structured data:
   - `data/albums.ts`
   - `data/friends.ts`
   - `data/projects.ts`
4. v4 deferred capabilities:
   - image upload or picture bed integration
   - music metadata lookup
   - AI configuration editor
   - deployment controls

## Manager Rebuild Rules

- Do not depend on long chat memory for project structure. Read this file and the source files before edits.
- Do not merge `my-blog-manager/` into the public root without a scoped migration plan.
- Do not add `/manager` back until its module scope and acceptance checks are documented.
- Do not expose secrets to the browser. Server routes must read secrets only from environment variables.
- Do not allow arbitrary file writes. Manager writes must be allowlisted by path or pattern.
- Every manager module needs a public-route verification checklist.

## Deployment Notes

- Root app build command: `npm run build`.
- Vercel project is bound from the repository root.
- `my-blog-manager/` is a local/reference app and is not deployed by the root Vercel project.
- Required online check after push:
  - `/` returns 200
  - `/timeline` returns 200
  - `/photowall` returns 200
  - `/about` returns 200
  - `/manager` returns 404 until a new manager is deliberately rebuilt
