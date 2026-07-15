---
title: ## 4. 开源项目
---

<script setup>
import { withBase } from 'vitepress'
import { Cloud, Bot, Wallet, Zap, Package, AlertTriangle, Globe, Search, ClipboardList, Link, Compass, Cpu, Database, Shield, Brain, Lock, Server, ListFilter, Code, FileText, Boxes, GitBranch, ArrowLeftRight, Container, Clock, Table, Key, HardDrive, Layers, Scan, UserCheck, LockKeyhole, ShieldAlert, Gauge, Umbrella, Braces, BrainCircuit, Network, Image, Video, Radio, MonitorPlay, ShoppingCart, Mail } from '@lucide/vue'
</script>

# 4. 开源项目

想自己搭网盘、图床、临时邮箱、短链或状态页，但不想从零写？这里按用途整理了一批实际使用 Cloudflare 能力、文档相对完整、仍有维护价值的开源项目。标「推荐」的是同类里优先看的那个。

开源项目更适合拿来学架构和缩短起步时间，不等于可以不审代码直接上线。先看最近提交、部署文档、数据迁移和备份路径，再决定是直接用、二次开发，还是只吸收其中一个模块。

| 你要做什么 | 第一选择 | 先学什么 | 主要取舍 |
| --- | --- | --- | --- |
| 新建标准 Worker / 全栈项目 | `cloudflare/templates` | 官方绑定、构建和部署方式 | 模板是起点，不是完整产品 |
| 有状态 AI Agent | `cloudflare/agents` | Durable Objects 承载会话和状态 | 先搞清 Agent 与普通 Worker 的边界 |
| 给 Worker API 加 OAuth | `cloudflare/workers-oauth-provider` | OAuth 2.1、PKCE、token 生命周期 | 登录页面和用户身份仍要自己实现 |
| 做 OpenAPI API | `cloudflare/chanfana` + Hono | schema、校验、类型推导和文档生成 | 不要为了一个简单 endpoint 引入整套抽象 |
| 做实时协作 / WebSocket | `cloudflare/partykit` | PartyServer、PartySocket、Durable Objects | 部分包仍在快速演进，升级前看 changelog |
| 让 AI 读写 Cloudflare 账号 | `cloudflare/mcp-server-cloudflare` | typed tools、日志和配置诊断 | 写操作权限要按最小范围授权 |

## 官方仓库和模板

