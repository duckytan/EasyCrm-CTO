# AI-CRM 项目管理文档索引

> **项目管理中心** | 所有管理文档导航 | 更新日期：2024-11-06

---

## 📚 文档体系概览

本项目建立了完整的工程管理文档体系，涵盖计划、执行、监控、验收全流程。所有文档均可实时更新，用于项目过程管理和最终验收。

---

## 🗂️ 核心文档导航

### 1️⃣ 项目计划类

#### [DEV_PLAN.md](./DEV_PLAN.md) - 项目开发计划
**用途**：项目总体规划文档  
**包含内容**：
- 项目目标、范围、角色职责
- 8 周分阶段时间计划
- 详细任务分解（WBS）
- 质量保证计划
- 风险管理策略
- 验收方案框架
- 配置管理与沟通计划

**何时使用**：
- ✅ 项目启动时：全面了解项目规划
- ✅ 周度评审时：对照计划检查进度
- ✅ 里程碑评审时：验证阶段交付

**责任人**：PM、Tech Lead  
**更新频率**：重大变更时

---

#### [TEST_PLAN.md](./TEST_PLAN.md) - 测试计划
**用途**：质量保证策略文档  
**包含内容**：
- 单元/接口/集成/E2E/性能/安全测试策略
- 测试用例清单
- 测试执行计划（按 Phase）
- 覆盖率目标
- 测试自动化方案
- 测试报告模板

**何时使用**：
- ✅ 开发前：了解测试要求
- ✅ 开发中：编写测试用例
- ✅ 阶段验收前：执行测试套件

**责任人**：QA、开发工程师  
**更新频率**：每个 Phase

---

### 2️⃣ 执行跟踪类

#### [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) - 进度跟踪表
**用途**：实时追踪项目进度  
**包含内容**：
- 总体进度概览
- 里程碑追踪
- 周度进度报告
- 燃尽图数据
- 关键指标追踪
- 每日站会记录
- 会议记录

**何时使用**：
- ✅ 每日：更新站会记录和任务状态
- ✅ 每周：填写周度报告
- ✅ 里程碑完成时：更新里程碑状态

**责任人**：Tech Lead、团队成员  
**更新频率**：每日

---

#### [ISSUE_TRACKER.md](./ISSUE_TRACKER.md) - 问题跟踪表
**用途**：管理缺陷与问题  
**包含内容**：
- 问题统计概览
- 问题列表（按优先级）
- 问题登记模板
- 问题处理流程
- 升级机制
- 趋势分析

**何时使用**：
- ✅ 发现问题时：立即记录
- ✅ 每日：更新问题状态
- ✅ 周度评审：回顾未解决问题

**责任人**：全体团队成员  
**更新频率**：实时

---

#### [RISK_REGISTER.md](./RISK_REGISTER.md) - 风险登记表
**用途**：识别与管理项目风险  
**包含内容**：
- 风险评估矩阵
- 10 大识别风险
- 缓解策略与行动计划
- 风险趋势分析
- 风险评审记录

**何时使用**：
- ✅ 项目启动：识别初始风险
- ✅ 每 2 周：风险评审会
- ✅ 出现新风险时：立即登记

**责任人**：Tech Lead、PM  
**更新频率**：每 2 周

---

### 3️⃣ 验收交付类

#### [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) - 验收检查清单
**用途**：阶段验收与最终验收  
**包含内容**：
- 总体进度概览
- Phase 0-7 详细验收清单
- 功能验证项
- 数据验证项
- 文档交付要求
- 最终验收报告模板

**何时使用**：
- ✅ 每个 Phase 完成时：执行阶段验收
- ✅ 项目结束时：执行最终验收
- ✅ 实时检查：对照清单验证完成度

**责任人**：PM、Tech Lead  
**更新频率**：每个 Phase

---

### 4️⃣ 参考文档类

