# AI-CRM Serverless 项目

基于 Vercel Serverless 的现代化 AI-CRM 系统，采用 PostgreSQL 数据库和 JWT 认证。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入数据库连接和 JWT 密钥
```

### 3. 初始化数据库
```bash
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 📚 文档导航

### 核心文档
- [部署指南](docs/DEPLOYMENT.md) - 完整的生产部署说明
- [Vercel 部署详细教程](docs/Vercel部署详细教程.md) - 零基础图文部署流程
- [开发指南](DEVELOPMENT.md) - 本地开发和调试说明
- [前端文档](docs/FRONTEND.md) - 前端页面和组件说明

### 项目管理
- [项目管理索引](PROJECT_MANAGEMENT_INDEX.md) - 项目管理文档总览
- [开发计划](DEV_PLAN.md) - 详细开发计划和时间表
- [进度跟踪](PROGRESS_TRACKER.md) - 项目进度和里程碑
- [验收清单](ACCEPTANCE_CHECKLIST.md) - 各阶段验收标准
- [风险登记](RISK_REGISTER.md) - 风险管理和缓解策略
- [问题跟踪](ISSUE_TRACKER.md) - 问题和缺陷管理
- [测试计划](TEST_PLAN.md) - 测试策略和用例

### 技术文档
- [项目概览](docs/technical/README.md) - 项目背景和目标
- [快速开始](docs/technical/00_快速开始指南.md) - 环境搭建
- [需求规格](docs/technical/01_项目需求规格说明.md) - 功能需求详情
- [架构设计](docs/technical/02_技术架构设计文档.md) - 系统架构
- [业务规则](docs/technical/03_项目规则与AI算法.md) - 业务逻辑
- [UI规范](docs/technical/04_UI设计与交互规范.md) - 界面设计规范
- [任务规划](docs/technical/05_重新开发任务规划.md) - 开发任务分解
- [最佳实践](docs/technical/06_开发建议与最佳实践.md) - 开发指南

## 🛠️ 技术栈

- **运行时**: Node.js 18+
- **框架**: Vercel Serverless Functions
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs
- **验证**: Zod
- **测试**: Vitest + Supertest
- **前端**: HTML + CSS + Alpine.js
- **PWA**: Service Worker + Manifest

## 📦 项目结构

```
ai-crm-serverless/
├── api/                    # Serverless Functions
│   ├── auth/              # 认证接口
│   ├── customers/         # 客户管理
│   ├── visits/            # 回访记录
│   ├── products/          # 产品订单
│   ├── dashboard/         # 仪表盘统计
│   ├── presets/           # 预设数据
│   └── utils/             # 工具函数
├── public/                # 前端静态文件
│   ├── css/               # 样式文件
│   ├── js/                # JavaScript
│   ├── components/        # 组件
│   └── *.html             # 页面
├── prisma/                # 数据库
│   ├── schema.prisma      # 数据模型
│   └── seed.ts            # 初始数据
├── tests/                 # 测试文件
├── docs/                  # 项目文档
│   ├── technical/         # 技术文档
│   └── DEPLOYMENT.md      # 部署指南
└── README.md              # 本文件
```

## 🔐 默认账户

初始化数据库后会创建默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

⚠️ **重要**: 生产环境请立即修改默认密码！

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npx vitest tests/api/customers.test.ts

# 查看测试覆盖率
npm test -- --coverage
```

## 📱 前端预览

项目包含完整的前端界面：
- 移动优先设计，响应式布局
- 支持深色模式
- PWA 支持（离线访问）

查看 [前端文档](docs/FRONTEND.md) 了解更多。

## 🚢 部署

项目支持一键部署到 Vercel：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

详细部署步骤请查看：
- **新手推荐**：[Vercel 部署详细教程](docs/Vercel部署详细教程.md) - 从零开始的图文教程
- **快速参考**：[部署指南](docs/DEPLOYMENT.md) - 简明部署流程

## 📝 API 端点

### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌

### 客户管理
- `GET /api/customers` - 客户列表
- `POST /api/customers` - 创建客户
- `GET /api/customers/:id` - 客户详情
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户

### 回访记录
- `GET /api/visits` - 回访列表
- `POST /api/visits` - 创建回访
- `GET /api/visits/:id` - 回访详情
- `PUT /api/visits/:id` - 更新回访
- `DELETE /api/visits/:id` - 删除回访

### 产品订单
- `GET /api/products` - 订单列表
- `POST /api/products` - 创建订单
- `GET /api/products/:id` - 订单详情
- `PUT /api/products/:id` - 更新订单
- `DELETE /api/products/:id` - 删除订单
- `GET /api/products/statistics/summary` - 销售统计

### 仪表盘
- `GET /api/dashboard/statistics` - 统计数据

### 预设数据
- 客户分类、意向等级、地区、预算范围等 11 个预设数据模块
- 每个模块支持完整的 CRUD 操作

完整 API 文档请查看 [部署指南](docs/DEPLOYMENT.md#api文档)。

## 🤝 贡献

1. 遵循现有的代码风格
2. 所有新功能必须包含测试
3. 提交前运行 `npm run lint` 和 `npm test`
4. 提交信息遵循规范：`feat:`, `fix:`, `docs:` 等

## 📄 许可证

本项目仅供学习和内部使用。

## 📞 支持

如有问题，请查阅项目文档或创建 Issue。

---

**最后更新**: 2024-12-19  
**维护人**: AI Agent
