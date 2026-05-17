# Project Facts

This file is the source of truth for future recovery and manager rebuild work.
Update it before changing content ownership or deployment boundaries.

## Current Recovery State

- Public site target: the repository root Next.js app.
- Manager target: the sibling private local app at `E:\Project\my-blog-manager`.
- Stable baseline: `7a0f035 chore: baseline before anime blog polish`.
- Public-site Vercel deployment excludes local logs, `.env*`, `.next/`, and `node_modules/` through root `.vercelignore`. A defensive `my-blog-manager/` exclude may remain, but the manager directory is no longer part of this checkout.
- The former `personalblog-manager` Vercel project has been removed. The manager is not currently deployed online.
- The root public site does not own `/manager`; the manager UI is the sibling app root and should be opened through the local launcher.
- `/api/manager/*` is intentionally not part of the recovered public site.

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
| Music | `/music` and global player | `siteConfig.musicLibrary`, fallback `siteConfig.cloudMusicIds` |
| Global shell | all routes | `siteConfig.ts`, `components/Navbar.tsx`, `app/layout.tsx` |
| AI chat | `/api/chat` | `siteConfig.geminiConfig`, `GEMINI_API_KEY` |

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
   - profile, nav, theme, background, music library, footer, chat settings
   - Music is managed from the local manager music page, queued as a `CONFIG` operation, and writes both `musicLibrary` and derived `cloudMusicIds`.
3. v3 structured data:
   - `data/albums.ts`
   - `data/friends.ts`
   - `data/projects.ts`
4. v4 deferred capabilities:
   - image upload or picture bed integration
   - music metadata lookup and public-playback availability checks
   - AI configuration editor
   - deployment controls

## Manager Rebuild Rules

- Do not depend on long chat memory for project structure. Read this file and the source files before edits.
- Do not merge `my-blog-manager/` back into the public root without a scoped migration plan.
- Do not recreate `app/manager/page.tsx` in the public root unless there is an explicit reverse-proxy or rewrite plan.
- Keep the manager as the standalone sibling app at `E:\Project\my-blog-manager`.
- Use `start-local-manager.bat` as a convenience proxy, or run the sibling manager's own `start_all.bat`.
- Do not add manager write APIs back until their module scope and acceptance checks are documented.
- Current manager write/deploy controls call the local Python backend at `127.0.0.1` using launcher-generated `public/backend_config.json` inside the manager repository; that file contains dynamic ports and a short-lived `manager_token`, and local write APIs require `X-Manager-Token`.
- Do not expose secrets to the browser. Server routes must read secrets only from environment variables or ignored local runtime config such as `manager_data/runtime_config.json` inside the manager repository.
- Do not allow arbitrary file writes. Manager writes must be allowlisted by path or pattern.
- Every manager module needs a public-route verification checklist.

## Deployment Notes

- Root app build command: `npm run build`.
- Public Vercel project is bound from the repository root.
- Manager Vercel deployment is intentionally disabled. Recreate it only after a scoped online-CMS plan exists.
- Current local backend CORS only allows `localhost` and `127.0.0.1` origins. A deployed manager URL should not be assumed to have write access until this is deliberately configured.
- Required online check after push:
  - `/` returns 200
  - `/timeline` returns 200
  - `/photowall` returns 200
  - `/about` returns 200
  - Public-site `/manager` returns 404 unless a deliberate proxy route is added
  - Public-site `/admin` returns 404 unless a deliberate proxy route is added
  - Local manager launcher starts the UI and Python backend
  - Local manager `/`, `/editor`, `/drafts`, and `/settings` return 200
  - Local manager `/admin` returns 404
