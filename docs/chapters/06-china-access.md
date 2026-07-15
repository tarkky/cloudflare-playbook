---
title: ## 6. 国内访问
---

<script setup>
import { withBase } from 'vitepress'
import { Cloud, Bot, Wallet, Zap, Package, AlertTriangle, Globe, Search, ClipboardList, Link, Compass, Cpu, Database, Shield, Brain, Lock, Server, ListFilter, Code, FileText, Boxes, GitBranch, ArrowLeftRight, Container, Clock, Table, Key, HardDrive, Layers, Scan, UserCheck, LockKeyhole, ShieldAlert, Gauge, Umbrella, Braces, BrainCircuit, Network, Image, Video, Radio, MonitorPlay, ShoppingCart, Mail } from '@lucide/vue'
</script>

# 6. 国内访问

Cloudflare 免费全球网络不等于中国大陆加速。大陆访问质量受运营商、线路、DNS、监管和目标服务形态影响，不能只看海外测速。这一节专门把国内访问这件事讲清楚。

## 先分清两件事

Cloudflare 普通 Free/Pro/Business 网络，可以服务全球用户，但不保证中国大陆访问稳定。Cloudflare 的 [China Network](https://developers.cloudflare.com/china-network/) 是企业级能力，通过 Cloudflare 和京东云数据中心服务中国大陆访问，接入前需要 Enterprise 计划、单独订阅，并且每个接入的根域名都要有 ICP 备案。

简单记成两条：

- **普通全球网络**：免费也能用，国内访问“看运气”，不承诺。
- **China Network**：企业级付费能力，国内有节点，要 ICP，要 Enterprise 套餐。

## 国内访问到底慢在哪 / 为什么打不开

国内访问 Cloudflare 不稳定，问题通常不在 Cloudflare 本身，而在下面这几层：

**DNS 层**。`1.1.1.1` 在国内被污染，国内递归 DNS 解析 Cloudflare 域名时常返回错误或劣质 IP。即便你域名在 Cloudflare 上配得很对，用户那边 DNS 解析的第一步就可能走偏。

**路由层**。电信、联通、移动到 Cloudflare 边缘节点的路径不同，高峰期丢包、绕路、TCP 重传很常见。同一个域名，电信通、移动不通，是真实存在的情况。

**域名层**。`*.workers.dev`、`*.pages.dev`、`*.r2.dev` 在国内经常被污染或不可达。这是为什么“用自己的域名”几乎是硬要求。

**产品层**。Turnstile 的 JS、Web Analytics 的 JS、Workers AI 的端点、Access 的登录页，这些都要从固定域名加载，国内可用性差异很大。你的页面通了，但这些第三方资源没通，页面仍然像坏掉。

把“全球可用”和“国内可用”分开看，是这一节最重要的视角。

## 各产品在国内的真实表现

下面这张表按产品列一下默认域名在国内的常见表现，仅供参考，具体以你自己的多地拨测为准：

| 产品 | 默认域名国内可达 | 自定义域名后 | 典型症状 |
| --- | --- | --- | --- |
| Workers | `*.workers.dev` 常被污染 | 绑自有域名明显改善 | 偶发 522 / DNS 解析到奇怪 IP |
| Pages | `*.pages.dev` 常被污染 | 绑自有域名明显改善 | 同上 |
| Workers Static Assets | 跟随 Worker 域名 | 同上 | 同上 |
| R2 | `*.r2.dev` 国内不稳定 | 绑自有域名后改善 | 大文件下载慢、断流 |
| D1 | 无独立域名，经 Worker 访问 | 跟随 Worker | 跟随 Worker |
| KV | 无独立域名，经 Worker 访问 | 跟随 Worker | 跟随 Worker |
| Tunnel | 客户端连 CF 边缘节点 | — | 客户端连接稳定性看运营商 |
| Access | 登录页加载第三方 JS | — | 登录页加载慢或卡住 |
| Turnstile | JS 从 Cloudflare 域名加载 | — | 验证组件不显示、表单提交失败 |
| Web Analytics | JS 从 Cloudflare 域名加载 | — | 数据上报失败，不影响页面渲染 |
| Workers AI | 固定端点 | — | 请求超时或被重置 |
| Email Routing | 收信不受影响，发信看目标邮箱 | — | 国内邮箱投递可能进垃圾箱 |

一句话总结：能绑自有域名的，一定要绑；加载第三方 JS 的，做好降级；纯端点型的，国内别当主线路。

## 橙云 vs 灰云

DNS 记录在 Cloudflare 上有橙云和灰云两种状态，国内访问语境下差别很大：

- **橙云（Proxied）**：流量走 Cloudflare 全球网络，受上面那些因素影响，国内访问“看运气”。
- **灰云（DNS only）**：只走 Cloudflare DNS，不进 Cloudflare 代理，可以直接指向国内源站或国内 CDN。

如果你有国内源站或国内 CDN，把记录设为灰云、指向国内 IP，是国内访问最稳的做法。橙云和灰云可以在 Cloudflare 后台一条记录一条记录地切换，不是全或无。

## 备案这件事

ICP 备案是工信部的要求，面向中国大陆运营的网站通常需要 ICP 备案或许可证。关键事实先讲清楚：

- **服务器在国内，必须备案**。阿里云、腾讯云、华为云等国内云服务商在你开通 80/443 端口时会强制要求域名备案，没备案会拦截访问。
- **服务器在境外（包括 Cloudflare），不需要备案**。但国内访问可能不稳定，这是网络问题，不是备案问题。
- **境外注册商买的域名，通常无法备案**。工信部要求备案域名的注册服务单位必须取得工信部批复，Namecheap、Cloudflare Registrar、Porkbun、Name.com 等多数境外注册商都不在批复名单里，这些域名没法直接备案。解决办法是把域名转入境内注册商（阿里云、腾讯云、西部数码等），转入后可以走备案流程。
- **未备案 ≠ 被墙**。域名本身不会因为“没备案”被墙，网站被墙的原因通常是内容违规。境外服务器 + 未备案域名 + Cloudflare 代理，是大量个人项目、文档站、开源项目的常态，能不能访问看线路和内容，不看备案。
- **企业面向大陆正式运营，绕不开备案**。这是法律问题，不是技术问题。

Cloudflare China Network 文档里专门有一页 [ICP](https://developers.cloudflare.com/china-network/concepts/icp/)，把接入 China Network 必须的备案要求讲清楚了，企业方案照着走。

## 普通项目怎么做

个人文档、开源项目、工具站、独立开发者 SaaS 原型，可以先这样处理：

- **用自己的域名，不要只给 `workers.dev` 或 `pages.dev`**。这是国内访问的第一条硬要求。
- **页面尽量静态化，减少首屏 API 依赖**。静态资源命中边缘缓存后不回源，国内体感差异巨大。
- **自托管所有静态资源**。字体、图片、JS 不要拉 Google Fonts、jsdelivr、cdnjs 这类国内不稳的第三方 CDN，能自己挂就自己挂。
- **图片压缩，静态资源文件不要过大**。国内移动网络下，1MB 和 300KB 是两个体验。
- **给关键资源设清楚的缓存策略**。Cache Rules 配好 TTL，HTML 短缓存、静态资源长缓存。
- **用国内外多地监控看真实可用性，不只看自己电脑**。自己通不代表全国通。
- **第三方 JS 做好降级**。Turnstile、Web Analytics 这种加载失败时不要把页面拖死。
- **中国大陆是主要用户，准备国内镜像或符合要求的国内部署方案**。不要硬押一条海外线路。

## 常见症状 → 大概原因

国内访问出问题时，按症状先做粗略判断，再让 AI 开 Observability MCP 看日志：

- **偶发 522 / 523**：源站连接超时或不可达，看源站状态和线路。
- **首次打开慢、刷新快**：首次回源、二次命中缓存，正常现象，缓存策略调好就行。
- **某地区打不开、其他地区正常**：运营商或区域 DNS 问题，用拨测看分布。
- **TLS 握手失败 / 证书错**：可能是污染，也可能是中间盒（运营商劫持），换 DNS 试。
- **DNS 解析到奇怪 IP**：国内递归 DNS 污染，换 DoH/DoT 或换 DNS 服务器。
- **页面通了但功能挂了**：第三方 JS（Turnstile、Analytics）没加载，做降级。

## 国内测速和拨测工具

自己测不如多地测。下面几个是国内开发者常用的拨测工具，免费够用：

| 工具 | 地址 | 特点 |
| --- | --- | --- |
| **ITDOG** | [itdog.cn](https://www.itdog.cn/) | 全国多地 HTTP / Ping / Traceroute，社区活跃，免费够用 |
| **17 测** | [17ce.com](https://www.17ce.com/) | 老牌，HTTP、Ping、路由跟踪、DNS 解析都覆盖 |
| **站长之家测速** | [tool.chinaz.com/speed](https://tool.chinaz.com/speed/) | 简单粗暴，全国多节点 HTTP 测速 |
| **拨测** | [boce.com](https://www.boce.com/) | HTTP / Ping / DNS / Traceroute，按运营商细分 |
| **阿里云拨测** | 阿里云控制台内 | 阿里官方，免费额度足够日常用 |
| **腾讯云拨测** | 腾讯云控制台内 | 腾讯官方，节点覆盖广 |

外加一个海外视角：[Cloudflare Status](https://www.cloudflarestatus.com/) 看 CF 自己节点的状态，[ping.pe](https://ping.pe/) 看全球到你这台机器的延迟。

## 国内为主 vs 海外为主的方案选型

按业务主市场选方案，别把所有情况都套一个模板：

- **海外为主，国内少量读者**：Cloudflare 免费 + 自有域名 + 页面轻量化 + 多地拨测。够了。
- **国内为主，海外少量**：国内云主站（备案 + 国内 CDN）+ Cloudflare 做海外镜像，或用智能 DNS 按地理分流。
- **国内海外都重要**：双轨部署，按地理 DNS 分流，国内一套、海外一套，不要硬塞一个方案。
- **企业 + 必须国内加速 + 能备案**：Cloudflare China Network（Enterprise + ICP + 单独订阅）。
- **个人项目，国内访问不要求稳定**：免费方案 + 自有域名先用，撞墙再说。

## 更稳的做法

- 对国内访问速度保持合理预期，Cloudflare 全球网络不等于中国大陆加速。
- 生产业务绑定自有域名，避免只依赖 `workers.dev`、`pages.dev` 等默认域名。
- 面向大陆正式运营的项目，提前完成 ICP 备案和合规准备。
- 选择合规的部署方案，法律风险远比技术风险更值得优先关注。
- 第三方 JS（Turnstile、Analytics 等）做好降级处理，国内加载失败是常态而非例外。
- 上线前使用多地拨测工具验证可用性，本地测试通过不代表全国可用。

## 合规边界

ICP 备案、内容合规、数据出境是法律问题，不是 Cloudflare 能替你解决的。技术方案只回答“能不能访问”，不回答“该不该这么部署”。

---