#### 技术文档（doc_move/）
- [README.md](./doc_move/README.md) - 项目概览
- [00_快速开始指南.md](./doc_move/00_快速开始指南.md) - 环境搭建
- [01_项目需求规格说明.md](./doc_move/01_项目需求规格说明.md) - 功能需求
- [02_技术架构设计文档.md](./doc_move/02_技术架构设计文档.md) - 架构设计
- [03_项目规则与AI算法.md](./doc_move/03_项目规则与AI算法.md) - 业务规则
- [04_UI设计与交互规范.md](./doc_move/04_UI设计与交互规范.md) - UI 规范
- [05_重新开发任务规划.md](./doc_move/05_重新开发任务规划.md) - 任务规划
- [06_开发建议与最佳实践.md](./doc_move/06_开发建议与最佳实践.md) - 最佳实践

**何时使用**：
- ✅ 开发前：全面了解需求和架构
- ✅ 开发中：查阅具体规范
- ✅ 遇到问题时：参考最佳实践

---

## 🔄 文档使用流程

### 项目启动阶段
1. 阅读 [DEV_PLAN.md](./DEV_PLAN.md) 了解整体规划
2. 阅读 doc_move/ 下的技术文档了解需求
3. 审阅 [RISK_REGISTER.md](./RISK_REGISTER.md) 识别初始风险
4. 召开项目启动会，确认计划

### 开发执行阶段
1. **每日**：
   - 更新 [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) 站会记录
   - 更新 [ISSUE_TRACKER.md](./ISSUE_TRACKER.md) 问题状态
   - 勾选 [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) 完成项

2. **每周**：
   - 填写 [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) 周度报告
   - 召开周度评审会，对照 [DEV_PLAN.md](./DEV_PLAN.md) 检查进度
   - 更新里程碑状态

3. **每 2 周**：
   - 召开风险评审会，更新 [RISK_REGISTER.md](./RISK_REGISTER.md)

### 阶段验收阶段
1. 执行 [TEST_PLAN.md](./TEST_PLAN.md) 中的测试套件
2. 填写 [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) 对应 Phase 清单
3. 提交测试报告和交付物
4. PM 审批验收

### 项目收尾阶段
1. 执行完整回归测试
2. 填写 [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) 最终验收报告
3. 整理所有文档归档
4. PM 签署验收

---

## 📊 文档关系图

```
┌─────────────────────────────────────────────────────────────┐
│                    项目管理文档体系                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ 计划类  │          │ 执行类  │          │ 验收类  │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                     │                     │
   ┌────▼────────┐      ┌────▼─────────┐     ┌────▼──────────┐
   │ DEV_PLAN    │◄─────┤ PROGRESS     │────►│ ACCEPTANCE    │
   │ TEST_PLAN   │      │ ISSUE        │     │ CHECKLIST     │
   └─────────────┘      │ RISK         │     └───────────────┘
                        └──────────────┘
                              ▲
                              │
                    ┌─────────┴─────────┐
                    │ doc_move/ 技术文档 │
                    │ (需求、架构、规范) │
                    └───────────────────┘
```

---

## 🎯 快速查找指南

### 我想查看...

- **项目总体时间安排** → [DEV_PLAN.md](./DEV_PLAN.md) 第 2 节
- **当前进度如何** → [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) 总体进度概览
- **本周要完成什么** → [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) 对应周度报告
- **如何验收某个阶段** → [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) 对应 Phase
- **如何报告问题** → [ISSUE_TRACKER.md](./ISSUE_TRACKER.md) 问题登记模板
- **有哪些风险** → [RISK_REGISTER.md](./RISK_REGISTER.md) 风险列表
- **如何执行测试** → [TEST_PLAN.md](./TEST_PLAN.md) 测试执行计划
- **功能需求是什么** → [01_项目需求规格说明.md](./doc_move/01_项目需求规格说明.md)
- **技术架构如何设计** → [02_技术架构设计文档.md](./doc_move/02_技术架构设计文档.md)

---

## 📋 文档维护责任

