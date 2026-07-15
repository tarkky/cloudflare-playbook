---
title: ## 9. 邮件
---

<script setup>
import { withBase } from 'vitepress'
import { Cloud, Bot, Wallet, Zap, Package, AlertTriangle, Globe, Search, ClipboardList, Link, Compass, Cpu, Database, Shield, Brain, Lock, Server, ListFilter, Code, FileText, Boxes, GitBranch, ArrowLeftRight, Container, Clock, Table, Key, HardDrive, Layers, Scan, UserCheck, LockKeyhole, ShieldAlert, Gauge, Umbrella, Braces, BrainCircuit, Network, Image, Video, Radio, MonitorPlay, ShoppingCart, Mail } from '@lucide/vue'
</script>

# 9. 邮件

Cloudflare Email Service 统一管理收发：出站 Email Sending 支持 Workers Binding、REST API 和 SMTP（Public Beta，需 Workers Paid）；入站 Email Routing 与 Email Workers 已 GA，Free 可用。平台负责 DKIM/SPF/DMARC、IP 声誉、退信重试和硬退信抑制。Email Workers 能直接调用 R2、Queues 和 Workers AI，适合做“邮件即工单”和 AI 自动回复。

**选型建议：**新项目用 Workers Binding，旧系统按需接 SMTP（仅 465 Implicit TLS），接收端用 Email Workers 处理路由和自动化。

详细内容见 → [Cloudflare Email](/email)

---
