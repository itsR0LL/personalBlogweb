# personalBlogweb Split Plan

## Goal

Separate the public Vercel blog and the local manager into two independently maintained repositories:

- `personalBlogweb`: public-facing Next.js blog deployed on Vercel.
- `my-blog-manager`: private, local-only high-privilege manager that writes to a configured public blog path.

## Current Status

- Local physical split is complete.
- Public site checkout: `E:\Project\personalBlogweb`
- Manager checkout: `E:\Project\my-blog-manager`
- The manager repository has been initialized locally with `git init`; add a private remote before pushing.

## Boundary

- The public site must not import or build files from the manager checkout.
- Vercel must not deploy manager files.
- `public/backend_config.json` inside the manager checkout is launcher-generated runtime state and must not be tracked.
- Manager writes to the public blog only through configured `blogPath` and sync preflight.

## Split Readiness Gate

Run this before physical separation:

```bash
npm run split:check
```

Expected result:

- no hard-coded `E:/Project/personalBlogweb` path inside manager source
- root `tsconfig.json` excludes `my-blog-manager`
- `.vercelignore` excludes `my-blog-manager/`
- `my-blog-manager/public/backend_config.json` is not tracked

## Private Remote Sequence

1. Create a private remote repository for `my-blog-manager`.
2. In `E:\Project\my-blog-manager`, review `git status`.
3. Commit the current manager files locally.
4. Add the private remote and push.
5. In the manager settings page, configure `blogPath` to `E:\Project\personalBlogweb`.
6. Validate both repositories independently.

## Release Gates After Split

Public blog:

```bash
npm run lint -- --no-cache
npx tsc --noEmit --incremental false
npm run build
npm audit --omit=dev
```

Manager:

```bash
npx tsc --noEmit --incremental false
npm run build
npm audit --omit=dev
python -m compileall cms_core launcher.py run_me.py
```
