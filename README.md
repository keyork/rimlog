# RimLog · 外沿记录层

一个以外星记录体视角观察地表日常的 Next.js 项目。

首页先展示散布的标题卡片，点击后在独立视窗中展开正文。整体视觉是星空、频栅、噪声和冷色辉光。

## 当前版本

- 首屏只显示标题卡片，正文通过弹窗展开
- 卡片采用无圆角、离轴散布的信号板布局
- 全站文案统一为外星记录语境
- 支持 6 个时间尺度切换
- 未配置后端时自动回退到本地静态数据
- 可选接入 Supabase 和 AI 生成链路

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 框架 | Next.js 14（App Router） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 动画 | Framer Motion |
| 数据 | 本地静态数据 / Supabase |
| AI | QWEN（OpenAI 兼容接口） |
| 内容源 | RSS + 预置主题 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

`.env.local` 示例：

```env
# Supabase（可选，不配则使用静态数据）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# QWEN / OpenAI-compatible AI API（可选）
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_API_KEY=
QWEN_MODEL=qwen-plus

# Cron 端点密钥（可选）
CRON_SECRET=
```

### 3. 启动开发环境

```bash
npm run dev
```

打开 `http://localhost:3000`。

### 4. 生产构建

```bash
npm run build
npm start
```

## 数据模式

### 静态模式

不配置 Supabase 时，页面直接读取 [`src/lib/data.ts`](./src/lib/data.ts) 中的预置日志。

### Supabase 模式

配置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 后：

- `/api/logs` 从 `log_entries` 读取对应时间尺度的数据
- `/api/logs/today` 返回当天 `1d` 数据
- 页面优先显示 Supabase 数据，取不到时才回退到本地静态内容

初始化数据库可执行 [`schema.sql`](./src/lib/supabase/schema.sql)，批量导入预置数据可参考 [`seed.ts`](./src/lib/supabase/seed.ts)。

## AI 生成能力

项目保留两条可选生成链路，默认都不自动运行：

- `POST /api/cron/generate-commentary`
  从 RSS 抓取新闻，生成外星视角时评
- `POST /api/cron/generate-daily`
  从预置主题池随机生成日常观察条目

两条接口都依赖：

- `QWEN_API_KEY`
- 可选的 `CRON_SECRET`
- 如需持久化，还需要 Supabase

如果未配置 Supabase，接口仍可返回本次生成结果，但不会入库。

## 公开接口

### `GET /api/logs?scale=<timescale>&limit=<n>&before=<iso-date>`

按时间尺度读取日志列表。

可用 `scale`：

- `1d`
- `100d`
- `1y`
- `10y`
- `100y`
- `1000y`

### `GET /api/logs/today`

返回当前“单日切片”数据。

### `GET /api/cron/generate-commentary`

返回 AI 和 Supabase 配置状态，用于健康检查。

### `GET /api/cron/generate-daily`

返回日常生成接口状态，用于健康检查。

## 项目结构

```text
src/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── logs/
│       │   ├── route.ts
│       │   └── today/route.ts
│       └── cron/
│           ├── generate-commentary/route.ts
│           └── generate-daily/route.ts
├── components/
│   ├── LogEntryCard.tsx
│   ├── ObserverHeader.tsx
│   ├── ObserverFooter.tsx
│   ├── TimeScaleTabBar.tsx
│   ├── StarField.tsx
│   └── ScanLines.tsx
└── lib/
    ├── data.ts
    ├── copy.ts
    ├── types.ts
    ├── ai/
    ├── news/
    └── supabase/
```

## 文案与显示约束

- UI 当前只展示标题和正文主段
- 显示层会统一改写过于人类社会化的措辞
- 显示层会清理“不是……而是……”这类句式
- 页面视觉默认保持无圆角、冷色、星空和科技感

## 脚本

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## License

Private
