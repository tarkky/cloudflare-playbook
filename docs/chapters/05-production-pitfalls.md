---
title: ## 5. 避坑指南
---

<script setup>
import { withBase } from 'vitepress'
import { Cloud, Bot, Wallet, Zap, Package, AlertTriangle, Globe, Search, ClipboardList, Link, Compass, Cpu, Database, Shield, Brain, Lock, Server, ListFilter, Code, FileText, Boxes, GitBranch, ArrowLeftRight, Container, Clock, Table, Key, HardDrive, Layers, Scan, UserCheck, LockKeyhole, ShieldAlert, Gauge, Umbrella, Braces, BrainCircuit, Network, Image, Video, Radio, MonitorPlay, ShoppingCart, Mail } from '@lucide/vue'
</script>

# 5. 避坑指南

下面按产品列踩坑点和原理。如果你手上有个错误码不知道属于哪一层，先查这张表定位，再翻对应条目深读：

| 错误码 | 层 | 第一眼看什么 | 跳到哪条深读 |
| --- | --- | --- | --- |
| `1016` | DNS / origin | 源站 DNS 记录是否正确、NS 是否切到 Cloudflare | 配置与工具 #4（Custom Domain vs Routes） |
| `520`–`524` | 源站 | 源站是否健康、是否在跑、超时配置 | 第 1 节源站相关模块 |
| `525` / `526` | TLS | SSL/TLS 模式、源站证书是否有效 | 第 1 节 SSL/TLS |
| `1020` | 安全 | Security Events、WAF 规则 | 第 1 节 WAF |
| `1101` | Worker 代码 | Workers Logs 看异常堆栈 | Workers 运行时 |
| `1102` | Worker CPU | 拆任务或挪 Workflows | Workers 运行时 #1 |
| `1027` | 额度 | 用量看板、考虑升级 | 第 3 节 |

AI 看到 5xx 容易直接去改 Worker 代码，但 `522` 是源站问题、`1020` 是 WAF 拦截、`1027` 是额度耗尽——改代码都救不了。喂上下文时把错误码归属哪层一起告诉它。

## Workers 运行时

