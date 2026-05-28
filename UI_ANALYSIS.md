# ProTrack（营盘 OS）前端 UI 分析报告

> 分析时间：2026-05-27 | 基于当前代码库 v1.0

---

## 一、先给结论：整体评价

**分数：7/10** — 对一个小团队自用的项目管理系统，视觉一致性做得不错，属于「功能型实用主义」风格。蓝紫渐变品牌色贯穿整个应用，毛玻璃卡片、统一的圆角体系、hover 微交互都有，没有明显的设计灾难。

但**目前是"能用"而非"好用"**，有些地方像 2018 年的后台管理系统，缺了点现代 SaaS 应用该有的精致感。

---

## 二、优点（别全否定，这些做得不错）

| 方面 | 具体表现 |
|------|---------|
| **视觉一致性** | 卡片、按钮、输入框、表格风格统一，不会有"这个页面换了个人写的"的感觉 |
| **品牌色运用** | 蓝→紫渐变从 logo 到按钮到激活态贯穿始终，记忆点清晰 |
| **毛玻璃层次** | `bg-white/80 backdrop-blur-sm` + 半透明边框给了纵深但不油腻 |
| **hover 微交互** | 卡片上浮、按钮阴影、查看箭头位移这些小细节让静态页面有生气 |
| **侧栏设计** | 二级菜单展开/收起、激活态渐变、子菜单位置指示器，逻辑清晰 |
| **状态颜色约定** | 潜在=灰 报价中=黄 已签约=蓝 进行中=绿 已完成=深绿 已取消=红，语义一致 |
| **代码组织** | Zustand slice 模块化、API 层分离、Zustand store 拆分合理 |

---

## 三、需要改的问题（按优先级排）

### 🔴 P0 — 无设计令牌系统（Tailwind Config 裸奔）

**现状：**
```js
// tailwind.config.js
extend: {}  // 空的！
```

所有颜色都是 `blue-500`、`indigo-500`、`emerald-500` 这种 Tailwind 默认色值到处硬编码。一旦想换主色调，得改几百个文件。

**建议：**
```js
// tailwind.config.js
extend: {
  colors: {
    brand: {
      50: '#eff6ff',   // 对应 blue-50
      400: '#60a5fa',  // 对应 blue-400
      500: '#3b82f6',  // 对应 blue-500
      600: '#2563eb',  // 对应 blue-600
    },
    accent: {
      500: '#6366f1',  // 对应 indigo-500
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    },
    surface: {
      card: 'rgba(255,255,255,0.8)',
      hover: '#f8fafc',
    }
  },
  fontSize: {
    'stat': ['1.75rem', { lineHeight: '2rem', fontWeight: '700' }],
    'card-title': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }],
  },
  borderRadius: {
    'card': '1rem',
    'button': '0.75rem',
    'input': '0.75rem',
  },
  boxShadow: {
    'card': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
    'card-hover': '0 10px 25px rgba(0,0,0,0.08)',
  },
}
```

然后在组件中 `bg-brand-500` 替代 `bg-blue-500`。换主题时只需改一处。

---

### 🔴 P0 — Dashboard 折线图缺失：缺少时间趋势

**现状：** Dashboard 有三个图表：项目饼图、合同饼图、款项柱状图。都是静态快照，看不出走势。

**建议：** 加一个「月度收入趋势」折线图（或者至少一个近 N 月走势图），数据从后端统计接口拿。可以用 Recharts `<LineChart>` 实现，成本很低。

```tsx
// Dashboard 新增区域
<MonthlyTrendChart data={stats.monthlyRevenue} />
```

---

### 🟡 P1 — 排版缺乏层次

**现状：** 全站一个字体栈 `-apple-system, BlinkMacSystemFont...`，标题用 `text-2xl font-bold`，正文用 `text-sm`。没有展示字体和数据字体的区分。

**建议：**
1. **数据大数字用 Tabular Nums**：统计卡片金额数字用 `font-variant-numeric: tabular-nums` 或引入等宽数字字体，防止金额跳变
2. **数字格式化：不要每次都手写 `toFixed(1).replace(/\.0$/, '')`**，抽一个 `formatCurrency()` 工具函数放在 `src/utils/format.ts`
3. **可选：引入一个中文字体**（如果用户群是中文为主的团队）。比如华为鸿蒙 Sans 或者阿里巴巴普惠体，免费的，对中文显示优化好——但这是锦上添花，不强制

---

### 🟡 P1 — 空状态/加载状态体验弱

**现状：**
- **加载态**：只有一个 `<div className="animate-spin ...">` 的旋转圆圈，全站统一
- **空状态**：只显示文字 `暂无项目数据`，没有任何插图或引导操作
- **错误态**：大部分 `.catch()` 只打 `console.error`，用户看不到错误

**建议：**

**骨架屏（Skeleton Screen）：**
```tsx
// src/components/common/Skeleton.tsx
export const CardSkeleton = () => (
  <div className="animate-pulse bg-white/80 rounded-2xl p-4 space-y-3">
    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
    <div className="h-7 w-20 bg-gray-200 rounded" />
    <div className="h-4 w-14 bg-gray-100 rounded" />
  </div>
);
```

Dashboard 加载时显示 7 个卡片骨架 + 表格骨架，比一个旋转圆圈体验好得多。

