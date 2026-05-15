# 部署指南：通过 GitHub 发布博客网站

版本：2026-05-11

这份指南用于把当前博客部署到互联网上。当前项目是 Next.js 项目，并且包含服务端 API，所以推荐使用：

```text
本地项目 -> GitHub 仓库 -> Vercel 自动部署 -> 互联网访问
```

## 当前线上地址

当前生产环境已经部署到：

```text
https://personalblogweb.vercel.app
```

当前 Vercel 项目：

```text
itsr0lls-projects/personalblogweb
```

当前是通过 Vercel CLI 从本地完成部署。GitHub 仓库已经推送成功，但 Vercel CLI 自动连接 GitHub 仓库时失败过一次；如果你希望以后每次 `git push` 后自动部署，请在 Vercel 控制台确认该项目已经连接到 GitHub 仓库 `itsR0LL/personalBlogweb`。

## 管理端本地运行边界

管理端不要复制到主站的 `/manager` 路由。仓库里的原版管理端已经在：

```text
my-blog-manager/
```

当前稳定方案是本地运行管理端，而不是把管理端作为 Vercel 在线后台长期运行：

```text
Public Site Project  -> Vercel Root Directory: ./
Manager App          -> Local only: my-blog-manager
```

本地启动方式：

```text
双击 start-local-manager.bat
```

该脚本会进入 `my-blog-manager/`，检查 Node/npm/Python，然后调用原版 `run_me.py`，同时启动：

```text
Next.js 管理页面
Python FastAPI 后端
本地 Blog Manager 窗口
```

当前注意事项：

- 主站不再拥有 `/manager`；除非未来明确做反向代理，否则主站 `/manager` 应该返回 404。
- `/admin` 不是管理端入口，也不要在 `my-blog-manager` 里新增自写 `/admin` dashboard；管理端使用原版项目根页面。
- `my-blog-manager` 的保存、同步、部署按钮当前通过 launcher 生成的 `public/backend_config.json` 调用本机 `127.0.0.1` 上的 Python 后端；该文件和 `manager_data/` 里的本地密钥配置不要提交。
- 因此线上 Vercel 管理端已经移除；如果未来要让线上管理端直接写入 GitHub，需要先做登录鉴权，并把写入逻辑改造成可控的 Vercel Serverless + GitHub API 或可访问后端。
- 当前 Python 后端 CORS 只允许 `localhost` 和 `127.0.0.1` 来源；不要为了临时线上访问直接扩大到所有 `*.vercel.app`。
- 管理端如启用 AI 助手或天气能力，先按本地 `.env` 方式配置，不要把 Key 写进仓库。

## 1. 推荐方案

推荐使用 Vercel。

原因：

- 当前项目使用 Next.js。
- 当前项目有服务端接口，例如 `/api/chat` 和 `/api/weather`。
- Vercel 可以直接连接 GitHub 仓库，每次推送代码后自动构建和部署。

不推荐直接使用 GitHub Pages 作为首选。

原因：

- GitHub Pages 更适合静态网站。
- 当前项目包含服务端 API，GitHub Pages 不能直接运行这些 API。
- 如果强行使用 GitHub Pages，需要改成纯静态导出，并放弃或改造 AI、天气等接口功能。

## 2. 当前项目部署检查

已经验证：

```bash
npm run build
```

结果：

- 构建成功。
- 首页、文章、项目、归档、照片墙、音乐、说说、杂谈、友链、关于页面可以被构建。
- `/api/chat`、`/api/weather`、`/api/test` 是动态接口，需要部署平台运行服务端逻辑。

当前阻塞：

- `personalBlogweb` 目录现在还不是 Git 仓库。
- 需要先创建 GitHub 仓库并把代码推上去。

## 3. 你需要准备什么

部署前需要准备：

1. 一个 GitHub 账号。
2. 一个 Vercel 账号。
3. 一个新的 GitHub 仓库。
4. 如果要启用 AI 助手，需要准备 `GEMINI_API_KEY`。
5. 如果要启用天气接口，需要准备 `QWEATHER_KEY`。

如果暂时没有 API Key，也可以先部署网站主体。AI 和天气功能可能会报错或不可用。

## 4. 把项目放到 GitHub

在 `personalBlogweb` 项目根目录执行：

```bash
git init
git add .
git commit -m "Initial blog deployment"
```

