# 代码审计报告 — 知卡研习 v1.2.0

> 审计日期：2026-05-22  
> 审计范围：`src/` 全部 114 个 TS/TSX 文件 + `public/` 全部 26 个 JSON 文件  
> 严重程度：P0 = 运行时出错/数据错误 | P1 = 功能缺陷 | P2 = 代码质量 | P3 = 建议优化
> 
> **修复状态（2026-05-22）**：P0 全部修复（5/5）✅ | P1 全部修复（3/3）✅ | P2 核心修复 ✅ | P3 部分处理

---

## P0 — 严重（运行时错误/数据不一致）

### 1. 重复且不一致的类型定义

**文件**：`types/index.ts` vs `types/study.types.ts`

两个文件定义了同一组接口（`KnowledgeCard`、`FusionCard`、`ScoreResult`、`DiscussionMessage`、`DiscussionRecord`、`OutputRecord`、`StudySession`），但 `types/index.ts` 是**过期版本**，缺少多个字段：

| 接口 | `types/index.ts` (旧) | `types/study.types.ts` (新) |
|---|---|---|
| KnowledgeCard | 无 `tags?` | 有 `tags?: string[]` |
| FusionCard | 无 `tags?`、`levelContent?`、`levelRecords?` | 有这些字段 |
| StudySession | 无 `entryMode` | 有 `entryMode: 'focused' \| 'full'` |
| StudySession.currentStep | `number` | `StudyStep` (enum) |

**风险**：如果任何文件从 `types/index.ts` import 而非 `types/study.types.ts`，类型检查与实际运行时结构不一致。

**建议**：删除 `types/index.ts` 中的重复定义，统一从 `types/study.types.ts` re-export。

---

### 2. `Material` 类型冲突

**文件**：`types/index.ts` vs `types/material.types.ts`

```typescript
// types/index.ts (旧)
interface Material { category: string; difficulty: string; }

// types/material.types.ts (新)
interface Material { category: MaterialCategory; difficulty: DifficultyLevel; }
```

两个定义完全不兼容。`materialStore.ts` 使用 `types/material.types.ts` 的定义，但如果某处从 `types/index.ts` import，会得到错误的类型。

**建议**：删除 `types/index.ts` 中的 `Material` 定义。

---

### 3. 领域术语 manifest `totalTerms` 错误

**文件**：`public/domain-terms/manifest.json`

```json
"totalTerms": 15   // ❌ 错误
```

实际数据：
- `ai-basics.json`: 10 个术语
- `economics.json`: 8 个术语
- `psychology.json`: 7 个术语
- 合计：**25 个术语**

**影响**：任何读取 `totalTerms` 的逻辑都会得到错误值。

**建议**：修正为 `"totalTerms": 25`。

---

### 4. 思维模型 JSON 引用了不存在的元概念

**文件**：`public/mental-models/compounding.json`

```json
"metaConceptMapping": ["积累", "时间", "增长", "反馈", "耐心", "复利", "杠杆", "代价"]
```

- `"耐心"` — **不在** `meta-concepts/manifest.json` 中
- `"复利"` — **不在** `meta-concepts/manifest.json` 中

**影响**：MentalModelsPage 中点击这些标签会导航到元概念页面，但无法定位到对应概念。用户体验断裂。

**建议**：全面审查 12 个思维模型 JSON 中 `metaConceptMapping` 字段的所有引用，确保每个概念名在 manifest 中存在。

---

### 5. 拆书页面 `abortRef` 从未赋值——停止按钮无效

**文件**：`src/features/meta/BookDeconstructorPage.tsx`（第 85 行）

```typescript
const abortRef = useRef<AbortController | null>(null)
// ...
const handleStop = useCallback(() => {
  abortRef.current?.abort()  // ❌ abortRef.current 永远是 null
  setLoading(false)
}, [])
```

`abortRef.current` 在整个生命周期中从未被赋值。原因：`deconstructBook()` → `sendChatRequest()` 接口不支持 `AbortSignal`。

**影响**：用户点击「停止」按钮后，UI 显示停止但 API 请求仍在后台运行，token 继续消耗。

**建议**：给 `sendChatRequest()` 增加 `signal?: AbortSignal` 参数，或在页面中通过 `loading` 状态忽略后续 chunk。

---

## P1 — 高优先级（功能缺陷）

### 6. TopBar 页面标题缺失 9 个路由

**文件**：`src/components/layout/TopBar.tsx`（第 27-36 行）

`PAGE_TITLES` 映射只包含 7 个路由，缺失以下所有新路由：
- `/meta-concepts`、`/deconstructor`、`/deconstructor/book`
- `/domain-terms`、`/mece-trainer`、`/mental-models`
- `/translation-practice`、`/admin`、`/case-analysis`

**影响**：导航到这些页面时，TopBar 显示回退标题「知卡研习」而非有意义的页面名。

**建议**：补全 PAGE_TITLES 映射。

---

### 7. 移动端底部导航缺失新功能入口

**文件**：`src/components/layout/MobileBottomNav.tsx`

仅 6 个导航项（首页、元概念、资料、研习、复习、归档），缺失：
- 领域术语、万物拆解、拆书、MECE训练、思维模型、概念翻译

**影响**：移动端用户无法通过底部导航访问这些功能。

**建议**：扩展为可滚动导航或压缩为「工具」子菜单。

---

### 8. Store index 导出不完整

**文件**：`src/store/index.ts`

