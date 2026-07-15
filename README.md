# Cloudflare 实战手册

AI 编程时代的 Cloudflare 实战手册——用 AI 写代码，用 Cloudflare 部署到全球。

在线阅读：[chendahuang.com/playbook/cloudflare](https://chendahuang.com/playbook/cloudflare/)

## 全景图

```mermaid
flowchart TD
  A[Cloudflare 实战手册] --> I[AI 编程工作流<br/>Skill / MCP / Wrangler]
  A --> B[站点基础<br/>DNS / SSL / CDN / Rules]
  A --> C[计算<br/>Workers / Pages / DO / Workflows / Queues]
  A --> D[数据存储<br/>D1 / KV / R2 / Hyperdrive / Vectorize]
  A --> E[AI<br/>Workers AI / AI Gateway / Agents SDK]
  A --> F[媒体<br/>Images / Stream / Realtime / Browser]
  A --> G[安全<br/>Turnstile / Access / WAF / Rate Limiting]
  A --> H[观测<br/>Log Explorer / Observability / Analytics]
  A --> J[计费与额度<br/>Free vs Paid 对比]
  A --> K[架构模式<br/>常见组合与 trade-off]
```

## 目录

- [1. AI 编程工作流](#1-ai-编程工作流)
- [2. Cloudflare 功能模块](#2-cloudflare-功能模块)
- [3. 计费与额度](#3-计费与额度)
- [4. 开源项目](#4-开源项目)
- [5. 避坑指南](#5-避坑指南)
- [6. 国内访问](#6-国内访问)
- [7. Cloudflare Agents](#7-cloudflare-agents)
- [8. 域名](#8-域名)
- [9. 邮件](#9-邮件)
- [官方资源](#官方资源)

<main class="playbook-home">
  <section class="playbook-hero">
    <div>
      <h1>Cloudflare 实战手册</h1>
      <p>从开发、部署到排障，按真实任务找到下一步。</p>
    </div>
    <div class="playbook-actions">
      <a class="playbook-action primary" href="./chapters/01-ai-workflow"><span>开始阅读</span><svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <a class="playbook-action" href="#chapters"><span>查看全部章节</span><svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
    </div>
  </section>

  <section class="playbook-section" id="chapters">
    <div class="playbook-section-head">
      <h2>按任务开始</h2>
      <p>选择当前最需要解决的问题，直接进入对应章节。</p>
    </div>
    <div class="chapter-list">
  <a class="chapter-link" href="./chapters/01-ai-workflow">
    <span class="chapter-number">01</span>
    <span class="chapter-copy"><strong class="chapter-title">## 1. AI 编程工作流</strong><span class="chapter-description">接入 Skills、MCP、Wrangler 和运行日志，建立 AI 编程工作流。</span></span>
    <svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
  <a class="chapter-link" href="./chapters/02-platform-map">
    <span class="chapter-number">02</span>
    <span class="chapter-copy"><strong class="chapter-title">## 2. Cloudflare 功能模块</strong><span class="chapter-description">按真实场景理解 Cloudflare 的计算、存储、AI、媒体与安全能力。</span></span>
    <svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
  <a class="chapter-link" href="./chapters/03-pricing">
    <span class="chapter-number">03</span>
    <span class="chapter-copy"><strong class="chapter-title">## 3. 计费与额度</strong><span class="chapter-description">看懂 Free、Paid、额度边界和真实成本。</span></span>
    <svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
  <a class="chapter-link" href="./chapters/04-open-source">
    <span class="chapter-number">04</span>
    <span class="chapter-copy"><strong class="chapter-title">## 4. 开源项目</strong><span class="chapter-description">按用途挑选值得参考的官方与社区项目。</span></span>
    <svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
  <a class="chapter-link" href="./chapters/05-production-pitfalls">
    <span class="chapter-number">05</span>
    <span class="chapter-copy"><strong class="chapter-title">## 5. 避坑指南</strong><span class="chapter-description">把运行时、数据、安全和配置中的常见问题提前处理。</span></span>
    <svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
  <a class="chapter-link" href="./chapters/06-china-access">
    <span class="chapter-number">06</span>
    <span class="chapter-copy"><strong class="chapter-title">## 6. 国内访问</strong><span class="chapter-description">理解中国大陆访问、域名、缓存、线路与合规边界。</span></span>
    <svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
  <a class="chapter-link" href="./chapters/07-agents">
    <span class="chapter-number">07</span>
    <span class="chapter-copy"><strong class="chapter-title">## 7. Cloudflare Agents</strong><span class="chapter-description">把 Agent 部署成长期在线、有状态、能调度的服务。</span></span>
    <svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
  <a class="chapter-link" href="./chapters/08-domains">
    <span class="chapter-number">08</span>
    <span class="chapter-copy"><strong class="chapter-title">## 8. 域名</strong><span class="chapter-description">完成域名购买、托管、转移与 Cloudflare DNS 配置。</span></span>
    <svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
  <a class="chapter-link" href="./chapters/09-email">
    <span class="chapter-number">09</span>
    <span class="chapter-copy"><strong class="chapter-title">## 9. 邮件</strong><span class="chapter-description">用 Cloudflare 组合发送、接收、路由和邮件自动化。</span></span>
    <svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
  <a class="chapter-link" href="./chapters/10-resources">
    <span class="chapter-number">10</span>
    <span class="chapter-copy"><strong class="chapter-title">## 官方资源</strong><span class="chapter-description">集中查找官方文档、模板、限制与支持入口。</span></span>
    <svg class="chapter-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </a>
    </div>
  </section>

  <section class="playbook-section">
    <div class="playbook-section-head">
      <h2>全部 Playbook</h2>
      <p>同一套阅读系统，各自保留一个清晰主题。</p>
    </div>
    <nav class="playbook-family" aria-label="全部 Playbook">
      <a class="playbook-family-link" href="https://chendahuang.com/playbook/cloudflare/"><strong>Cloudflare</strong><span>开发、部署与生产运维</span></a>
      <a class="playbook-family-link" href="https://chendahuang.com/playbook/codex/"><strong>Codex</strong><span>长期协作与可靠交付</span></a>
      <a class="playbook-family-link" href="https://chendahuang.com/playbook/feishu/"><strong>飞书</strong><span>协作、AI 与 Agent 工作流</span></a>
      <a class="playbook-family-link" href="https://chendahuang.com/playbook/macos/"><strong>macOS</strong><span>软件、效率与系统维护</span></a>
    </nav>
  </section>
</main>