然后在 GitHub 创建一个新仓库，例如：

```text
personal-blog-web
```

创建仓库后，GitHub 会给你一个仓库地址，类似：

```text
https://github.com/你的用户名/personal-blog-web.git
```

继续执行：

```bash
git branch -M main
git remote add origin https://github.com/你的用户名/personal-blog-web.git
git push -u origin main
```

注意把 `你的用户名` 换成你自己的 GitHub 用户名。

## 5. 在 Vercel 导入 GitHub 仓库

操作步骤：

1. 打开 Vercel。
2. 使用 GitHub 登录。
3. 点击 Add New Project 或 Import Project。
4. 选择刚刚创建的 GitHub 仓库。
5. Framework Preset 选择 Next.js。
6. Root Directory 保持项目根目录。
7. Build Command 使用默认值，通常是：

```bash
npm run build
```

8. Output Directory 不需要手动填写。
9. 点击 Deploy。

部署完成后，Vercel 会给你一个访问地址，类似：

```text
https://your-project.vercel.app
```

## 6. 配置环境变量

进入 Vercel 项目设置：

```text
Project -> Settings -> Environment Variables
```

根据需要添加：

```text
GEMINI_API_KEY=你的 Gemini Key
QWEATHER_KEY=你的和风天气 Key
```

说明：

- `GEMINI_API_KEY` 用于 AI 助手。
- 当前 AI 助手使用 `siteConfig.ts` 中配置的 `gemini-2.5-flash-lite`。
- Gemini Key 可以在 Google AI Studio 创建，先使用免费层即可，不要把 Key 写进仓库。
- `QWEATHER_KEY` 用于天气接口。
- 不要把真实 Key 写进 GitHub 仓库。
- 添加环境变量后，需要重新部署一次。

重新部署方式：

1. 进入 Vercel 项目。
2. 打开 Deployments。
3. 找到最近一次部署。
4. 点击 Redeploy。

## 7. 后续如何更新网站

以后修改博客内容或代码后，按这个流程：

```bash
git add .
git commit -m "Update blog content"
git push
```

推送到 GitHub 后，Vercel 会自动重新部署。

如果只是管理后台里改了文章、音乐、照片墙等内容，需要先在管理后台：

```text
编辑内容 -> 加入队列/暂存 -> 右上角更新本地 -> 确认公开博客可用
```

然后再提交到 GitHub：

```bash
git add .
git commit -m "Update blog data"
git push
```

## 8. 自定义域名

如果你有自己的域名，可以在 Vercel 设置：

```text
Project -> Settings -> Domains
```

添加域名后，Vercel 会提示你到域名服务商那里配置 DNS。

常见配置：

- 根域名使用 A 记录。
- 子域名如 `www` 使用 CNAME。

具体以 Vercel 页面显示为准。

## 9. GitHub Pages 方案说明

只有在你确认不需要服务端 API 时，才考虑 GitHub Pages。

如果要使用 GitHub Pages，一般需要：

1. 把 Next.js 改成静态导出。
2. 处理路径和资源前缀。
3. 禁用或改造 `/api/chat`、`/api/weather` 等接口。
4. 使用 GitHub Actions 发布静态文件。

当前项目不建议优先走这条路。

## 10. 发布前检查清单

部署前检查：

1. `npm run build` 可以成功。
2. 本地公开博客页面可以打开。
3. 不需要的旧作者内容已经删除。
4. 文章、项目、友链、照片墙显示正确。
5. 音乐播放器能正常加载。
6. 不把 API Key、Token、Client Secret 提交到 GitHub。
7. Vercel 环境变量已经填写。
8. 部署完成后打开线上地址测试首页和各栏目。

## 11. 官方文档

- Vercel Git 部署：https://vercel.com/docs/deployments/git
- Vercel 导入项目：https://vercel.com/docs/getting-started-with-vercel/import
- Vercel 环境变量：https://vercel.com/docs/environment-variables
- Next.js 静态导出：https://nextjs.org/docs/app/guides/static-exports
- GitHub Pages：https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages
## Current Split Note

The public site and local manager are now physically separated:

```text
Public site: E:\Project\personalBlogweb
Manager:     E:\Project\my-blog-manager
```

Deploy only the public site repository to Vercel. The manager remains a
private local-only tool and should be started from its own `start_all.bat` or
through the public site's `start-local-manager.bat` proxy.