只导出 10 个 store，缺失：
- `metaProgressStore`（被 `useEffectiveLevel` 直接 import）
- `graphStore`
- `scoreStore`

虽然功能正常（直接 import 可用），但接口不一致，新人容易困惑。

**建议**：补全所有 store 的导出。

---

## P2 — 中优先级（代码质量）

### 9. 未使用的 import

**文件**：`src/data/domain-terms-api.ts`（第 9 行）

```typescript
import type { MetaConceptCard } from './meta-concepts-api'  // ❌ 未使用
```

**建议**：删除。

---

### 10. 拆解器 prompt 硬编码概念名

**文件**：`src/services/deconstructor.ts`（第 44-52 行）

```typescript
## 第一层：本源层拆解
（使用第1层「宇宙本源」的概念：存在/虚无/时间/空间/运动/静止/...）
```

概念名直接硬编码在 system prompt 中。如果 JSON 数据中的概念名变更，prompt 中的指引与动态加载的 `conceptSummary` 出现矛盾。

**建议**：prompt 中只说「使用第 N 层概念」，具体概念名由 `conceptSummary` 提供。

---

### 11. `getAllConcepts()` 首次调用加载全部 8 层

**文件**：`src/data/meta-concepts-api.ts`（第 109-122 行）

每次拆解/MECE/翻译都先调用 `getAllConcepts()`，首次需 8 个 fetch 请求。虽然后续走内存缓存，但首次加载慢。

**建议**：考虑在 App 启动时预热加载 manifest + 所有层到内存。

---

### 12. `localStorage` 直接访问无 try-catch

**文件**：`src/services/openai.ts`（第 9-17 行）

```typescript
function getSettings() {
  const raw = localStorage.getItem('zhika-settings')
  // ...
}
```

如果 localStorage 被禁用（隐私模式）或配额满了，`getItem` 抛出 `DOMException`，导致整个应用崩溃。

**建议**：加上 try-catch 兜底返回默认值。

---

### 13. 无 React Error Boundary

应用没有任何 `<ErrorBoundary>` 包裹。组件树中任何未捕获异常都会导致白屏。

**建议**：在 `AppLayout` 或 `App` 层面增加 ErrorBoundary。

---

### 14. `parseMECEResult` 正则过于脆弱

**文件**：`src/services/deconstructor.ts`（第 284 行）

正则依赖 AI 精确输出特定格式（中文标点、特定换行位置），任何格式偏差都会导致 pair 解析失败。

```typescript
const pairRegex = /###\s*概念组\d+[：:]\s*(.+?)↔(.+?)\n\*\*「(.+?)」侧分析\*\*[：:]?\s*([\s\S]*?)(?:\n\*\*「(.+?)」侧分析\*\*[：:]?\s*([\s\S]*?))(?=\n###|\n##|$)/g
```

**建议**：增加 fallback 解析逻辑（如按 markdown heading 分段后逐组处理）。

---

## P3 — 低优先级（建议优化）

### 15. AI基础数据双重维护

同一组 10 个 AI 术语在两个地方维护：
- `public/domain-terms/ai-basics.json`（给 DomainTermsPage 用）
- `src/data/ai-basics-10-words.ts`（给 materialStore wordBank 用）

数据结构不同，字段不全一致。修改内容需要两边同步。

**建议**：wordBank 改为从 JSON 动态构建，或统一数据源。

---

### 16. 路径别名 `@/` 使用不一致

`tsconfig.json` 定义了 `@/*` → `src/*`，但大部分文件仍使用 `../../` 相对路径 import。混用降低可读性。

**建议**：逐步迁移为统一的 `@/` import。

---

### 17. `deconstructor.ts` 的 `buildDeconstructPrompt` 与 `buildBookDeconstructPrompt` 有大量重复代码

两个函数都有相同的：
```typescript
const layerConcepts: Record<number, string[]> = {}
for (const c of allConcepts) { ... }
const conceptSummary = Object.entries(layerConcepts).map(...).join('\n')
```

**建议**：提取为 `formatConceptSummary(allConcepts)` 公共函数。

---

### 18. 经济学术语的 `opposingTerm` 有空字符串

**文件**：`public/domain-terms/economics.json` 中「边际效应」

```json
"opposingTerm": ""   // 应为不传此字段或 null
```

其他术语有 `"opposingTerm": ""` 的类似情况。空字符串在 UI 中会被判定为 truthy。

**建议**：统一处理——无对立方时不传 `opposingTerm` 或传 `null`。

---

### 19. 架构文档级别标注不一致

- DeconstructorPage 标注 "MVP"
- MECETrainerPage, MentalModelsPage, TranslationPracticePage 标注 "P2"
- 其他页面无版本标注

**建议**：统一移除或统一为版本号标注。

---

## 总结

| 级别 | 数量 | 说明 |
|---|---|---|
| P0 | 5 | 类型冲突、数据错误、无效功能 |
| P1 | 3 | 缺失页面标题、移动端入口、store导出 |
| P2 | 6 | 代码重复、脆弱正则、边界处理 |
| P3 | 5 | 风格统一、重构建议 |

**关键行动项（建议优先修复）**：
1. 修复 `types/index.ts` 与 `types/study.types.ts` 的重复定义
2. 修正 `domain-terms/manifest.json` 的 `totalTerms`
3. 审查 12 个思维模型 JSON 的 `metaConceptMapping` 字段
4. 修复拆书页面停止按钮无效
5. 补全 TopBar 和 MobileBottomNav 的新路由