**空状态组件优化：**
```tsx
// 当前
<div className="text-center py-8 text-gray-400 text-sm">暂无项目数据</div>

// 建议
<div className="flex flex-col items-center justify-center py-12">
  <FolderKanban className="w-12 h-12 text-gray-300 mb-3" />
  <p className="text-gray-500 font-medium">暂无项目数据</p>
  <Link to="/projects" className="mt-3 text-sm text-blue-600 hover:text-blue-700">
    创建第一个项目 →
  </Link>
</div>
```

**Toast 错误提示：** 现在 API 失败都是静默吞掉的。加一个全局 toast（比如用 `react-hot-toast`），失败了至少说一声。

---

### 🟡 P1 — 颜色可访问性

**现状：** 大量使用 `bg-gradient-to-r from-blue-500 to-indigo-500 text-white`——蓝底白字对比度勉强过关。但 `text-gray-400` 这种低对比度文字很多（日历、辅助信息、占位符）。WCAG AA 要求文字对比度 ≥ 4.5:1，`#9CA3AF` 在白色背景上只有 2.9:1。

**建议：**
- 辅助文字从 `text-gray-400` → `text-gray-500`（对比度 4.6:1，通过 AA）
- 图表中的 `tick={{ fill: '#94A3B8' }}` → `fill: '#64748B'`

---

### 🟢 P2 — 响应式设计：移动端约等于不可用

**现状：**
- 侧栏 `fixed left-0 w-72`，手机屏幕只有 390px，侧栏就占了 288px
- 统计卡片 `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`，在手机上勉强 OK
- 没有移动端导航：没有 hamburger menu、没有 bottom tab bar

**建议：** 如果项目只面向桌面端使用（大概率是这样），那 P2 优先级就可以降。但如果未来需要在 iPad 或手机上查看：

1. 小屏时侧栏自动收起（`sidebarCollapsed = true` for `md:` 以下）
2. 顶栏左侧加一个 hamburger 按钮切换侧栏
3. 表格大屏下横向滚动（`overflow-x-auto`）——现在某些页面好像已经做了，需确认

---

### 🟢 P2 — 代码层面可维护性问题

| 问题 | 影响 | 建议 |
|------|------|------|
| `ContractsPage.tsx` / `PaymentsPage.tsx` 旧版页面未删除 | 混淆新人 | 确认无引用后删除 |
| `Home.tsx` 返回空 div | 无用代码 | 删除 |
| Recharts 颜色硬编码 hex 在多个文件 | 改主题时漏改 | 统一到 `src/constants/chartColors.ts` |
| 卡片 JSX 在 Dashboard 里重复了两次（普通/双指标） | 100 行重复 | 抽成 `<StatCard>` 组件 |
| `formatAmount` 在多个文件各自定义 | 不统一 | 抽到 `src/utils/format.ts` |

---

### 🟢 P2 — 图表细节可打磨

**PaymentBarChart 建议：**
1. Tooltip 加 hover 提示（目前没有 tooltip，鼠标悬停看不见具体数字）
2. Y 轴标签目前是 `¥X.X万`，如果金额小于 1 万显示 `¥3,000` 更好
3. Bar 之间可以加 gap 让四根柱子区分更明显

**饼图建议：**
1. 图例文字在饼图中如果全为 0，显示一个空状态环形
2. 标签可以考虑显示百分比 `30%` 而不只是图例

---

### 🟢 P2 — 页面切换无过渡动画

页面之间跳转现在是一闪一换，没有过渡。如果觉得不必要就无视这条；如果想更精致：

```tsx
// 给 Outlet 加个动画
import { motion, AnimatePresence } from 'framer-motion';
// 但这要引入 framer-motion，对于一个内部系统可能过重
```

---

## 四、设计规范建议（如果你想做）

### 4.1 颜色语义文档

现在项目状态色散落在 Dashboard、ProjectDetailPage、ProjectsPage 等几个地方。建议抽一个：

```ts
// src/constants/theme.ts
export const STATUS = {
  potential:  { label: '潜在客户', bg: 'bg-gray-100', text: 'text-gray-700' },
  quoting:    { label: '报价中',   bg: 'bg-amber-50', text: 'text-amber-700' },
  contracted: { label: '已签约',   bg: 'bg-blue-50',  text: 'text-blue-700' },
  // ...
} as const;
```

### 4.2 间距系统

现在全站用 `gap-4`、`gap-5`、`gap-6`、`space-y-6` 混用，没有约定哪个模块用多大间距。建议：
- 页面级 `space-y-6`
- 卡片间 `gap-4`
- 卡片内 `gap-3`
- 内容间 `gap-2.5`

### 4.3 文件组织

```
src/
  constants/
    theme.ts        ← 颜色/状态/图表颜色
    routes.ts       ← 路由常量
  utils/
    format.ts       ← formatCurrency / formatDate / formatFileSize
  components/
    ui/             ← StatCard, Skeleton, EmptyState, Toast
    charts/         ← 现有图表
    layout/         ← 现有 Layout
    common/         ← Pagination 等
```

---

## 五、如果要挑一个最先改的

**做 Tailwind Design Tokens + 抽 Card 组件。**这是回报最高的事：

1. `tailwind.config.js` 加 `colors.brand` 和 `fontSize.stat`
2. Dashboard 里两个重复的卡片 JSX（单指标 + 双指标）抽成 `<StatCard>` 组件
3. `formatCurrency` 抽成工具函数

**预计工作量：** 如果我用 plan mode 来做，大概 15-20 分钟。你想做哪些？