1. **为什么 Worker 跑着跑着就被杀了？**

   Worker 跑在 Cloudflare 的 V8 isolate 里，运行时间有两种计时方式，搞混了就会踩坑。第一种是 CPU 时间，只算代码真正在执行的时间——你在等 `fetch()` 返回、等 D1 查询结果、等 R2 读取的时候都不算在内。Free 每请求 10ms，Paid 默认 30 秒、可以通过 `limits.cpu_ms` 调到 5 分钟，超了会返回 `1102` 错误。第二种是 wall time，就是真实经过的时间，按调用类型有不同上限：HTTP 请求没有限制，但 Cron 触发器、Queue consumer、Durable Object alarm 都是 15 分钟封顶，超了直接被强杀。

   如果你有重活——解析大 JSON、生成 PDF、处理图片——别想塞在一个请求里。拆成多次请求，或者挪到 Queues 做后台批处理。要是需要跑几十分钟到几小时的长流程，用 [Workflows](https://developers.cloudflare.com/workflows/)：它把任务拆成多步，每步独立持久化，某一步失败只重试那一步，不用从头再来。

   来源：[Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

2. **为什么 `arrayBuffer()` 会让 Worker OOM？**

   Worker 的 128 MB 内存是按 isolate 分配的，不是每请求单独 128 MB——并发请求共享这一块内存。当你 `await response.text()` 或 `arrayBuffer()` 把一个大 response body 整个缓存进内存，几个并发请求同时这么干，isolate 就撑爆了。还有一个容易忽略的限制：同时等待响应头的出站连接最多 6 个（fetch、KV、R2、Queues、Cache API、TCP connect、出站 WebSocket 都算），响应头到了才释放名额。

   大 body 要用流式透传：`return new Response(object.body, ...)`，数据流过 Worker 但不缓存在内存里。如果不需要 body（比如只关心状态码），调 `response.body.cancel()` 释放内存。并发 fetch 别一次开七八个，批处理改用 KV bulk、Queues `sendBatch` 或 R2 `list`。

   来源：[Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

3. **为什么部署被拒、冷启动慢？**

   Worker 的包大小有限制：压缩后 Free 3 MB、Paid 10 MB，压缩前 64 MB。启动时间必须小于 1 秒——也就是执行 global scope 的时间，否则部署直接被拒，报错误 10021。元凶通常是顶层重初始化：大 schema 解析、顶层 query DB、打包进去的二进制或静态资产。这些东西放在顶层，每次冷启动都要跑一遍，既拖慢启动又撑大包。

   解决办法是把配置、二进制、静态资产挪到 KV、R2、D1 或 Workers Static Assets，用 Service Bindings 把大 Worker 拆成几个小的，顶层只做轻量初始化。

   来源：[Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

4. **为什么日志和缓存写入偶尔丢失？**

   如果你有一个 Promise 既没 `await`、也没 `return`、也没传给 `ctx.waitUntil()`，它就是"浮动 Promise"。运行时会在它完成前终结 isolate，结果静默丢失——不会报错，就是没了。典型症状：webhook 偶发性没发出去、缓存写入偶发性失败、生产 bug 复现不了。

   规则很简单：响应依赖结果就 `await`，不依赖就用 `ctx.waitUntil()`。最好开 ESLint 的 `no-floating-promises` 规则或 oxlint 对应规则，在编译期就拦住，别等生产出怪事。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

5. **为什么 A 用户的数据被下一个请求读到了？**

   Workers 会复用 isolate 来处理多个请求，模块级用 `let` 声明的变量在下一个请求里还在。这会导致用户数据泄漏——A 用户的 `X-User-Id` 被下一个请求读到、状态错乱，甚至抛 `Cannot perform I/O on behalf of a different request`。还有一个隐蔽的坑：binding 改动后 Cloudflare 可能复用旧 isolate，`let client ??= new Client(env.KEY)` 会拿到旧 secret 而不是新的。

   请求级数据走函数参数或 `env` 传递，每请求 `new Client(env.MY_SECRET)` 新建客户端。如果需要跨函数共享 binding，用 `import { env } from "cloudflare:workers"`，但注意顶层不能做 I/O——`env.KV.get` 在顶层会报错，`env.SECRET` 读值没问题。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

6. **`ctx.waitUntil()` 有什么坑？**

   两个容易踩的坑。第一个是解构丢 `this` 绑定：`const { waitUntil } = ctx` 这样写，运行时会抛 `Illegal invocation`，必须写成 `ctx.waitUntil(...)`。第二个是时间限制：响应发出或客户端断开后最多 30 秒，超时的后台任务会被砍掉。如果你有更长的后台任务要跑，别指望 `waitUntil`，改用 Queues 或 Workflows。

   来源：[Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

7. **为什么 subrequest 比我代码里的 fetch 多？**

   subrequest 就是任何 `fetch()` 调用，或对 R2、KV、D1、Queues 的任何一次调用。Free 每调用 50 个 subrequest，Paid 10,000 个（可调到 10M）。容易忽略的是重定向链——每一跳都算一个 subrequest，你以为发了一个 fetch，实际走了 5 跳就是 5 个 subrequest，不知不觉就撞上限。

   跨 Worker 调用走 Service Bindings 而不是公网 fetch，能省 subrequest。

   来源：[Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

8. **为什么 Workers Logs 里有的请求没日志？**

   单请求的 log 数据有 256 KB 上限，包括所有 `console.log`、异常、请求元数据和 headers。超了之后，该请求后续的 log 全部丢弃——不是截断，是不再记录。所以你会看到有些请求的日志像是被切了一半。

   建议开 `observability.enabled` + `logs.head_sampling_rate`（设 1 全捕，高流量调低）+ `traces.enabled` + `traces.head_sampling_rate: 0.01`。日志用 `console.log(JSON.stringify({...}))` 结构化写，才能在 Dashboard 里搜索和过滤。

   来源：[Workers limits](https://developers.cloudflare.com/workers/platform/limits/)、[Workers Observability](https://developers.cloudflare.com/workers/observability/)

9. **`passThroughOnException()` 能当错误处理用吗？**

   不能。它是 fail-open 机制——Worker 抛未捕获异常时，不返回错误，而是把请求透传到 origin。迁移期有用（旧 origin 还在，Worker 挂了至少能 fallback），但长期用会隐藏 bug、让调试变难——你以为 Worker 在处理请求，其实异常了直接透传，问题被盖住了。

   正确做法是显式 `try/catch` + 结构化错误响应，`console.error` 记日志后返回 500。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

## D1

1. **为什么查询只返回一条却烧了几百万 rows_read？**

   D1 的计费按 `rows_read` 算——这是数据库引擎扫描的行数，不是你最终拿到的行数。如果你有一张 100 万行的表，做了个没有索引的 `WHERE` 查询，数据库得从头扫到尾找匹配的行，哪怕最后只返回一条，这次查询也烧了 100 万 rows_read。免费额度每天 5M rows_read，几次全表扫描就爆了；Paid 是每月 25B + $0.001 / 百万行。

   怎么发现问题？每次查询的返回结果里有 `meta.rows_read` 字段，直接能看到这次扫描了多少行。行大小和列数都不影响计数，只看扫描行数。如果你看到单次查询经常扫几千行以上，就该加索引或改查询了。

   索引建在高频谓词列上；多列索引按"左前缀"设计查询，比如 `(customer_id, date)` 索引只查 `date` 是不命中的，必须先带 `customer_id`；冷数据可以用部分索引 `WHERE order_status != 6` 过滤掉大头。用 `EXPLAIN QUERY PLAN` 看执行计划，确认走的是 `USING INDEX <name>` 而不是全表扫描。

   来源：[D1 索引最佳实践](https://developers.cloudflare.com/d1/best-practices/use-indexes/)、[D1 计费](https://developers.cloudflare.com/d1/platform/pricing/)

2. **D1 索引机制是什么？**

   D1 底层是 SQLite 引擎，索引在写入时自动维护，不需要手动刷新。`INTEGER PRIMARY KEY` 和 `ROWID` 这类默认主键不需要额外建索引。建完索引后跑一次 `PRAGMA optimize`（内部会跑 `ANALYZE`），让查询规划器拿到统计信息，生成最优执行计划。

   索引不能直接改，只能删了重建。写索引列会让每次写入多 1 行 rows_written，但这部分开销几乎总是被 rows_read 的节省抵消——一个查询从扫 100 万行变成扫 10 行，省下来的远多于写入多出的那点。

   来源：[D1 索引最佳实践](https://developers.cloudflare.com/d1/best-practices/use-indexes/)

3. **为什么写查询失败了不重试？**

   D1 只对**只读**查询自动重试，最多 2 次。**写查询遇到瞬态错误会直接失败**，常见的瞬态错误消息有 `Network connection lost`、`storage caused object to be reset`、`reset because its code was updated`。这些不是你的代码问题，是底层存储层的临时抖动。

   写操作需要自己写重试逻辑：指数退避 + jitter，上限 5 次左右就够了。别一失败就立刻重试，那样只会加重负载。

   来源：[D1 重试查询](https://developers.cloudflare.com/d1/best-practices/retry-queries/)

4. **开了读副本为什么读到旧值？**

   开启读副本后，D1 会在各区域自动建只读副本，读请求可以就近走副本，延迟更低。但副本的复制是异步的，可能落后于 primary。如果你刚写完立刻读，直接 `env.DB.prepare()` 查可能读到旧值——用户看到的就是"我明明提交了怎么没显示"。

   **必须用 Sessions API** 来保证一致性。`env.DB.withSession("first-primary")` 强制这个 session 的第一次查询走 primary，适合需要立刻读到最新写入的场景；`withSession("first-unconstrained")` 允许第一次查询走副本，但保证 session 内的 monotonic reads——同一 session 不会读到比上一次更旧的数据；`withSession(bookmark)` 可以从上一次 session 的位置继续。

   实践做法是把 `session.getBookmark()` 写回响应头 `x-d1-bookmark`，客户端下次请求时带回，这样跨请求也能保持一致性。`meta.served_by_region` 和 `served_by_primary` 可以观测到底走了哪个副本。

   来源：[D1 读副本](https://developers.cloudflare.com/d1/best-practices/read-replication/)

5. **导入导出有什么限制？**

   `wrangler d1 execute --file` 导入单文件上限 5 GiB，更大的要拆分多次导入。虚拟表（FTS5 全文索引表）不能直接导出，需要先删掉、导出数据、再重建。JS 的 Number 只有 52 位精度，`int64` 的大数会丢精度，如果 your schema 有大整数要注意。遇到 `Statement too long` 错误，把 1000 行的 INSERT 拆成多段 250 行的。

   来源：[D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

## KV

1. **为什么 KV 写了新值，过一会儿还读到旧的？**

   KV 是最终一致的边缘存储。写入操作到你写入的那个地点通常是立刻可见的，但**其他位置可能要等 60 秒甚至更久**才能读到新值。更隐蔽的是，**负查找（key 不存在）也会被缓存**——如果你查过一个 key 发现它不存在，之后即使创建了它，同样要等 60 秒才能读到。所以把 KV 当成原子读写存储来用必然会出问题：写完立刻读、读不到再写、写完又读不到，死循环。

   如果你的场景需要写完立刻读到新值，KV 不合适，考虑用 D1 或 Durable Objects。

   来源：[How KV works](https://developers.cloudflare.com/kv/reference/how-kv-works/)

2. **为什么高频写同一个 key 被限流了？**

   KV 对同一个 key 的写入限速是 1 次 / 秒，Free 和 Paid 都一样。如果你拿 KV 当 Redis 用，做一个高频计数器或者频繁更新同一个 key 的状态，很快就会被限流。写密集场景（同一个 key 每秒写几十次）应该走 Durable Objects——它能处理单 key 的高频写入和原子读写。

   来源：[KV limits](https://developers.cloudflare.com/kv/platform/limits/)

3. **为什么 `cacheTtl` 反而让更新看不到？**

   `cacheTtl` 的最小值是 30 秒，默认 60 秒。一旦某个 key 在某个区域以某个 `cacheTtl` 被读过，它就会被缓存在那个区域直到 TTL 过期或被驱逐，**不会因为别处写了新值就主动失效**。这意味着写频繁、又要求很快看到更新的场景，`cacheTtl` 不仅帮不上忙，反而拖累——你写了新值，但读到的还是缓存的旧值，得等 TTL 过期才更新。

   来源：[How KV works](https://developers.cloudflare.com/kv/reference/how-kv-works/)

4. **为什么读 1000 个 key 撞上限了？**

   单次 Worker 调用对外部服务的操作数上限是 1000，KV 的 bulk get 最多一次拿 100 个 key，响应 size 上限 25 MB（超了返回 413）。如果你的 Worker 在一次调用里要读超过 1000 个 key，就会撞操作数上限。

   解决办法是用 bulk read——一次 bulk get 算 1 个操作而不是 100 个。另一个技巧是把相关的冷热 key 合并成一个"super key"对象，让冷 key 跟热 key 一起被缓存，减少读取次数。但更新 super key 时要注意加锁避免竞争。

   来源：[KV limits](https://developers.cloudflare.com/kv/platform/limits/)

5. **什么场景不该用 KV？**

   官方明确说"write-heavy Redis 型"工作负载不适合 KV——也就是同一个 key 每秒要写几十上百次的场景。具体来说，余额、库存、订单状态、实时计数、任何需要原子读写的场景，都不要放 KV。这些场景用 D1（关系查询、事务）或 Durable Objects（单 key 原子读写、实时状态）。

   KV 适合的是读多写少的场景：配置、用户偏好、白 / 黑名单、缓存、静态资产。这些数据写得不频繁，但读得很多，KV 的边缘缓存优势能充分发挥。

   来源：[How KV works](https://developers.cloudflare.com/kv/reference/how-kv-works/)

## R2

1. **文件元数据和权限该怎么存？**

   R2 自带 `customMetadata` 可以在对象上挂一些元数据，但它不适合结构化查询。比如"查某用户最近 10 个文件"、"按大小排序"、"按权限过滤"——这些用 R2 的 `list` 翻页是做不了的。`list` 只能按 key 前缀翻页，没法按其他字段查询或排序。

   正确的做法是文件 body 存 R2，元数据存 D1。D1 里建一张表，字段包括 R2 key、owner、created_at、size、contentType、权限等。查询走 D1（带索引、可分页排序），拿到 R2 key 后再回 R2 取 body。

   来源：[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)

2. **为什么不要从 Worker 内用 REST API 调 R2？**

   这是官方明确列出的反模式：从 Worker 内用 REST API（`api.cloudflare.com/.../r2/...`）调自家的 R2。这样做多了一跳认证（要验 Cloudflare API token）、多了一跳网络（Worker → 公网 → R2 API → R2 存储），延迟和成本都上去了。

   R2 binding 是进程内引用——Worker 和 R2 存储在同一台机器上，零网络跳、零认证、零额外延迟。用 `env.MY_BUCKET.get(key)` 就行，别绕公网。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#use-bindings-for-cloudflare-services-not-rest-apis)

3. **三种访问模式怎么选？**

   R2 有三种访问模式，适合不同场景。**Worker binding 流式透传**：适合要业务逻辑或鉴权的场景，Worker 验证权限后 `return new Response(object.body, ...)` 把 body 流式透传给客户端。**S3 API presigned URL**：适合大文件客户端直传直读，客户端拿签名后直接跟 R2 交互，省 Worker CPU 和 subrequest；要注意管理签名过期和 key 泄露风险。**public bucket**：适合纯公开静态资产，无鉴权需求，直接公开读。

   大文件走 Worker 代理会吃 Worker 的 128 MB 内存和 CPU 时间，流式透传可以缓解但不完美。如果文件很大又不需要鉴权，优先考虑 presigned URL 或 public bucket。

   来源：[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)

4. **`list()` 分页有什么坑？**

   R2 的 `put()` 和 `delete()` 是强一致的——Promise resolve 后，全球任意后续读都能看到新状态。但 `list()` 有个容易踩的坑：它返回最多 1000 条，但可能返回更少以减压。判断是否还有下一页要用返回的 `truncated` 字段，**不要用 `objects.length < limit` 判断**——如果返回了 1000 条但其实还有更多，`length === limit` 你以为没了，其实只是被截断了；如果返回了 999 条你以为被截断了，其实真的没了，死循环。

   另外两个注意点：未完成的 multipart upload 7 天后自动 abort，别指望它能一直挂着；并发对同一个 multipart upload 操作会冲突，要避免。

   来源：[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)

5. **怎么做条件读和范围读？**

   R2 的 `get()` 支持条件读：`get({ onlyIf: { etagMatches, uploadedBefore, uploadedAfter } })`。条件不满足时返回的 `R2Object` 没有 body，只有元数据，延迟更低——省了传 body 的带宽和时间。范围读用 `range: { offset, length, suffix }`，可以只读文件的一部分，比如视频拖进度条只读中间一段。校验可以指定 `md5` / `sha1` / `sha256`，但只能指定一种。

   来源：[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)

## Durable Objects

1. **为什么所有请求塞进一个 DO 就成瓶颈？**

   单个 Durable Object 的软上限大约是 1000 req/s，但这是简单透传的理想值。如果你的请求要 JSON 解析 + 校验，降到 500–750 req/s；如果还带存储写，降到 200–500 req/s。超了之后请求会排队，再超就抛 `overloaded`。如果你把所有请求都塞进 `idFromName("global")` 这一个 DO，它就是整个系统的瓶颈。

   正确的建法是按"协调原子"分片——一房一 DO、一局一 DO、一用户一 DO。分片数大约等于总 req/s 除以单个 DO 的容量。比如 5000 req/s、单 DO 500 req/s，就建 10 个分片。

   来源：[Rules of Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/)、[DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/)

2. **新 DO 该用哪种存储后端？**

   官方明确所有新的 DO class 都应该用 SQLite backend。它支持关系查询、索引、事务、PITR（时间点恢复），功能完整。KV backend 仅供 Paid 用户保留兼容，新项目不要用。

   SQLite DO 的存储上限是 10 GB（Paid）/ 5 GB（Free 全账户），超了写入会抛 `SQLITE_FULL`，但读和 delete 仍可。你需要在代码里 catch `SQLITE_FULL`，要么删旧数据腾空间，要么返回错误。大文件不要塞 DO，存 R2，DO 只存元数据。其他限制：每表 ≤ 100 列，行 / string / BLOB ≤ 2 MB，SQL 语句 ≤ 100 KB，绑定参数 ≤ 100 / 查询。

   来源：[DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/)

3. **input/output gate 和 write coalescing 是什么？**

   DO 是单线程的，但用了 async / await 后请求会交错执行，这就带来一个问题：怎么保证数据一致性？运行时用两个机制来保证。**input gate** 在同步 JS 执行时阻塞新事件进来，await storage 操作时仍然保护，但 await `fetch()` 或 R2 写的时候会打开 gate 让其他请求交错——因为这时候在等外部 I/O，没必要阻塞别人。**output gate** 把出网消息 hold 住，直到在飞的 storage 写完成——这样客户端不会看到"还没落库"的确认响应。

   **write coalescing** 是另一个重要机制：多个没有 `await` 间隔的 storage 写会自动合并成一个原子隐式事务。反模式是用 KV API `await storage.put()` 串行写——每个 `await` 都打断 coalescing，中途失败了前面已提交、后面没写，数据不一致。原子多写要用同步的 `sql.exec()` 连续写（自动合并），跨 async 的原子读改写用 `transaction()`。

   来源：[Rules of Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/)

4. **为什么 `blockConcurrencyWhile()` 拖慢吞吐？**

   `blockConcurrencyWhile()` 会阻塞所有并发请求直到回调完成。每次调用大约 5ms 开销，如果你的 DO 每个请求都调它，单 DO 就被限到约 200 req/s。更严重的是在回调里跨 I/O（fetch、KV、R2、外部 API）——等于持着锁等网络，严重拖吞吐。

   它只适合用于构造函数初始化或 migration 这种一次性的事。常规请求靠 input/output gate + write coalescing 保证正确性，跨 async 的原子读改写用 `transaction()`。

   来源：[Rules of Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/)

5. **确定性 Id 和 `newUniqueId` 怎么选？**

   两种 DO ID 适合不同场景。`getByName(str)` 用字符串生成确定性 ID——同样的输入永远得到同样的 ID，适合"某房间 / 某用户"这种路由：你不需要存映射，算一下就找到。`newUniqueId()` 生成随机 ID，但你**必须自己存映射**（比如存 D1），否则再也找不到这个 DO。

   另外一个容易误解的点：创建 stub（`env.NAMESPACE.get(id)`）不会实例化或唤醒 DO——它只是拿到一个引用。只有调用 stub 上的方法才会激活 DO。

   来源：[DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/)

6. **WebSocket 长连接怎么省费？**

   用标准 `ws.accept()` 接受 WebSocket 连接，DO 会一直占着内存计费，哪怕连接空闲也在烧 duration（GB-s）。对于长连接场景这是很大的开销。`this.ctx.acceptWebSocket(ws)` 启用 Hibernation 模式——DO 空闲时可以被驱逐出内存，WebSocket 连接保持打开，来消息时自动唤醒 DO 重跑构造函数。hibernation 期间不计 duration 费。

   官方给了一个计费示例：100 个 DO × 每个 50 个 WS × 每分钟 1 条消息 × 每天 8 小时 × 30 天。标准 API 大约 $138/月，Hibernation 大约 $10/月。差距巨大。

   注意几个点：构造函数要尽量轻，因为唤醒会重跑构造函数；每连接的状态用 `ws.serializeAttachment` 存（上限 16 KB，更大的数据用 SQLite 存 key，attachment 里只存 key）；`setWebSocketAutoResponse` 可以让 ping/pong 不唤醒 DO。**出站 WebSocket 不支持 hibernation**，活跃的出站连接会让 DO 最多占内存 15 分钟。

   另外文字协作和音视频不是一回事——普通 WebSocket 只能传消息，做不了音视频会议、连麦、NAT 穿透和 SFU，那些要看 [Realtime](https://developers.cloudflare.com/realtime/)。

   来源：[DO WebSocket best practices](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)、[DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

7. **为什么大量小消息压垮 DO？**

   每条 WebSocket 消息都有 JS 运行时和系统之间的 context switch 开销。即使总数据量很小，大量小消息也会压垮单个 DO——CPU 全花在 context switch 上了，没时间处理业务逻辑。

   解决办法是客户端攒批：把 10–100 条逻辑消息打包进一个 WebSocket frame 发送。高频数据按 50–100ms 或 50–100 条攒批，具体看你的延迟要求。

   来源：[DO WebSocket best practices](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)

8. **为什么 alarm handler 要写幂等？**

   每个 DO 可以用 `setAlarm(timestamp)` 安排未来任务（毫秒精度），`alarm()` handler 在没有入站请求的时候也能跑——适合定时清理、续期、聚合等。但 **alarm 偶发会触发多次**，所以 handler 必须幂等——执行一次和执行多次效果一样。

   handler 抛异常会自动重试，重试快用完还没成功就彻底失败。建议在 handler 里 catch 异常，如果 `alarmInfo.retryCount >= 5` 就 `setAlarm(Date.now() + 30_000)` 自己续命；handler 开头 check 一下状态（比如 `lastRenewal` 时间），避免重复执行。**只在有活干时才调度 alarm**——短间隔（秒级）唤醒大量 DO 会很贵。

   来源：[DO error handling](https://developers.cloudflare.com/durable-objects/best-practices/error-handling/)

9. **DO stub 抛异常还能继续用吗？**

   不能。DO 异常分几种：带 `.retryable` 的是瞬态内部错误，幂等请求可以重试；带 `.overloaded` 的是 DO 过载，**不应该重试**，重试只会更过载；`.remote = true` 表示异常来自远端 DO 代码或基础设施。

   关键点是：**异常后 stub 会进入"broken"状态，再用同一个 stub 必失败**。所以每次尝试都要新建 stub。retryable 的异常用指数退避 + jitter 重试；overloaded 的异常别重试，应该减载或增加 sharding。

   来源：[DO error handling](https://developers.cloudflare.com/durable-objects/best-practices/error-handling/)

10. **删 DO 为什么不能只删 key？**

    DO 完全消失的判定是关闭时存储为空。一旦你写过任何 storage（包括设过 alarm），单纯删 key 或 drop table 是不够的——内部元数据会残留，继续计存储费。必须显式调 `storage.deleteAll()`。如果 compat date < `2026-02-24`，还要先 `deleteAlarm()` 再 `deleteAll()`。

    来源：[DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/)

11. **RPC 调用怎么计费？**

    compat date ≥ `2024-04-03` 的项目应该用 RPC 而不是 `fetch()` handler——类型安全、免手动解析 request / response。计费上，每个 RPC method call 是一个独立的 RPC session，算 1 次计费请求；但方法返回的 `RpcTarget` stub 上的后续调用算同一个 session，不再计费。所以如果你要在 DO 上做多步操作，拿一次 stub 再连续调多个方法，比每次重新调更省。

    用 `DurableObjectNamespace<ChatRoom>` 类型参数让 stub 带类型。不要把 DO stub 缓存在全局变量——异常后 stub 会 broken，缓存的旧 stub 用不了。

    来源：[DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

## Queues

1. **为什么 10 条消息第 8 条失败，前 7 条也被重复处理？**

   Queues 是至少一次投递（at-least-once），不是恰好一次。默认行为是**整个 batch 一起 ack**：`queue()` 返回并且所有 `waitUntil` 都 resolve 后，整个 batch 才算处理完。**只要 `queue()` 抛异常或任一 `waitUntil` reject，整个 batch 全部重投**。所以 10 条消息里第 8 条失败了，1–7 条也会被重新投递，即使它们已经成功处理过了。

   这就是为什么 Queues 的 consumer 必须幂等——你得预期同一条消息可能被处理多次。

   来源：[Queues batching & retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)

2. **非幂等操作怎么避免重复执行？**

   如果你调外部 API、写 DB 这类不能重复的操作，不能依赖默认的全批 ack。需要**逐条 `msg.ack()`**——已经 ack 的消息不会被重投；失败的单条用 `msg.retry({ delaySeconds })` 重试。

   注意 `ack()` 的优先级最高：先 ack 后 retry，retry 生效；先 retry 后 ack，ack 会被忽略。所以顺序是：成功的先 ack，失败的最后 retry。

   来源：[Queues batching & retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)

3. **怎么对上游 429 做退避？**

   每条消息带 `attempts` 属性（从 1 开始递增），`delaySeconds` 范围 0–86400（最多一天）。遇到上游 429 用 `retry({ delaySeconds: base ** attempts })` 做指数退避——第一次重试等 2 秒，第二次 4 秒，第三次 8 秒。可以对单条 `msg.retry({ delaySeconds })` 或整批 `batch.retryAll({ delaySeconds })`，per-message 的延迟优先于 queue 级配置。

   来源：[Queues batching & retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)

4. **DLQ 和 `max_retries` 怎么配？**

   重试次数达 `max_retries`（默认 3，最大 100）后，默认直接删除消息。如果你配了 Dead Letter Queue（DLQ），消息会写入 DLQ 而不是删除——方便事后排查。`retry()` 和 `retryAll()` 不会触发 consumer concurrency 缩容。非幂等或关键业务必配 DLQ 并监控长度。

   来源：[Queues batching & retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)

5. **批处理大小怎么设？**

   `max_batch_size` 默认 10（范围 1–100），`max_batch_timeout` 默认 5 秒（范围 0–60 秒），先到的条件先触发——要么攒够 10 条，要么等够 5 秒。空队列不会推空 batch（push 消费者），但 pull 消费者主动 pull 空队列会产生读操作计费。

   写外部系统用大 batch 省调用数——比如批量写 DB 一次 100 条比一次 10 条省 10 倍调用。用户面活动相关的用小 batch + 短 timeout，让消息尽快处理不要攒着。

   来源：[Queues batching & retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)

6. **handler 返回后还有活怎么办？**

   handler 返回后，未 resolve 的 promise 可能不会完成。`ctx.waitUntil()` 是唯一支持"handler 完成后再收尾"的机制——比如发个通知、写个日志，不阻塞响应。但注意时间限制：响应发出后最多 30 秒。

   来源：[Queues batching & retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)

7. **Queues 的关键限制是多少？**

   每队列吞吐 5000 msg/s（超了返回 `Too Many Requests`）；消息大小 128 KB（含约 100B 内部元数据，实际可用约 127 KB）；消息保留 Free 24h、Paid 可配最长 14 天；每队列 backlog 25 GB（超了返回 `Storage Limit Exceeded`）；并发 consumer 调用 250（push-based only）；consumer wall time 15 分钟、CPU 默认 30s 可调到 5 分钟。

   来源：[Queues limits](https://developers.cloudflare.com/queues/platform/limits/)

8. **Queues 和 Workflows 怎么选？**

   Queues 是消息 broker，producer 和 consumer 解耦，适合 fan-out（一条消息触发多个处理）、缓冲（削峰填谷）、批处理、单步后台任务（发邮件、发 webhook、写日志）。Workflows 是多步有依赖的 durable execution，每步返回值持久化，单步失败只重试该步，适合多步流程（扣款→发货→确认）、需要暂停恢复的场景（`step.waitForEvent()` 等数小时、数天甚至人工审批）。

   两者可以组合：Queue 做缓冲入口，consumer 为每条消息起一个 Workflow 实例做复杂处理。

   来源：[Queues limits](https://developers.cloudflare.com/queues/platform/limits/)、[Workflows](https://developers.cloudflare.com/workflows/)

## Service Bindings 与 RPC

1. **Worker 调 Worker 为什么不要走公网 fetch？**

   从 Worker 内 fetch 同 zone Worker 的公网 URL，如果不带 service binding 会直接失败。即使带了，走公网 fetch 自家 Worker 也意味着：多余的认证、多余的网络跳、多余的 subrequest 消耗，还没有类型安全。

   Service Binding 是零成本的 Worker 间调用方式，绕过公网，支持类型安全 RPC。被调 Worker 写 `export class Foo extends WorkerEntrypoint { async bar() {...} }`，调用方 `env.FOO.bar()` 直接调，带类型提示。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

2. **Edge + Placed 模式怎么搭？**

   一个常见的架构是 `auth-worker`（不开 placement，跑在边缘做鉴权，离用户近）→ Service Binding RPC → `app-worker`（开 Smart Placement，跑在 DB 附近）。这样鉴权快（边缘处理），业务逻辑也快（在 DB 附近跑，多次 round-trip 都低延迟）。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

3. **`WorkerEntrypoint` 的 `env` 怎么用？**

   在类 entrypoint 上，`this.env.NAME` 可以访问 binding。也可以 `import { env } from "cloudflare:workers"` 在顶层访问，但**顶层不能做 I/O**——`env.KV.get` 在顶层会报错，`env.SECRET` 读值没问题。测试时可以用 `withEnv({NAME:"Bob"}, () => ...)` 临时覆盖 binding。

   来源：[Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)

## Hyperdrive

1. **连外部 PG / MySQL 为什么必用 Hyperdrive？**

   Worker 连外部数据库，每次请求都要建 TCP 连接 + TLS 握手 + 认证，这个开销 300–500ms 起步。如果你的 Worker 在边缘跑，数据库在某个云的某个区域，每次请求都跨越大半个地球建连接，延迟极高。

   Hyperdrive 在 DB 附近维护区域连接池，Worker 拿到的 `connectionString` 是 Hyperdrive 的本地入口，连接复用，省掉每次建连接的开销。它还能缓存查询结果，重复查询直接返回。需要 `nodejs_compat` flag。

   **每请求 `new Client({ connectionString: env.HYPERDRIVE.connectionString })`**——别被"new Client"吓到，Hyperdrive 管底层连接池，client 创建很便宜。不要把 client 缓存到全局变量，binding 改动后 isolate 复用会拿到旧连接。

   来源：[Hyperdrive](https://developers.cloudflare.com/hyperdrive/)

## Smart Placement

1. **Smart Placement 影响哪些 handler？**

   Smart Placement 自动分析流量，把 fetch handler 跑在离 upstream（你 fetch 的后端）最近的 DC。但**它只影响 fetch handler**，不影响 RPC methods 和 named entrypoints；没有 fetch handler 的 Worker 会被忽略；Static assets 永远从离用户最近的 DC 发，不受 placement 影响。

   部署后**最多 15 分钟**才有决策，因为它需要"多个位置来的稳定流量"才能判断最优位置。流量太小会返回 `INSUFFICIENT_INVOCATIONS`。所有请求带 `cf-placement` 头（如 `remote-LHR` / `local-EWR`），可以验证实际跑在哪。

   来源：[Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/)

2. **Placement Hints 怎么用？**

   如果你知道后端在哪，直接指定 Placement Hints 比 Smart 更可控。`placement.region = "aws:us-east-1"` / `"gcp:us-east4"` / `"azure:westeurope"`——Cloudflare 映射到离该云区域最近的 DC。`placement.host = "db.example.com:5432"` 用 TCP CONNECT 探测（layer 4，实验性）。`placement.hostname = "api.example.com"` 用 HTTP HEAD 探测（layer 7）。Smart / region / host / hostname **互斥**，只选一个。

   单后端用 region hint 可以把 RTT 从 20–30ms 降到 1–3ms。多后端或不知位置就用 Smart。

   来源：[Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/)

3. **DO 自动 placement 怎么优化？**

   DO 查内嵌 SQLite 是零延迟的——compute 和 data 在同进程。所以**尽量在 DO 内一次做完所有查询，返回 composite result**，不要让 Worker 多次 round-trip 调 DO。DO 创建位置默认是首请求附近，可以用 `get(id, { locationHint: "wnam" })` 给提示（建议非保证）。

   来源：[Smart Placement](https://developers.cloudflare.com/workers/configuration/smart-placement/)

## Node.js 兼容

1. **怎么启用 `nodejs_compat`？**

   在 `wrangler.jsonc`（或 `wrangler.toml`）加 `compatibility_flags: ["nodejs_compat"]`，且 `compatibility_date ≥ 2024-09-23`（v2）。Wrangler 会自动用 `unenv` 给不支持的 Node 模块打 polyfill——这些 polyfill 是 mock 方法，调用时会抛 `[unenv] <method> is not implemented yet!`。如果你只需要 `AsyncLocalStorage`，可以单独用 `nodejs_als` flag，不用开完整的 `nodejs_compat`。

   来源：[Node.js 兼容](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

2. **哪些 Node 模块支持、哪些不支持？**

   完全支持：`assert`、`buffer`、`crypto`、`stream`、`path`、`url`、`util`、`zlib`、`fs`、`events`、`net`、`http`、`https`、`dns`、`querystring`、`string-decoder`、`timers`、`AsyncLocalStorage` 等。部分或非功能 stub：`async_hooks`、`child_process`、`cluster`、`http2`、`inspector`、`module`、`os`、`readline`、`repl`、`tls`（部分）、`vm`。不支持：`node:sqlite`、test runner。

   运行时抛 `[unenv] xxx is not implemented yet!` 就知道踩到 stub 了，用 Workers 版本的替代（比如 `node:crypto` 用 Web Crypto）。

   来源：[Node.js 兼容](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

3. **为什么 Vitest 测试通过，部署后真机炸了？**

   `@cloudflare/vitest-pool-workers` 跑测试时**自动注入 `nodejs_compat`**——所以测试可能通过，但生产 `wrangler.jsonc` 忘了加 flag，部署后在真机上炸。确认生产配置带 flag，别只信测试通过。

   来源：[Node.js 兼容](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

## 配置与工具

1. **新项目该用 Workers Static Assets 还是 Pages？**

   新项目用 Workers Static Assets。Pages 继续工作但新功能集中在 Workers。纯静态站：`assets.directory` 指向 build 输出，不需要 Worker 脚本。全栈：加 `main` 指向 Worker 入口 + `ASSETS` binding，Worker 处理 API，静态资源走 assets。限制：Free 20K 文件 / Paid 100K 文件 / 单文件 25 MiB / `_headers` 规则 100 / `_redirects` 静态 2000 + 动态 100。

   来源：[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)

2. **为什么要用 `wrangler types`？**

   手写 `Env` interface 会和实际 binding 漂移——你改了 wrangler 配置加了个 binding，但忘了更新 `Env`，TypeScript 编译通过，部署时才发现不匹配。`npx wrangler types` 自动生成匹配当前 wrangler 配置的类型文件。加或改 binding 后重跑一次。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

3. **`compatibility_date` 要怎么维护？**

   `compatibility_date` 控制可用运行时功能和 bug fix。新项目设今天的日期；存量项目定期更新，拿到新 API 和修复。更新后跑一下测试确认没破坏。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

4. **Custom Domain 和 Routes 有什么区别？**

   Custom Domain = Worker 就是 origin，Cloudflare 自动建 DNS 记录 + SSL 证书，最省心。Routes = Worker 在已有 origin 前面跑，**必须先有 proxied（橙云）DNS 记录**，否则 `ERR_NAME_NOT_RESOLVED`。如果你没有真 origin，加一条 proxied `AAAA` 指向 `100::` 占位。限制：Routes 1000 / zone、Custom Domains 100 / zone；`wrangler dev --remote` 时降到 50 / zone。

   来源：[Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

5. **为什么 Wrangler environments 的 binding 没继承？**

   `env.production` / `env.staging` 部署成 `name-production` / `name-staging`。**binding 和 vars 每 env 单独声明，不继承**——你不能在 root 里声明 binding 然后指望 production 自动有。root Worker（不带 env 后缀）是独立部署，不打算用就别 `wrangler deploy` 不带 `--env`。

   来源：[Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/)

6. **Secret 该怎么放？**

   secret 永远不进 wrangler 配置或源码。`vars` 适合非敏感配置（可进版本控制）。`wrangler secret put API_KEY` 交互输入或 pipe。本地用 `.env`（加 `.gitignore`）。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

## 安全

1. **为什么不能用 `Math.random()` 生成 token？**

   `Math.random()` 不是密码学安全的——它的输出可以被预测。生成 token、ID、session key 用 `crypto.randomUUID()` 或 `crypto.getRandomValues()`。`node:crypto` 在 `nodejs_compat` 下也完全支持。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#use-web-crypto-for-secure-token-generation)

2. **怎么防时序侧信道？**

   比较 secret 不要直接 `===`——字符串比较是短路 的，第一个不同的字符就返回 false，攻击者可以通过测量响应时间逐字符猜出 secret。用 `crypto.subtle.timingSafeEqual(a, b)` 做恒定时间比较。更稳的做法是先 SHA-256 hash 到定长，再比较两个 hash，避免长度泄露。

   来源：[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#use-web-crypto-for-secure-token-generation)

---
