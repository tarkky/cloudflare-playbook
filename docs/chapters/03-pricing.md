---
title: ## 3. 计费与额度
---

<script setup>
import { withBase } from 'vitepress'
import { Cloud, Bot, Wallet, Zap, Package, AlertTriangle, Globe, Search, ClipboardList, Link, Compass, Cpu, Database, Shield, Brain, Lock, Server, ListFilter, Code, FileText, Boxes, GitBranch, ArrowLeftRight, Container, Clock, Table, Key, HardDrive, Layers, Scan, UserCheck, LockKeyhole, ShieldAlert, Gauge, Umbrella, Braces, BrainCircuit, Network, Image, Video, Radio, MonitorPlay, ShoppingCart, Mail } from '@lucide/vue'
</script>

# 3. 计费与额度

以下数字来自 [Workers 定价页](https://developers.cloudflare.com/workers/platform/pricing/)、[Limits 文档](https://developers.cloudflare.com/workers/platform/limits/) 和各产品自己的 pricing/limits 页，按 2026 年 6 月的政策核对。

先记住一个判断方式：Cloudflare 的“免费”不是一种口径。有的服务达到 Free 上限后直接报错，有的服务 Free 可用、Paid 后继续按量计费，有的服务不按用量计费，而是跟随域名套餐、Zero Trust 计划或单独产品开通。

## 先搞懂额度怎么算

看下面的表格之前，先记住五条规则：

**1. 额度按不同级别算。** 有的按账号（Workers 10 万请求/天 = 全账号所有 Worker 共享），有的按域名（Email Routing 一个域名一套规则），有的按站点（Pages 静态请求无限是每个站点都无限）。多建几个 Worker 不会多出几份 10 万。

**2. 按天和按月不能直接换算。** Workers、D1、KV 是 /天，R2、Vectorize 是 /月。/天 的额度有峰值压力——某一天爆了就报错，不会等到月底。估算月用量时不能简单 ×30。

**3. 有些服务共享同一个池。** Workers、Pages Functions、Workflows、Cron 触发后的请求共享同一个 10 万/天。不是各给 10 万。

**4. 超出后有两种结果，这是最重要的安全线。**
- **报错型（不会扣钱）**：Workers、D1、KV、Queues、Durable Objects、Workers AI — 超了直接返回错误，不产生费用。
- **自动收费型（会扣钱）**：R2 — 超出 10 GB 存储后按 $0.015/GB 自动计费，没有开关可以关。不绑信用卡就不会扣，但额度用完就停。

**5. 额度不一定能叠加。** R2 的 10 GB 和 Workers $5 套餐完全无关，买了 $5 R2 额度也不会变。Workers AI 的 1 万 Neurons/天 在 Free 和 Paid 也一样。

## 免费能扛多少真实量

以下按常见项目类型估算，帮助判断免费额度是否够用：

| 典型场景 | 免费额度是否充足 | 可承载规模参考 |
| --- | --- | --- |
| 静态博客 / 文档站 | 充足 | Pages 静态请求免费无限；Workers Static Assets 静态资源请求同样免费无限 |
| 独立 SaaS 原型（注册 + 登录 + CRUD） | 充足（验证阶段） | 日活 1000 用户、每人每天 10 次请求 ≈ 1 万请求/天，远低于 10 万/天上限 |
| 图床 / 文件分享 | 起步阶段充足 | R2 10 GB ≈ 1 万张 1 MB 图片；D1 元数据可存数十万条 |
| 短链服务 | 小规模充足 | KV 1 GB ≈ 100 万条 1KB 映射；10 万读取/天 可扛中低流量 |
| AI 聊天 / RAG | 很快撞墙 | Workers AI 1 万 Neurons/天 ≈ 几十到几百次对话（取决于模型），demo 够用，上量必升 Paid |
| 域名邮箱（收信转发） | 无限免费 | Email Routing 不限收信量，`[email protected]` 转发到 Gmail 随便收 |
| Webhook 接收器 | 充足 | Workers 10 万请求/天 接 GitHub / Stripe webhook 绰绰有余 |
| 定时任务（Cron） | 小规模可用 | Free 仅 5 个 Cron/账号，每个任务 CPU 10ms，只能做轻量任务 |
| 本地服务暴露到公网 | 无限免费 | Cloudflare Tunnel 替代 ngrok，不限流量 |

## $0 能搭出什么

以下组合在免费额度内可长期运行，不产生费用：

> **域名邮箱 + 博客 + API + 数据库 + 文件存储 = $0/月**
>
> Email Routing（收信）+ Pages 或 Workers Static Assets（静态站）+ Workers（API）+ D1（5 GB 数据库）+ R2（10 GB 文件）+ KV（1 GB 缓存）+ Web Analytics（访问统计）+ Tunnel（本地调试）。
>
> 这套组合够一个独立开发者跑博客 + 小工具 + SaaS 原型，只要不超出额度，永久 $0。唯一要注意 R2 超出 10 GB 会自动收费，其他服务超了只是报错。

## 一句话看懂 Free vs Paid ($5/月)

- **新解锁**：Containers、Email Sending、Workers Logpush — Free 完全没有
- **额度提升**：Workers 请求 10 万/天 → 1000 万/月；单请求 CPU 10ms → 5 分钟；Workers Logs 保留 3 天 → 7 天
- **上限提升**：Worker 数 100 → 500；Cron 5 → 250；subrequests 50 → 10,000；Worker 包大小 3 MB → 10 MB
- **AI 行为变化**：Workers AI 仍是 1 万 Neurons/天，但 Paid 超出后能继续用并按量付费（Free 会报错停止）
- **关键区别**：Free 下超额度会报错停止、不扣钱；Paid 下超额度会**自动按量计费**，没有硬开关

## 计算

| 服务 | 免费额度 | 超出后 | 关键限制 |
| --- | --- | --- | --- |
| Workers | 10 万请求/天，CPU 10ms/请求 | 报错 Error 1027，不收费 | Worker 大小 3 MB（gzip 后），50 子请求/请求，100 个 Worker/账号 |
| Workflows | 10 万 invocation/天（共享 Workers 请求），CPU 10ms/invocation，1 GB 状态存储 | 报错，需升级 Paid；Paid 后按 Workers 请求、CPU 和存储计费 | 等待、sleep、空闲时不计 CPU；Free 默认保留状态 3 天 |
| Pages 静态 | 无限请求，500 次构建/月（1 个并发） | — | 单站点 20,000 文件，单文件 25 MiB，100 自定义域名 |
| Pages Functions | 同 Workers（共享 Workers 配额） | 同 Workers | 按 Workers 计费，不是独立产品 |
| Workers Static Assets | 静态资源请求免费且无限；动态请求走 Workers 配额 | 动态部分同 Workers | 20,000 文件/Worker，单文件 25 MiB |
| Durable Objects | 10 万请求/天，13,000 GB-s/天 | 报错，需升级 Paid | Free 只能用 SQLite 后端；KV 后端必须 Paid |
| Queues | 1 万操作/天 | 报错，需升级 Paid | 单消息 128 KB；Free 保留 24h，Paid 可配最长 14 天 |
| Cron Triggers | 5 个/账号 | 需要 Workers Paid 提升到 250 个/账号 | 触发后的代码仍按 Workers 请求和 CPU 计 |
| Containers | Free 不可用 | 需要 Workers Paid，包含 25 GiB-时内存、375 vCPU-分、200 GB-时磁盘 | 适合 Workers 跑不了的长进程和原生依赖 |

## 数据与存储

| 服务 | 免费额度 | 超出后 | 关键限制 |
| --- | --- | --- | --- |
| D1 | 5 GB 存储，500 万行读取/天，10 万行写入/天 | 报错，需升级 Paid | `rows_read` 是扫描行数不是返回行数；加索引能省很多 |
| KV | 1 GB 存储，10 万读取/天，1000 写入/天 | 报错，需升级 Paid | 单 key 25 MiB；同一 key 写入 1 次/秒；最终一致不是强一致 |
| R2 | 10 GB 存储，100 万 A 类操作/月，1000 万 B 类操作/月 | **按标准价计费**：$0.015/GB-月、$4.50/M A 类、$0.36/M B 类 | 出口流量永久免费；R2 免费额度和 Workers 计划无关 |
| Hyperdrive | 10 万查询/天 | 报错，需升级 Paid（Paid 无限） | 连接已有的外部 Postgres/MySQL，不是 Cloudflare 的数据库 |
| Vectorize | 3000 万查询维度/月，500 万存储维度 | Free 内用于原型；Paid 后超出按量计费 | 按“向量数量 × 维度”算，不按文档条数算 |
| DO Storage | SQLite 后端：500 万行读取/天，10 万行写入/天，5 GB 总存储 | 报错，需升级 Paid | 和 Durable Objects 绑定；SQLite 存储计费从 2026 年 1 月开始 |
| Secrets Store | 账号级密钥管理能力，不是用量型数据库 | 按绑定服务和权限体系使用 | 用来集中管理密钥；不要把 API Key 写进代码 |
| Pipelines | Streams、SQL transforms、Sinks 各 1 GB/月 | Free 超出不可继续按量；Paid 包含 50 GB/月，之后按 GB 计费 | 写入 R2 或 R2 Data Catalog 时，对应存储费用另算 |

## 网络与安全

| 服务 | Free 口径 | 说明 |
| --- | --- | --- |
| DNS | 所有计划包含 | 常规 DNS 查询不单独计费 |
| SSL/TLS | 所有计划包含 | Universal SSL 自动签发；高级证书和企业能力另算 |
| Cache / CDN | 所有计划包含 | 静态资源缓存不额外计费；高级缓存策略随计划变化 |
| Rules | 基础规则可用 | Redirect、Cache、Configuration、Transform 等规则按类型和套餐有数量差异 |
| WAF | 基础防护可用 | 托管规则、自定义规则、Bot 等高级能力随套餐变化 |
| Rate Limiting | 基础限流能力可用 | 规则数量和高级匹配能力随套餐变化 |
| Turnstile | 免费无限 | 验证码替代方案，不按月度挑战次数收费 |
| Access | 50 用户免费 | 超过需要 Cloudflare One 订阅 |
| DDoS 防护 | 所有计划默认开启 | L3/L4/L7 防护不是按请求单独计费 |
| API Shield | 按安全能力开放 | Schema 校验、mTLS、API Discovery 等能力要看当前计划 |
| Email Routing | 免费，收信无限 | 域名邮箱收信转发到外部邮箱；每域名 200 条路由规则，单邮件 25 MiB |
| Email Sending | Free 不可用 | 需 Workers Paid：3000 封/月包含，超出 $0.35/千封；发到已验证目标地址在所有 plan 免费 |
| Tunnel | 免费，无限 | 把本地服务安全暴露到公网，替代 ngrok；需安装 cloudflared |
| Workers Builds | 免费 | Git 推送自动构建部署 Worker，无需本地装 Wrangler |

## AI

| 服务 | 免费额度 | 超出后 |
| --- | --- | --- |
| Workers AI | 每天 10,000 Neurons（Free 和 Paid 都有） | Free 报错；Paid 按 $0.011/千 Neurons |
| AI Gateway | 核心能力免费；持久日志 Free 为 10 万条总量 | Paid 每个 gateway 1000 万条日志；Logpush 只在 Paid 可用 |
| Vectorize | 3000 万查询维度/月，500 万存储维度 | Paid 包含 5000 万查询维度/月、1000 万存储维度，超出按量 |
| AI Search | Open beta 期免费；Free：100 个实例、2 万查询/月、每天最多抓取 500 页 | Paid 查询不限量；Workers AI 和 AI Gateway 用量仍单独计 |
| Agents SDK | 没有单独免费额度 | 按底层 Workers、Durable Objects、D1、Vectorize、Workers AI 等资源计费 |

## 媒体

| 服务 | 免费额度 | 超出后 | 关键限制 |
| --- | --- | --- | --- |
| Images | 5000 次 unique transformations/月 | Free 新转换返回 9422，不自动收费；Paid 后 $0.50/1000 次 | Images 内置存储和交付只在 Images Paid 可用 |
| Stream | 没有固定免费分钟包 | 存储 $5/1000 分钟；交付 $1/1000 分钟 | 上传和编码免费；按视频时长计，不按文件大小计 |
| Realtime | SFU + TURN 合计 1000 GB/月免费 | $0.05/GB | 只按 Cloudflare 边缘到客户端的流量计费 |
| Browser Run | 10 分钟/天，Browser Sessions 最多 3 个并发浏览器 | Paid 包含 10 小时/月和 10 个并发浏览器，之后按量 | Quick Actions 只计浏览器时间；Browser Sessions 还计并发浏览器 |

## 观测与日志

| 服务 | 免费额度 | 超出后 | 关键限制 |
| --- | --- | --- | --- |
| Workers Logs / Observability | 20 万事件/天，保留 3 天 | Paid 包含 2000 万事件/月，保留 7 天；超出 $0.60/百万事件 | 用来排查 Worker 和 Pages Functions 运行问题 |
| Workers Logpush | Free 不可用 | Paid 包含 1000 万请求/月，之后 $0.05/百万请求 | 把 Workers Trace Events 推到外部目的地 |
| Log Explorer | 独立日志产品，不按 Workers Free 额度 | 按 Log Explorer 计费页核对 | 适合跨产品查日志，不等同于 Workers Logs |
| Web Analytics | 免费使用 | — | 看站点访问、来源和 Web Vitals，不依赖传统第三方追踪 |
| Analytics Engine | 10 万 data points/天，1 万 read queries/天 | Paid 包含 1000 万 data points/月、100 万 read queries/月 | 当前官方说明为暂不计费，价格信息用于提前估算 |
| Trace | Dashboard 排查工具 | — | 用来模拟请求命中规则、缓存、Worker、安全策略的路径 |

## 容易踩到的平台限制

这些不一定都写在定价表里，但在 [Limits 文档](https://developers.cloudflare.com/workers/platform/limits/) 或对应产品 limits 页里写得很清楚，Free 和 Paid 都适用：

| 限制 | Free | Paid |
| --- | --- | --- |
| 单 Worker 内存 | 128 MB | 128 MB |
| Subrequests/请求 | 50 | 10,000 |
| Cache API calls/请求 | 50 | 1,000 |
| 环境变量数量/Worker | 64 | 128 |
| Worker 大小（gzip 后） | 3 MB | 10 MB |
| Worker 启动时间 | 1 秒 | 1 秒 |
| 同时打开的子请求连接 | 6 | 6 |
| 单请求日志大小 | 256 KB | 256 KB |
| 每账号 Worker 数 | 100 | 500 |
| Cron Triggers/账号 | 5 | 250 |
| 静态资源文件数/Worker | 20,000 | 100,000 |
| 请求 body 大小 | 100 MB | 100 MB（受 Cloudflare 计划限制，非 Workers 计划） |
| DNS 记录数/域名 | 1,000 | 1,000（Enterprise 默认 3,500） |

> 最后核对：2026-06-22。数字来自 Cloudflare 官方文档，可能随时调整。部署前以官方页面为准：[Workers 定价页](https://developers.cloudflare.com/workers/platform/pricing/)、[Limits 文档](https://developers.cloudflare.com/workers/platform/limits/)、[R2 Pricing](https://developers.cloudflare.com/r2/pricing/)、[Images Pricing](https://developers.cloudflare.com/images/pricing/)、[Stream Pricing](https://developers.cloudflare.com/stream/pricing/)、[Realtime Pricing](https://developers.cloudflare.com/realtime/sfu/pricing/)、[Browser Run Pricing](https://developers.cloudflare.com/browser-run/pricing/)、[AI Search Limits & Pricing](https://developers.cloudflare.com/ai-search/platform/limits-pricing/)、[Email Service Pricing](https://developers.cloudflare.com/email-service/platform/pricing/)、[Email Service Limits](https://developers.cloudflare.com/email-service/platform/limits/)。

---

## Paid ($5/月) 完整额度对比

> 表格"超出后"列有价格的服务 = **自动按量计费**（会扣钱）；写"不单独收费"或"—"的 = 不会额外扣费。R2 不在此表，它和 $5 套餐无关，见下方"需要特别注意"。

| 服务 | Free | Paid ($5/月) 包含 | 超出后 |
| --- | --- | --- | --- |
| Workers 请求 | 10 万/天 | 1000 万/月 | $0.30/百万请求 |
| Workers CPU 时间 | 10ms/请求 | 3000 万 ms/月 | $0.02/百万 CPU ms |
| 单请求 CPU 上限 | 10ms | 5 分钟（默认 30s，可调） | — |
| Cron / Queue CPU 上限 | 10ms | Queue Consumer 15 分钟；Cron 30 秒（间隔 < 1 小时）或 15 分钟（间隔 >= 1 小时） | 长任务仍要控制成本和失败重试 |
| Workers Logs | 20 万事件/天，保留 3 天 | 2000 万事件/月，保留 7 天 | $0.60/百万事件 |
| Workers Logpush | 不可用 | 1000 万请求/月 | $0.05/百万请求 |
| Workflows 请求和 CPU | 同 Workers 请求和 CPU | 同 Workers 请求和 CPU | 不单独收步骤调用费 |
| Workflows 存储 | 1 GB | 1 GB | $0.20/GB-月 |
| KV 读取 | 10 万/天 | 1000 万/月 | $0.50/百万 |
| KV 写入 | 1000/天 | 100 万/月 | $5.00/百万 |
| KV 存储 | 1 GB | 1 GB | $0.50/GB-月 |
| D1 行读取 | 500 万/天 | 250 亿/月 | $0.001/百万行 |
| D1 行写入 | 10 万/天 | 5000 万/月 | $1.00/百万行 |
| D1 存储 | 5 GB | 5 GB | $0.75/GB-月 |
| Durable Objects 请求 | 10 万/天 | 100 万/月 | $0.15/百万 |
| Durable Objects 时长 | 1.3 万 GB-s/天 | 40 万 GB-s/月 | $12.50/百万 GB-s |
| DO SQLite Storage | 500 万行读取/天，10 万行写入/天，5 GB | 250 亿行读取/月，5000 万行写入/月，5 GB | 读取 $0.001/百万行，写入 $1/百万行，存储 $0.20/GB-月 |
| Queues 操作 | 1 万/天 | 100 万/月 | $0.40/百万操作 |
| Workers AI Neurons | 1 万/天 | 1 万/天（和 Free 相同，但 Paid 超出后能继续用） | $0.011/千 Neurons |
| AI Gateway 持久日志 | 10 万条总量 | 每个 gateway 1000 万条 | 核心网关免费；高级能力按对应产品计 |
| AI Gateway Logpush | 不可用 | 1000 万请求/月 | $0.05/百万请求 |
| AI Search 查询 | 2 万/月 | 不限量（open beta） | Workers AI 和 AI Gateway 另算 |
| AI Search 实例 | 100 个/账号 | 5000 个/账号 | open beta 期免费 |
| AI Search 文件和抓取 | 每实例 10 万文件；每天最多抓取 500 页 | 每实例 100 万文件，hybrid search 为 50 万；抓取不限量 | 单文件最大 4 MB |
| Vectorize 查询维度 | 3000 万/月 | 5000 万/月 | $0.01/百万 |
| Vectorize 存储维度 | 500 万 | 1000 万 | $0.05/1 亿 |
| Hyperdrive 查询 | 10 万/天 | 无限 | — |
| Pipelines | Streams / SQL transforms / Sinks 各 1 GB/月 | Streams 不限量；SQL transforms 和 Sinks 各 50 GB/月 | SQL transforms $0.04/GB；Sinks 按格式 $0.03-$0.06/GB |
| Analytics Engine | 10 万 data points/天，1 万 read queries/天 | 1000 万 data points/月，100 万 read queries/月 | 当前暂不计费，官方价格用于提前估算 |
| Browser Run | 10 分钟/天，3 并发浏览器 | 10 小时/月，10 并发浏览器 | $0.09/小时；并发浏览器 $2/个 |
| Containers | 不可用 | 25 GiB-时内存、375 vCPU-分、200 GB-时盘 | 按量 |
| Containers 出口流量 | 不可用 | 北美/欧洲 1 TB；大洋洲、韩国、台湾 500 GB；其他地区 500 GB | 超出按地区 $0.025-$0.05/GB |
| Email Sending | 不可用 | 3000 封/月 | $0.35/千封（发到已验证目标地址免费，不计入额度） |

> 最后核对：2026-06-22。以 [Workers 定价页](https://developers.cloudflare.com/workers/platform/pricing/) 为准。

## 需要特别注意

- **R2 的免费额度和 Workers 计划无关**。所有人都能用 10 GB 存储 + 100 万 A 类 + 1000 万 B 类操作，不管买不买 $5 套餐。超出按 $0.015/GB-月、$4.50/M A 类、$0.36/M B 类算。R2 没有"停止计费"开关，也没有可靠的 per-service 用量告警，是整个 Cloudflare 里最容易意外扣费的服务。
- **买 $5 套餐 = 失去 Free 的自动刹车**。Free 下 Workers 请求超 10 万/天会返回 1024 错误、不扣钱；Paid 下超 1000 万/月会自动按量计费。这是升级时最容易忽略的代价。
- **静态资源请求永远免费无限**，即使跑在 Workers Static Assets 上也不计入 Workers 请求配额。Pages 静态请求同理，只有 Pages Functions 走 Workers 配额。
- **Service Bindings 不额外计请求费**。一个 Worker 通过 Service Binding 调另一个 Worker，不会因为内部拆分多收一次请求费。
- **Durable Objects 的 SQLite 存储从 2026 年 1 月开始计费**，按 D1 类似的 rows read / rows written / storage 口径算。
- **Images、Stream、Realtime 不是 Workers Paid 套餐的一部分**。它们有自己的免费额度或独立价格，不要和 $5 套餐混在一起算。

## 计费示例

| 场景 | 月请求 | 平均 CPU | 月账单 |
| --- | --- | --- | --- |
| 1500 万请求，7ms CPU/请求 | 1500 万 | 7ms | **$8.00**（$5 + $1.50 请求 + $1.50 CPU） |
| 1 亿请求，7ms CPU/请求 | 1 亿 | 7ms | **$45.40**（$5 + $27 请求 + $13.40 CPU） |
| 1500 万请求，80% 是静态资源 | 1500 万 | — | **$5.00**（静态资源请求免费且无限） |
| Cron 每小时跑 1 次，每次 3 分钟 CPU | 720 | 3 分钟 | **$6.99**（$5 + $1.99 CPU） |

独立开发者更常见的量级举例：

| 场景 | 月用量 | 月账单 |
| --- | --- | --- |
| 博客 + 小 API：50 万请求，3ms CPU | 50 万请求 | **$5.00**（远在 1000 万额度内） |
| 小 SaaS：200 万请求，10ms CPU，D1 读写 1000 万行 | 200 万请求 | **$5.00**（额度内，D1 读写也在 250 亿/5000 万内） |
| 偶尔用 AI：每天 5000 Neurons | ~15 万 Neurons/月 | **$5.00**（在 1 万/天免费额度内） |
| R2 存 15 GB 图片 | 15 GB 存储 | **$5.00 + $0.075 R2**（R2 和 $5 套餐分开算，超出 10 GB 按 $0.015/GB） |
| R2 存 50 GB + 200 万 A 类操作 | 50 GB / 200 万 A 类 | **$5.00 + $0.60 R2**（存储 $0.60 + A 类 $0.45 + B 类约 $0） |

> 静态资源请求免费是 Workers Static Assets 的关键优势：前端放在 Static Assets 上后，只有进入 Worker 的动态请求才计费。

## 什么时候升级

**建议升级的场景**：
- 日均请求超过 10 万，Free 已经开始报错
- 需要更长的 CPU 时间（处理大文件、复杂计算、AI 推理、SSR）
- 需要更高的平台上限（Worker 包大小、subrequests、Cron Triggers）
- 需要用 Containers、Email Sending、Durable Objects KV 后端、Workers Logpush
- 项目已经有真实用户，需要 7 天的 Workers Logs 来排查问题

**暂不需要升级的场景**：
- 个人博客、文档站 — Pages 静态请求免费无限
- 早期验证阶段 — 先跑通再付费
- 只用 R2 存文件 — R2 免费额度和 $5 套餐无关

## 成本控制

升级到 Paid 后最大的变化是：**Free 下超额度会报错停止，Paid 下超额度会自动扣费**。需要主动设防，风险分三档：

**高风险：R2（和 $5 套餐无关，但会出现在同一张账单上）**
- R2 没有"停止计费"开关，超出 10 GB 自动按 $0.015/GB 扣
- Cloudflare 的 Usage Based Billing 通知需要 Pro 计划（$20/月）或更高，$5 套餐用户用不了
- 定期查看 dashboard：**R2** > 选 bucket > **Metrics** 标签，或用 GraphQL Analytics API 编程查询（`r2StorageAdaptiveGroups` 数据集）

**中风险：按量计费的服务（Workers 请求/CPU、Workers AI、Containers、Email Sending）**
- 这些服务超额度后自动按量计费，没有总消费上限
- **设 CPU 上限防单次请求爆掉**：在 `wrangler.jsonc` 里加

```json
{
  "limits": {
    "cpu_ms": 30000
  }
}
```

  或者在 dashboard 里 **Workers & Pages** > 选 Worker > **Settings** > **CPU Limits** 设置。单次请求超过会被强制终止，不会因为一个 bug 把额度吃光。

- **Workers AI 监控**：https://dash.cloudflare.com/?to=/:account/ai/workers-ai 可看每日 Neurons 用量。超 1 万/天会自动按 $0.011/千 Neurons 扣，没有开关
- **Email Sending**：3000 封/月免费额度，超出 $0.35/千封。发到已验证目标地址不计入额度

**低风险：报错型服务（D1、KV、Queues、Durable Objects、Vectorize）**
- 这些在 $5 套餐下超额度后仍会报错停止，不会自动扣费（除非用量极大进入按量区间）

## 如何升级或取消

- **升级**：dashboard → **Workers & Pages** → 右侧 **Manage Plans** 或 **Subscriptions** → 选 Workers Paid
- **取消**：同一入口降回 Free。当月已付的 $5 不退，下月不再扣
- 降级后：Workers 请求回到 10 万/天（报错型），Containers/Email Sending/Logpush 停止可用

---