| 文档 | 主要维护人 | 审批人 | 更新频率 |
| --- | --- | --- | --- |
| DEV_PLAN.md | Tech Lead | PM | 重大变更 |
| PROGRESS_TRACKER.md | Tech Lead | PM | 每日 |
| ISSUE_TRACKER.md | 全体成员 | Tech Lead | 实时 |
| RISK_REGISTER.md | Tech Lead | PM | 每 2 周 |
| ACCEPTANCE_CHECKLIST.md | Tech Lead | PM | 每 Phase |
| TEST_PLAN.md | QA/开发 | Tech Lead | 每 Phase |

---

## ✅ 文档质量标准

### 完整性
- [ ] 所有必填字段已填写
- [ ] 相关附件已上传
- [ ] 责任人已明确

### 准确性
- [ ] 数据真实有效
- [ ] 状态及时更新
- [ ] 无过时信息

### 可读性
- [ ] 格式规范统一
- [ ] 语言清晰简洁
- [ ] 结构层次分明

### 可追溯性
- [ ] 变更有记录
- [ ] 问题有闭环
- [ ] 决策有依据

---

## 🔧 文档使用建议

### 对于项目经理（PM）
1. **项目启动时**：审批 DEV_PLAN，确认资源和时间
2. **每周**：查看 PROGRESS_TRACKER，了解进度和风险
3. **阶段验收时**：使用 ACCEPTANCE_CHECKLIST 执行验收
4. **遇到重大问题**：查看 ISSUE_TRACKER 和 RISK_REGISTER

### 对于技术负责人（Tech Lead）
1. **每日**：更新 PROGRESS_TRACKER 和 ISSUE_TRACKER
2. **每周**：填写周度报告，组织周会
3. **每 2 周**：更新 RISK_REGISTER，组织风险评审
4. **每 Phase**：准备验收材料，执行阶段验收

### 对于开发工程师
1. **开发前**：阅读 doc_move/ 技术文档
2. **开发中**：参考 TEST_PLAN 编写测试
3. **发现问题**：在 ISSUE_TRACKER 登记
4. **每日**：更新任务状态

### 对于 QA
1. **测试前**：阅读 TEST_PLAN 了解策略
2. **测试中**：执行测试用例，记录缺陷
3. **测试后**：编写测试报告
4. **验收时**：协助执行 ACCEPTANCE_CHECKLIST

---

## 📞 支持与反馈

### 文档问题反馈
如果发现文档有错误、遗漏或需要改进的地方：
1. 在 [ISSUE_TRACKER.md](./ISSUE_TRACKER.md) 登记问题
2. 类型选择：📝 Task（文档改进）
3. 指派给：AI Agent

### 文档改进建议
欢迎提出改进建议：
1. 描述当前问题
2. 提出改进方案
3. 说明预期效果

---

## 📚 附录

### 文档版本历史

| 版本 | 日期 | 变更内容 | 变更人 |
| --- | --- | --- | --- |
| 1.0 | 2024-11-06 | 初始版本，建立完整文档体系 | AI Agent |

### 文档模板
- 问题登记模板：见 [ISSUE_TRACKER.md](./ISSUE_TRACKER.md)
- 风险登记模板：见 [RISK_REGISTER.md](./RISK_REGISTER.md)
- 测试报告模板：见 [TEST_PLAN.md](./TEST_PLAN.md)
- 验收报告模板：见 [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md)

### 相关工具
- 项目管理：Jira / Linear / ClickUp
- 文档协作：Notion / Confluence
- 代码管理：GitHub / GitLab
- CI/CD：GitHub Actions / Vercel
- 测试工具：Vitest / Playwright / k6
- 监控工具：Vercel Logs / Sentry / Logtail

---

## 🎉 开始使用

1. **首次使用**：从 [DEV_PLAN.md](./DEV_PLAN.md) 开始，全面了解项目
2. **日常使用**：主要关注 [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) 和 [ISSUE_TRACKER.md](./ISSUE_TRACKER.md)
3. **阶段验收**：使用 [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) 逐项检查
4. **遇到问题**：查阅 doc_move/ 技术文档或联系 Tech Lead

---

**文档维护**：AI Agent  
**最后更新**：2024-11-06  
**适用项目**：AI-CRM Serverless 重构

---

> 💡 **提示**：建议将本文档添加到浏览器书签，方便随时查阅。
