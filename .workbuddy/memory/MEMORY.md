# 知卡研习项目 - 长期记忆

## 用户工作流
- **开发环境**：远程 Ubuntu 服务器（`ubuntu2`），工作目录 `/data/WS/知识卡片研习`
- **本地构建**：Git Bash + PowerShell 执行 `git pull && npm run dev`
- **协作方式**：代码修改后直接 push 到 GitHub，用户在服务器上 pull 可见
- **强制习惯**：AI 改完代码必须立即 push，禁止等用户提醒

## 项目技术栈
- Vite + React + TypeScript + MUI + Zustand + React Router
- Node: v22.16.0 (Lenovo AIAgent)
- API: DeepSeek（base_url: `https://api.deepseek.com`）
- npm 镜像：npmmirror

## GitHub
- 账号：`github.com/shssun`
- 仓库：knowledgeCardLearning

## 当前项目状态
- 版本：`1.2.0`（package.json 单点源）
- 核心架构：元概念先行（8层130个）→ 领域术语（中级以上解锁）
- 已完成：元概念启蒙系统、对立关系可视化、万物拆解器 MVP、领域术语系统、拆书功能、MECE训练器、思维模型归一拆解、概念翻译练习、等级门禁机制、素材库、研习5步流程、艾宾浩斯复习、知识卡展示、输出模板、知识图谱
- 已砍掉：卡片版本迭代、每日专注管理、AI生成工作流、知识库检索、数据统计面板

## 元概念系统（2026-05-22 新增/迭代）
- 8层递进：宇宙本源→逻辑思维→人性意识→社会人际→成事行动→商业财富→认知思维→创新创造
- 130个唯一概念（原138个去重），JSON 按层加载（`public/meta-concepts/layer-{1..8}.json`）
- 学习方式：直接展示5项内容（定义/边界/近似概念/案例/误区）+ 自评滑块 ≥80=掌握
- 数据存储：metaProgressStore（Zustand+persist）+ manifest.json 索引
- 路由：`/meta-concepts`
- 新增对立配对：108/130 概念已标注 opposingConcept，22个solo（无明确层内对立面）
- 对立关系视图：列表/对立双模式切换，配对卡片 + VS 连接器

## 万物拆解器（2026-05-22 新增）
- 路由：`/deconstructor`，侧边栏入口
- 用户输入任意概念/问题/事件 → AI 用130个元概念逐层拆解
- 5层输出：本源层→逻辑层→人性层→社会/行动/商业层→极简定论
- 流式输出 + 结构化卡片展示
- API：`deconstructor.ts` 构建 prompt 注入全部元概念，调用 `sendChatRequest()`

## 等级系统（2026-05-22 重构）
- 等级由元概念进度驱动，非累计积分：
  - 小白：Layer1+2 < 80% 掌握（默认起始，仅元概念页面）
  - 初级：Layer1+2 ≥ 80% → 解锁 Layer3-5
  - 中级：Layer3-5 ≥ 80% → 解锁领域术语学习
  - 高级：Layer6-7 ≥ 80%
  - 大师：Layer8 ≥ 80%
- 等级由 `useEffectiveLevel` hook 实时计算，非存储在 localStorage
- 等级门禁：LevelStudyPage 对小白锁住领域内容，展示进度条 + 去元概念按钮
- 升级门槛：核心层 80% 掌握（≥80/概念），Layer1+2 共 37 个需掌握 30 个

## 领域术语系统（2026-05-22 新增）
- 3 个预置领域：AI基础(10词)、经济学基础(8词)、认知心理学(7词)，共25个词条
- 每词条含：定义、五级内容、元概念映射（如「供需关系」→ 因果/对立/统一/稀缺/竞争/定价）
- 数据存储：`public/domain-terms/{domain}.json` + `domain-terms-api.ts`（按需加载+缓存）
- 路由：`/domain-terms`，中级等级门禁（小白+初级锁住）
- 交互：领域网格 → 术语列表 → 术语详情（含元概念映射的点击跳转）

## 拆书功能（2026-05-22 新增）
- 路由：`/deconstructor/book`，侧边栏入口
- 输入书名+作者 → AI 用130个元概念拆解全书
- 6段结构化输出：核心论点→概念拆解→论证结构→人性洞察→价值与边界→极简定论
- 流式输出 + 结构化/原始双视图切换
- API：`deconstructor.ts` 的 `deconstructBook()` 函数

## MECE 对立思考训练器（2026-05-22 新增）
- 路由：`/mece-trainer`，侧边栏入口
- 用户输入问题/决策 → AI 匹配 3-4 组对立元概念 → 双向分析（正反各一列）
- 输出：问题陈述 → 概念对双列分析 → MECE 完整性校验 → 综合结论
- API：`deconstructor.ts` 的 `meceAnalyze()` + `parseMECEResult()`

## 经典思维模型归一拆解（2026-05-22 新增）
- 12 个预置模型：复利/机会成本/逆向思维/第一性原理/二八法则/第二曲线/系统思维/博弈论/能力圈/沉没成本/反馈循环/反脆弱
- JSON 按模型独立存储：`public/mental-models/{key}.json` + manifest 索引
- 每个模型：核心公式 | 元概念拆解 | 优势 | 短板盲区 | 使用边界 | 升级组合建议
- 路由：`/mental-models`，分类网格 → 模型详情（元概念标签可跳转）
- API：`mental-models-api.ts`（按需加载+缓存）

## 概念翻译练习打卡（2026-05-22 新增）
- 路由：`/translation-practice`，侧边栏入口
- 用户输入上层概念 → AI 用底层元概念翻译解释
- 输出：目标概念 → 元概念翻译 → 使用的元概念清单 → 一句话
- 打卡追踪：localStorage 持久化，Badge 显示完成数，15 个预置概念供快速体验
- API：`deconstructor.ts` 的 `translateConcept()` + `parseTranslationResult()`

## 个人思维积木库（2026-05-22 新增，PRD 模块六）
- 路由：`/vault`，侧边栏入口
- 自动持久化四个工具的产出：万物拆解、MECE训练、概念翻译、拆书
- 数据存储：`personalVaultStore`（Zustand+persist，key: `zhika-personal-vault`）
- 页面功能：6维统计卡片 + 分类Tab筛选 + 瀑布流卡片列表 + 详情弹窗 + 删除确认
- 四工具接入：`addVaultEntry()` 在 flow 完成后自动调用，对用户透明

## 二期计划（海外版 i18n）
- **部署方案**：Vercel/Cloudflare Pages 免费部署 + Supabase 后端
- **国际化**：react-i18next，600+条翻译（中文→英文）
- **会员系统**：GitHub OAuth + Token余额计费（可选二期实现）
- **架构**：前端 Vercel + 后端 Supabase + DeepSeek API

## 技术债务/待优化
- TopBar 硬编码修复（2026-05-17）："今日学习 0/20"、"待复习 0"、通知徽章 3 已改为动态读取
  - 每日目标从 localStorage `zhika-settings` 读取 `dailyGoal`
  - 今日进度从 studyStore sessions 计算生成卡片数
  - 待复习数暂时用活跃 session 数代替（后续需接入艾宾浩斯复习逻辑）
