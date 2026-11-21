# bills-digital-world
BILL'S DIGITAL WORLD - AI-powered personal digital portal

Bill 的中文个人数字门户，使用 Astro 生成静态 HTML。访客可以浏览项目、博客与教程、AI 工具笔记，也可以通过公开的 GitHub Issue 联系 Bill。

## 本地开发与验收

使用 Node.js 24 和 npm。第一次运行或依赖变化后执行 `npm ci`。

```sh
npm ci
npm run dev
```

执行 `npm run build` 生成 `dist/`，再执行 `npm run verify` 检查六个主页面、详情页、404、站内链接、静态资源、canonical、robots 与网站地图。运行 `npm run preview`，按终端显示的地址预览产物。本地默认使用 `http://localhost:4321` 生成绝对链接，可通过构建环境变量 `SITE_URL` 指定测试域名。

## 目录与入口

| 入口 | 内容来源 |
| --- | --- |
| 首页 `/` | `src/pages/index.astro`，自动读取最新项目和文章 |
| 关于 `/about/` | `src/pages/about.astro` |
| 项目 `/projects/` | `src/content/projects/*.md` |
| 博客与教程 `/blog/` | `src/content/blog/*.md` |
| AI 工具箱 `/tools/` | `src/content/tools/*.md` |
| 联系 `/contact/` | `src/pages/contact.astro`，链接到本仓库 Issues |
| 样式与图片 | `src/styles/site.css`、`public/` |

## 用 ChatGPT 和 GitHub 维护内容

1. 指定仓库、栏目、素材和目标读者。请 ChatGPT 先读取分支、目录和同栏目已有文章，再列明要新增或修改的文件。
2. 在内容分支新增短英文文件名，例如 `src/content/blog/my-first-note.md`。已有文件先读后改，发布后尽量保留文件名以维持地址。图片放入 `public/images/`，正文引用 `/images/文件名` 并填写替代文字。
3. 文件头按下面的例子填写。日期采用 `YYYY-MM-DD`，用于列表排序。工具条目另需 `website`，填写 HTTPS 官网地址。草稿设 `draft: true` 即可从页面、首页和 sitemap 一起隐藏。公开仓库中的草稿源码仍然公开。
4. 请 ChatGPT 提交该批文件并给出提交号。创建 Pull Request，查看 **Build static site** 结果和内容差异。Pages 已连接时，还可以打开预览部署。确认发布后将 `draft` 改为 `false` 或删除该字段，合并到 `main`。
5. 核对 GitHub 主分支文件、Pages 生产部署提交号以及文章实际地址。需要撤回时，用 GitHub 的 Revert 或 `git revert` 创建反向提交，让 Pages 重新构建。

```markdown
---
title: "一篇新笔记"
description: "用一句话写清读者能从这篇文章学到什么。"
category: "实践笔记"
date: 2026-11-22
draft: true
---

## 我想解决的问题

在这里写正文。
```

可直接给 ChatGPT 的任务示例：

> 请读取 bills-digital-world 默认分支和 src/content/blog 的一篇示例，根据我下面的素材新增一篇草稿。保留其他文件，单独提交，回读文件并给我提交链接。

GitHub 连接需要能访问此仓库并写入 Contents，修改构建工作流还需 Workflows 写权限。仓库所有者权限与应用安装权限各自生效。

## 导入 Cloudflare Pages

1. 在 Cloudflare 控制台打开 **Workers & Pages → Create application → Pages → Import an existing Git repository**。连接 GitHub，选择 `billeasy001-glitch/bills-digital-world`。
2. 生产分支选 **main**，框架选 **Astro**，构建命令填 **npm run build**，输出目录填 **dist**，根目录保留仓库根目录。Node 使用 24，可设置构建变量 `NODE_VERSION=24`。建议项目名使用 `bills-digital-world`，如名称已被占用，请同步修改 `wrangler.toml` 中的 `name`。
3. 选择 **Save and Deploy**。以控制台实际分配的 HTTPS 地址为准。构建配置会从 `CF_PAGES_URL` 推导生产 `pages.dev` 域名。将来绑定自定义域名后，在生产和预览构建环境设置 `SITE_URL=https://你的实际域名`，重新部署。
4. 打开首页、一个 Markdown 详情页、`/robots.txt`、`/sitemap.xml` 及一个不存在的地址。核对 canonical 和 sitemap 的域名，确认不存在的地址返回 HTTP 404。可以再提交一次小范围内容修改，核对 Pages 是否自动部署对应提交。

`wrangler.toml` 指定 Pages 的静态输出目录。GitHub Actions 在主分支推送及 Pull Request 时构建并验收，Cloudflare Pages 通过自己的 Git 集成部署。首次导入和账号授权在 Cloudflare 控制台完成。[Cloudflare 官方 Astro 部署指南](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)

## 恢复版本

如果一个已发布版本需要紧急撤回，可在 Pages 的生产部署历史中选择先前的成功部署并回滚。随后在 GitHub 撤回相应变更，使默认分支与期望的生产内容一致。
