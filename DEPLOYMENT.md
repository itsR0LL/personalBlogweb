# Self-hosted Deployment Guide

Version: 2026-05-17

This project now uses the self-hosted deployment path:

```text
local manager -> personalBlogweb checkout -> GitHub -> self-hosted Docker server -> Nginx high port -> Cloudflare/domain
```

The manager stays local-only. Do not copy `my-blog-manager` into the public site and do not expose it as an online CMS.

## Current Public Entry

The current test entry is:

```text
http://www.muchuan.online:18080
```

Cloudflare and the final domain can be switched later through DNS and the manager deployment settings. Until the final domain is active, online checks should use the high-port self-hosted URL.

## Server Layout

The server uses Docker and a host Nginx high-port entrypoint.

```text
/srv/personalblogweb
/srv/personalblogweb/releases
/srv/personalblogweb/shared
/srv/personalblogweb/logs
/srv/personalblogweb/shared/.env.production
```

The restricted server-side deploy command is installed as:

```text
/usr/local/bin/personalblogweb-deploy
```

## Runtime Secrets

Server runtime secrets must stay on the server:

```text
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=Qwen/Qwen3-8B
AI_API_KEY=...
QWEATHER_KEY=...
```

Write them only to:

```text
/srv/personalblogweb/shared/.env.production
```

Do not commit real API keys, tokens, cookies, SSH keys, or runtime config files.

`/api/chat` still supports the legacy Gemini path:

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=...
```

For the current self-hosted server in mainland network conditions, prefer the
OpenAI-compatible configuration above.

## Local Release Flow

1. Update content or code locally.
2. If using the manager, execute `更新管理端本地` first so the public checkout is updated.
3. Validate the public site:

```bash
npx tsc --noEmit --incremental false --pretty false
npm run build
npm run secret:scan
```

4. Commit and push `personalBlogweb` to GitHub.
5. Use the manager deploy page or SSH to run the server deploy command.
6. Verify the public entry and key pages:

```text
/
/about
/timeline
/photowall
/music
/api/chat
/api/weather
```

## Manager Boundary

`my-blog-manager` is a local high-privilege tool. It may read and write the configured public blog checkout, but it is not deployed to the server.

Manager runtime files must remain untracked:

```text
public/backend_config.json
manager_data/runtime_config.json
data/deploy_config.json
```

## Rollback

Rollback should happen on the server by switching to the previous release or re-running the deploy script against a known good commit. Do not use the manager as a remote shell or online admin panel.

## Notes

- The current public entry uses HTTP on a high port because common ports may be unavailable.
- HTTPS should be added later through DNS-01 or a Cloudflare-compatible plan.
- Avoid sending private chat content through the public AI assistant until HTTPS is active.
- The AI assistant and weather API depend on the server environment file. If keys are missing, the public APIs should return a current-runtime configuration message rather than platform-specific wording.
