# AI-CRM Serverless 开发指南

## 项目初始化完成情况

✅ Phase 0 - 项目初始化已完成：
- ✅ WBS-0.1：创建项目目录结构
- ✅ WBS-0.2：安装核心依赖（package.json 已配置）
- ✅ WBS-0.3：Prisma Schema 设计（已完成）
- ✅ WBS-0.4：数据库迁移与 Seed 脚本（已创建）
- ✅ WBS-0.5：Vercel 配置（vercel.json 已配置）
- ✅ WBS-0.6：Healthcheck 接口（已创建）
- ⏳ WBS-0.7：环境验证与文档（本文档）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

创建一个 PostgreSQL 数据库，然后更新 `.env.local` 文件中的 `DATABASE_URL`：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### 3. 运行数据库迁移

```bash
npm run prisma:migrate
```

这将创建所有必要的数据库表。

### 4. 初始化数据

```bash
npm run prisma:seed
```

这将创建：
- 管理员账户（用户名：admin，密码：admin123）
- 所有预设数据（客户分类、意向等级、地区等）

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动。

### 6. 验证环境

访问健康检查接口：
```bash
curl http://localhost:3000/api/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2024-11-06T..."
}
```

## 项目结构

```
ai-crm-serverless/
├── api/                    # Vercel Serverless Functions
│   ├── auth/              # 认证相关接口
│   ├── customers/         # 客户管理接口
│   ├── visits/            # 回访记录接口
│   ├── products/          # 产品订单接口
│   ├── dashboard/         # 仪表盘统计接口
│   ├── maintenance/       # 数据维护接口
│   ├── presets/           # 预设数据接口
│   ├── utils/             # 工具函数
│   └── health.ts          # 健康检查接口
├── app/                   # 前端应用（待开发）
│   └── src/
├── prisma/                # 数据库相关
│   ├── schema.prisma      # 数据模型定义
│   └── seed.ts            # 数据初始化脚本
├── tests/                 # 测试文件
│   ├── api/               # API 测试
│   └── integration/       # 集成测试
├── doc_move/              # 项目文档
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
├── vercel.json            # Vercel 部署配置
└── .env.local             # 环境变量（本地）
```

## 数据模型概览

系统包含以下主要数据模型：

### 核心业务表
- **Manager** - 管理员账户
- **UserSetting** - 用户设置
- **Customer** - 客户信息
- **Visit** - 回访记录
- **ProductOrder** - 产品订单
- **ManagerAuditLog** - 操作日志

### 预设数据表
- **CustomerCategory** - 客户分类
- **CustomerIntention** - 客户意向等级
- **Region** - 地区
- **BudgetRange** - 预算范围
- **SuperiorContact** - 上级联系人
- **SubordinateContact** - 下级联系人
- **PresetProduct** - 预设产品
- **VisitMethod** - 回访方式
- **VisitType** - 回访类型
- **NavigationMode** - 导航模式
- **ReminderCycle** - 提醒周期

详细的数据模型定义请参考 `prisma/schema.prisma`。

## 下一步开发计划

Phase 0 完成后，接下来将进入：

**Phase 1 - 认证与基础 API**（Week 2-3）
- 实现 JWT 工具函数
- 创建认证中间件
- 实现登录、刷新 Token 接口
- 实现客户 CRUD 接口
- 编写单元测试

详细的开发计划请参考：
- [DEV_PLAN.md](./DEV_PLAN.md) - 完整开发计划
- [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) - 进度跟踪
- [doc_move/05_重新开发任务规划.md](./doc_move/05_重新开发任务规划.md) - 详细任务拆解

## 开发工具

### Prisma Studio
查看和编辑数据库数据：
```bash
npx prisma studio
```

### 代码检查
```bash
npm run lint
```

### 类型检查
```bash
npm run build
```

### 运行测试
```bash
npm test
```

## 技术栈

- **运行时**：Node.js 18+
- **框架**：Vercel Serverless Functions
- **数据库**：PostgreSQL
- **ORM**：Prisma
- **认证**：JWT (jsonwebtoken)
- **密码加密**：bcryptjs
- **验证**：Zod
- **测试**：Vitest + Supertest
- **类型**：TypeScript

## 环境变量

必需的环境变量：
- `DATABASE_URL` - PostgreSQL 数据库连接字符串
- `JWT_SECRET` - JWT 访问令牌密钥
- `JWT_REFRESH_SECRET` - JWT 刷新令牌密钥

## 常见问题

### 数据库连接失败
确保 PostgreSQL 服务正在运行，并且 `.env.local` 中的连接字符串正确。

### Prisma 生成失败
运行 `npm run prisma:generate` 重新生成 Prisma Client。

### 端口被占用
如果 3000 端口被占用，可以在启动时指定其他端口：
```bash
vercel dev --listen 3001
```

## 贡献指南

1. 遵循现有的代码风格和命名约定
2. 所有新功能必须包含测试
3. 提交前运行 `npm run lint` 和 `npm test`
4. 提交信息遵循规范：`feat: ...`, `fix: ...`, `docs: ...` 等

## 联系方式

如有问题，请查阅项目文档或联系技术负责人（AI Agent）。