- [cloudflare/templates](https://github.com/cloudflare/templates)（推荐）：官方模板总库，`npm create cloudflare@latest` 或 Dashboard 直接创建。重点看 `d1-template`、`r2-explorer-template`、`durable-chat-template`、`llm-chat-app-template`、`react-router-hono-fullstack-template`、`saas-admin-template`、`workflows-starter-template`、`containers-template`。
- [cloudflare/agents](https://github.com/cloudflare/agents)：官方 Agents SDK 示例，核心是 Durable Objects 承载有状态 Agent，会话、状态、存储和生命周期都值得看。
- [cloudflare/workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider)：官方 OAuth 2.1 Provider 框架，内置 PKCE、token 和 client 管理，适合给 Worker API 或远程 MCP 补授权层；它不负责你的登录 UI 和用户体系。
- [cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare)：官方 Cloudflare MCP Servers 集合，覆盖文档、Bindings、Builds、Observability、Browser Rendering 等能力。适合研究 AI 如何读配置、查日志和做受控操作，不要把高权限写工具默认暴露给所有客户端。
- [cloudflare/partykit](https://github.com/cloudflare/partykit)：Cloudflare 官方实时应用工具仓库，重点看 PartyServer、PartySocket 和 Yjs/CRDT 协作示例；底层仍是 Durable Objects，适合聊天室、协同编辑和实时状态同步。
- [cloudflare/vibesdk](https://github.com/cloudflare/vibesdk)：官方 AI web app generator，适合研究"AI 编程平台自己怎么部署在 Cloudflare 上"。
- [cloudflare/moltworker](https://github.com/cloudflare/moltworker)：OpenClaw 跑在 Cloudflare Sandbox 的实验项目，适合看 Containers/Sandbox 和 AI assistant 怎么组合；偏实验，不适合作为普通项目起步模板。
- [cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk)：Wrangler 所在仓库，查 CLI、构建和部署生态。
- [cloudflare/workerd](https://github.com/cloudflare/workerd)：Workers 背后的开源运行时，适合理解 runtime 边界。
- [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action)：GitHub Actions 部署 Workers 的官方 Action。
- [cloudflare/deploy.workers.cloudflare.com](https://github.com/cloudflare/deploy.workers.cloudflare.com)：官方 Deploy to Cloudflare Workers 按钮实现。
- [cloudflare/workers-rs](https://github.com/cloudflare/workers-rs)：Rust 写 Workers 的官方路线。
- [syumai/workers](https://github.com/syumai/workers)：Go HTTP server 跑在 Workers 上的代表项目。

## 内容站、博客和 CMS

- [microfeed/microfeed](https://github.com/microfeed/microfeed)（推荐 CMS）：自托管轻量 CMS，用 Pages、R2、D1、Zero Trust 组织内容、媒体、RSS 和 JSON feed，适合看"内容系统怎么 Cloudflare 原生化"。
- [openRin/Rin](https://github.com/openRin/Rin)（推荐博客）：基于 Pages、Workers、D1、R2 的边缘原生博客，后台、图片、文章和部署路径都比较完整。
- [SonicJs-Org/sonicjs](https://github.com/SonicJs-Org/sonicjs)：Edge-native Headless CMS，技术栈是 Workers、Hono、D1、R2、HTMX，适合看 CMS 后台和内容 API。
- [IchimaruGin728/Gins-Blog](https://github.com/IchimaruGin728/Gins-Blog)：Astro + Workers + D1 + R2 + KV + Vectorize 的博客，适合看 AI 搜索和全家桶组合。
- [gdtool/cloudflare-workers-blog](https://github.com/gdtool/cloudflare-workers-blog)：Workers + KV 的经典轻量博客，适合学习最小实现。
- [joyance-professional/cf-comment](https://github.com/joyance-professional/cf-comment)：Workers 单文件评论系统，适合给静态站补评论、回复、点赞和后台。
- [souvenp/memos-worker](https://github.com/souvenp/memos-worker)：Cloudflare 驱动的笔记和知识库，适合看轻量内容管理、附件和公开分享。

## 图床、网盘和 R2 文件

- [ling-drag0n/CloudPaste](https://github.com/ling-drag0n/CloudPaste)（推荐网盘）：Workers + Workflows + D1 架构，支持文件管理、文本分享、WebDAV、多存储后端和预览。想做"自己的轻量网盘"优先看它。
- [G4brym/R2-Explorer](https://github.com/G4brym/R2-Explorer)（推荐 R2 管理）：把 R2 bucket 做成类似 Google Drive 的管理界面；不是完整网盘，更像 R2 控制台增强。
- [MarSeventh/CloudFlare-ImgBed](https://github.com/MarSeventh/CloudFlare-ImgBed)（推荐图床）：基于 Cloudflare 的文件/图床方案，支持多存储通道，适合做公开图片和个人文件托管。
- [yestool/imgUU](https://github.com/yestool/imgUU)：Astro SSR + D1 + R2 + GitHub 登录的图床，适合看登录、图片元数据和对象存储怎么分工。
- [WangQueXL/PixR2](https://github.com/WangQueXL/PixR2)：Workers + R2 多入口图片管理平台，适合看 R2-first 图床。
- [cf-pages/Telegraph-Image](https://github.com/cf-pages/Telegraph-Image)：Pages + Telegraph 的图片托管方案，社区使用多，但更依赖 Telegraph，不是 R2 最佳范式。
- [lyonbot/cf-drop](https://github.com/lyonbot/cf-drop)：Workers + R2 + D1 的临时文件投递工具，适合做轻量文件传输助手。
- [joyance-professional/cf-files-sharing](https://github.com/joyance-professional/cf-files-sharing)：Workers + D1 + R2 的密码文件分享工具，适合看权限和大小文件分流。
- [yclgkd/ZeroLink](https://github.com/yclgkd/ZeroLink)：端到端加密的秘密传递工具，适合看 Workers、Durable Objects、R2 在安全分享场景里的组合；安全类项目要先看威胁模型再部署。

## 邮箱和验证码

- [dreamhunter2333/cloudflare_temp_email](https://github.com/dreamhunter2333/cloudflare_temp_email)（推荐临时邮箱）：用 Cloudflare 免费服务搭临时邮箱，D1 存数据，支持前后端、附件、IMAP/SMTP、Telegram Bot，社区使用面很大。
- [maillab/cloud-mail](https://github.com/maillab/cloud-mail)（推荐完整邮箱）：基于 Cloudflare 的响应式邮箱服务，支持邮件发送、附件收发、R2 存附件、Workers AI 识别验证码，适合研究"Cloudflare 邮箱产品化"。
- [beilunyang/moemail](https://github.com/beilunyang/moemail)：Next.js + Cloudflare 技术栈的临时邮箱，文档和部署教程比较完整。
- [oiov/vmail](https://github.com/oiov/vmail)：只需域名即可部署的临时邮箱，D1 保存数据，支持多域名后缀和开放 API。
- [TBXark/mail2telegram](https://github.com/TBXark/mail2telegram)：Email Routing Worker 把邮件转到 Telegram，适合做通知和验证码转发。
- [TooonyChen/AuthInbox](https://github.com/TooonyChen/AuthInbox)：多邮箱验证码接收和提取平台，适合看邮件解析、后台管理和通知。
- [bestruirui/Alle](https://github.com/bestruirui/Alle)：AI 邮件聚合客户端，适合看 Workers + Next.js 在邮件识别和分类上的用法。

## 短链接

- [miantiao-me/Sink](https://github.com/miantiao-me/Sink)（推荐）：100% 跑在 Cloudflare 上的短链接系统，带分析、控制台、过期、密码和安全提示页，适合当短链项目最佳实践。
- [crazypeace/Url-Shorten-Worker](https://github.com/crazypeace/Url-Shorten-Worker)：Workers + KV 的经典短链，适合学习最小可用短链、KV 映射和管理页。
- [x-dr/short](https://github.com/x-dr/short)：Pages 短链，适合极简场景。
- [Ai-Yolo/CloudflareWorker-KV-UrlShort](https://github.com/Ai-Yolo/CloudflareWorker-KV-UrlShort)：Workers + KV 短链，适合看自定义首页和菜单式短链。
- [PIKACHUIM/CFWorkerUrls](https://github.com/PIKACHUIM/CFWorkerUrls)：Worker 短链跳转服务，适合看 URL 跳转和 STUN 场景。

## 网站统计、监控和状态页

- [benvinegar/counterscale](https://github.com/benvinegar/counterscale)（推荐统计）：自托管 Web Analytics，主要依赖 Workers 和 Analytics Engine，适合替代轻量 Umami/Plausible 场景。
- [lyc8503/UptimeFlare](https://github.com/lyc8503/UptimeFlare)（推荐状态页）：Workers 驱动的 uptime monitoring 和状态页，已迁移到 D1，支持全球地理位置检查，部署路径清楚。
- [eidam/cf-workers-status-page](https://github.com/eidam/cf-workers-status-page)：Workers + Cron Triggers + KV 的经典状态页，适合看早期 Workers 状态页架构。
- [bentleypark/aiwatch](https://github.com/bentleypark/aiwatch)：AI 服务状态监控，适合看 AI 服务可用性、延迟和事件分析。
- [brancogao/webhook-debugger](https://github.com/brancogao/webhook-debugger)：Workers + D1 的 Webhook 调试工具，支持签名验证、历史记录和重放。
- [brancogao/redirect-checker](https://github.com/brancogao/redirect-checker)：HTTP 重定向链分析器，适合做 API-first 小工具。

## D1、KV、R2 管理工具

- [DataflareApp/dataflare](https://github.com/DataflareApp/dataflare)（推荐多产品管理）：覆盖 D1、R2、KV、R2 SQL、Analytics Engine，适合集中管理 Cloudflare 数据产品。
- [outerbase/studio](https://github.com/outerbase/studio)（推荐 D1 GUI）：支持 Cloudflare D1，并提供 Deploy to Cloudflare，适合需要浏览器数据库 GUI 的场景。
- [JacobLinCool/d1-manager](https://github.com/JacobLinCool/d1-manager)：D1 Web UI 和 API，支持多数据库、表记录管理和 AI 查询辅助。
- [som3canadian/Cloudflare-KV-Manager](https://github.com/som3canadian/Cloudflare-KV-Manager)：KV Web 管理界面和 Python 小工具，适合补 KV 控制台体验。
- [G4brym/workers-qb](https://github.com/G4brym/workers-qb)：零依赖 Workers query builder，适合写 D1/Workers 项目时减少手写 SQL 拼接。

## 认证、密码和安全

- [zpg6/better-auth-cloudflare](https://github.com/zpg6/better-auth-cloudflare)（推荐鉴权）：把 Better Auth 和 Workers、D1、Hyperdrive、KV、R2、地理位置能力接起来，适合 Next.js、Hono 等 Cloudflare 全栈项目。
- [shuaiplus/nodewarden](https://github.com/shuaiplus/nodewarden)：跑在 Workers 上的 Bitwarden-compatible server，支持 R2 或 KV 附件。密码类项目要先看备份、访问控制和迁移策略，再考虑生产使用。
- [ValueMelody/melody-auth](https://github.com/ValueMelody/melody-auth)：面向 Workers 和 Node.js 的 OAuth/认证系统，适合看独立 Auth 服务。
- [nap0o/2fauth-worker](https://github.com/nap0o/2fauth-worker)：Workers/Docker 双模式 2FA/TOTP 管理系统，适合看 PWA、离线验证码和多通道备份。

## AI、LLM 和 Agent

> 官方项目（cloudflare/agents、cloudflare/vibesdk、cloudflare/moltworker）见上方"官方仓库和模板"。

- [smigolsmigol/llmkit](https://github.com/smigolsmigol/llmkit)：Workers + Durable Objects 的 AI API gateway，重点是成本跟踪、预算、限流和多 provider。
- [TBXark/ChatGPT-Telegram-Workers](https://github.com/TBXark/ChatGPT-Telegram-Workers)：Telegram ChatGPT Bot 的经典 Workers 项目，适合入门 Bot + Worker。
- [huarzone/Text2img-Cloudflare-Workers](https://github.com/huarzone/Text2img-Cloudflare-Workers)：Cloudflare AI + Workers 的文生图服务。
- [thun888/whisper_cloudflare](https://github.com/thun888/whisper_cloudflare)：部署在 Cloudflare 上的 Whisper 音频转写工具。
- [Ryce/keepmyclaw](https://github.com/Ryce/keepmyclaw)：Workers + D1 + R2 的 AI 代理加密云备份工具，适合看 AI workspace 备份。
- [fatwang2/gitpush](https://github.com/fatwang2/gitpush)：Workflows、Workers AI 和 Email Routing 组合的 GitHub 更新订阅工具。
- [TerryFYL/metareview](https://github.com/TerryFYL/metareview)：Pages + Workers AI + KV 的医学 Meta 分析平台，适合看垂直领域 AI 工具怎么落在 Cloudflare 上。

## Hono、API 和 SaaS Starter

- [honojs/hono](https://github.com/honojs/hono)（推荐 API 框架）：不是 Cloudflare 专属项目，但已经是 Workers API 生态的核心框架，适合做 REST API、Webhook、MCP Server 和 BFF。
- [cloudflare/chanfana](https://github.com/cloudflare/chanfana)（推荐 OpenAPI）：给 Hono、itty-router 等路由器补 OpenAPI 3/3.1 schema、请求校验、类型推导和自动文档。已有 Hono 项目可以渐进接入，不必重写旧路由。
- [supermemoryai/cloudflare-saas-stack](https://github.com/supermemoryai/cloudflare-saas-stack)（推荐 SaaS 骨架）：把 Cloudflare D1、Pages、鉴权、样式、存储打包成可部署 SaaS 骨架，适合做产品原型。
- [supermemoryai/backend-api-kit](https://github.com/supermemoryai/backend-api-kit)：Hono + Workers + D1 + Drizzle 的可变现 API 后端模板。
- [ifindev/fullstack-next-cloudflare](https://github.com/ifindev/fullstack-next-cloudflare)：Next.js 15 + Workers + D1 + R2 + Better Auth，适合看 Next.js 全栈怎么迁到 Cloudflare。
- [alwaysnomads/better-hono](https://github.com/alwaysnomads/better-hono)：Hono + Better Auth + Drizzle + Workers 的轻量 starter。
- 官方全栈起步优先回到上方 [cloudflare/templates](https://github.com/cloudflare/templates) 的 `react-router-hono-fullstack-template`、`react-postgres-fullstack-template` 和 `saas-admin-template`，再决定是否需要个人 starter。

## 网络和开发工具

这类不一定是"可部署应用"，但对 Cloudflare 开发很有帮助。

- [XIU2/CloudflareSpeedTest](https://github.com/XIU2/CloudflareSpeedTest)：Cloudflare CDN 延迟和速度测试工具，适合网络排查，不适合当应用模板。
- [WisdomSky/Cloudflared-web](https://github.com/WisdomSky/Cloudflared-web)：cloudflared CLI 的 Web UI 封装，适合管理 Tunnel。
- [alexpota/deploy-mcp](https://github.com/alexpota/deploy-mcp)：AI 助手可读的部署状态追踪器，支持 Cloudflare Pages 场景。
- [nicepkg/shotog](https://github.com/nicepkg/shotog)：Workers 上的 OG image 生成 API，适合做边缘截图/图片生成小服务。
- [jiacai2050/edgebin](https://github.com/jiacai2050/edgebin)：类似 httpbin 的边缘 HTTP 测试服务。

## 想找更多

这里不是全量清单。想继续挖，看这几个入口：

- [zhuima/awesome-cloudflare](https://github.com/zhuima/awesome-cloudflare)：中文入口，项目多。
- [irazasyed/awesome-cloudflare](https://github.com/irazasyed/awesome-cloudflare)：英文综合清单，偏 Workers recipes 和教程。
- [ghostwriternr/awesome-cloudflare](https://github.com/ghostwriternr/awesome-cloudflare)：Developer Platform 入口，覆盖 Workers、D1、R2、Pages、AI。
- [lukeed/awesome-cloudflare-workers](https://github.com/lukeed/awesome-cloudflare-workers)：Workers 早期生态清单，适合查历史项目。
- GitHub topic：[cloudflare-workers](https://github.com/topics/cloudflare-workers)、[cloudflare-pages](https://github.com/topics/cloudflare-pages)、[cloudflare-d1](https://github.com/topics/cloudflare-d1)、[cloudflare-r2](https://github.com/topics/cloudflare-r2)。

---
