# AI-CRM Serverless 重构项目 - 工程管理文档总览

欢迎来到 AI-CRM Serverless 重构项目。本仓库为 **工程管理文档中心**，所有项目计划、执行、监控与验收相关文档均在此维护，确保项目可以「有计划」「可追踪」「能验收」。

> ⚠️ 注意：此仓库（/doc_move/ 等）目前仅提供文档，不包含项目源码。实际开发工作请参考文档指导，在源码仓库中执行。

---

## 📚 文档导航

### 1️⃣ 项目管理索引
- [PROJECT_MANAGEMENT_INDEX.md](./PROJECT_MANAGEMENT_INDEX.md) – **项目管理文档总览**（推荐起点）
  - 汇总所有计划、执行、风险、验收、测试文档的用途与使用方式
  - 提供如何在不同阶段使用这些文档的流程指南

### 2️⃣ 核心管理文档
| 文档 | 说明 |
| --- | --- |
| [DEV_PLAN.md](./DEV_PLAN.md) | 项目开发计划：目标、范围、WBS、验收策略、风险与沟通计划 |
| [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) | 进度跟踪：里程碑、日/周进度、燃尽图、会议记录 |
| [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) | 验收清单：各阶段 DoD、验收步骤、最终验收报告模板 |
| [RISK_REGISTER.md](./RISK_REGISTER.md) | 风险登记：风险识别、评估、缓解、评审纪录 |
| [ISSUE_TRACKER.md](./ISSUE_TRACKER.md) | 问题跟踪：缺陷处理流程、优先级、问题登记模板 |
| [TEST_PLAN.md](./TEST_PLAN.md) | 测试计划：单测/集成/E2E/性能/安全测试策略与执行方案 |

### 3️⃣ 项目原始需求及技术参考（来自 doc_move/）
| 文件 | 说明 |
| --- | --- |
| [doc_move/README.md](./doc_move/README.md) | 项目概览、目标、术语解释 |
| [doc_move/00_快速开始指南.md](./doc_move/00_快速开始指南.md) | 环境搭建与部署指南 |
| [doc_move/01_项目需求规格说明.md](./doc_move/01_项目需求规格说明.md) | 功能规格、接口契约、数据模型 |
| [doc_move/02_技术架构设计文档.md](./doc_move/02_技术架构设计文档.md) | 架构图、模块设计、技术栈 |
| [doc_move/03_项目规则与AI算法.md](./doc_move/03_项目规则与AI算法.md) | 数据规则、算法逻辑、验证标准 |
| [doc_move/04_UI设计与交互规范.md](./doc_move/04_UI设计与交互规范.md) | UI 布局、组件规范、动效、无障碍 |
| [doc_move/05_重新开发任务规划.md](./doc_move/05_重新开发任务规划.md) | 阶段任务、工期估算、里程碑 |
| [doc_move/06_开发建议与最佳实践.md](./doc_move/06_开发建议与最佳实践.md) | Serverless 最佳实践、测试策略、安全指引 |

---

## 🔄 建议使用流程

1. **项目启动**：
   - 阅读 [PROJECT_MANAGEMENT_INDEX.md](./PROJECT_MANAGEMENT_INDEX.md) 理解文档结构
   - 确认 [DEV_PLAN.md](./DEV_PLAN.md) 中的目标、范围和 WBS
   - 召开启动会，记录在 [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md)

2. **开发执行**：
   - 按 [DEV_PLAN.md](./DEV_PLAN.md) 的阶段与任务推进
   - 每日更新 [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md)、[ISSUE_TRACKER.md](./ISSUE_TRACKER.md)
   - 每 2 周评审一次 [RISK_REGISTER.md](./RISK_REGISTER.md)

3. **测试验证**：
   - 参考 [TEST_PLAN.md](./TEST_PLAN.md) 设计并执行测试
   - 输出测试报告，作为 [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) 的验收输入

4. **阶段验收**：
   - 对照 [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) 勾选项目
   - 完成后由 PM/委托人签署

5. **项目收尾**：
   - 确认 [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) 最终验收报告
   - 整理文档归档
   - 进行复盘总结

---

## ✅ 成功标准

- 所有文档按期维护、保持最新
- 每个阶段均有清晰的 DoD 及验收记录
- 项目进度、风险、问题可实时追踪
- 测试与验收流程标准化、具备审计追踪

---

## 📩 使用建议

- 建议将本 README 与 [PROJECT_MANAGEMENT_INDEX.md](./PROJECT_MANAGEMENT_INDEX.md) 加入书签
- 发现文档问题请在 [ISSUE_TRACKER.md](./ISSUE_TRACKER.md) 中登记
- 项目执行过程中，应确保所有更新实时同步

如需进一步的模板扩展、自动化工具（如脚本生成报告、仪表盘等），请联系技术负责人（AI Agent）。

---

**最后更新**：2024-11-06  
**维护人**：AI Agent
