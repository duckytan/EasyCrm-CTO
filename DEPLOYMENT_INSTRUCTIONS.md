# AI-CRM Serverless - 部署指南

> **快速部署指南** | 版本 1.0 | 更新日期：2024-11-06

---

## 📋 部署概览

本项目是一个基于 Vercel Serverless Functions 和 PostgreSQL 的 AI-CRM 后端系统。

**技术栈**：
- **运行时**：Node.js 18.x
- **框架**：Vercel Serverless Functions
- **数据库**：PostgreSQL（推荐使用 Vercel Postgres / Supabase / Neon）
- **ORM**：Prisma
- **部署平台**：Vercel

---

## 🚀 快速部署步骤

### 1. 准备数据库

选择一个 PostgreSQL 数据库服务商：

#### 选项A：Vercel Postgres（推荐）
```bash
# 在 Vercel 仪表板中创建 Postgres 数据库
# 然后获取 DATABASE_URL 连接字符串
```

#### 选项B：Supabase
1. 前往 https://supabase.com
2. 创建新项目
3. 获取数据库连接字符串（在 Project Settings > Database）

#### 选项C：Neon
1. 前往 https://neon.tech
2. 创建新项目
3. 获取数据库连接字符串

### 2. 本地环境配置

```bash
# 克隆项目
git clone <your-repo-url>
cd ai-crm-serverless

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入以下变量：
# DATABASE_URL="postgresql://user:password@host:5432/database"
# JWT_SECRET="your-random-secret-key-here"
# JWT_REFRESH_SECRET="your-random-refresh-secret-key-here"
```

### 3. 数据库迁移与种子数据

```bash
# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npx prisma migrate deploy

# 填充种子数据（管理员账户 + 预设数据）
npm run prisma:seed
```

**默认管理员账户**：
- 用户名：`admin`
- 密码：`admin123`（**生产环境请立即修改！**）

### 4. 本地测试

```bash
# 启动本地开发服务器
npm run dev

# 访问 http://localhost:3000/api/health
# 应该返回：{"status":"ok","timestamp":"..."}
```

### 5. 部署到 Vercel

#### 方式A：通过 Vercel CLI（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

#### 方式B：通过 Git 集成

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 在 Vercel 仪表板中导入项目
3. 配置环境变量（见下方）
4. 点击 Deploy

### 6. 配置 Vercel 环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL 连接字符串 |
| `JWT_SECRET` | 随机字符串（>32字符） | JWT 访问令牌密钥 |
| `JWT_REFRESH_SECRET` | 随机字符串（>32字符） | JWT 刷新令牌密钥 |
| `CRON_SECRET` | 随机字符串（可选） | Cron 任务认证密钥 |

**生成随机密钥**：
```bash
# 使用 Node.js 生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7. 验证部署

访问以下 API 端点验证部署：

```bash
# 健康检查
curl https://your-app.vercel.app/api/health

# 登录测试
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 应该返回 accessToken 和 refreshToken
```

---

## 🔧 可选配置

### 启用 Cron 任务

Cron 任务配置已在 `vercel.json` 中预设：
- 每日凌晨 2 点执行备份任务

如需添加 CRON_SECRET 保护：
1. 在 Vercel 环境变量中添加 `CRON_SECRET`
2. Vercel 会自动在请求头中传递该密钥

### 配置自定义域名

1. 在 Vercel 项目设置 > Domains 中添加域名
2. 按照提示配置 DNS 记录
3. 等待 SSL 证书自动颁发

### 监控与日志

- **日志查看**：Vercel 仪表板 > Logs
- **性能监控**：Vercel Analytics（可选启用）
- **错误追踪**：推荐集成 Sentry（需额外配置）

---

## 📦 数据库管理

### 使用 Prisma Studio 管理数据

```bash
# 本地
npx prisma studio

# 生产环境（需要连接生产数据库）
DATABASE_URL="<production-url>" npx prisma studio
```

### 数据备份

```bash
# 导出数据
pg_dump -h <host> -U <user> -d <database> -F c -b -v -f backup.dump

# 恢复数据
pg_restore -h <host> -U <user> -d <database> -v backup.dump
```

---

## 🔒 安全建议

1. **修改默认密码**：部署后立即修改管理员密码
2. **环境变量**：确保所有密钥使用强随机字符串
3. **HTTPS**：Vercel 自动启用 HTTPS
4. **限流**：登录接口已内置限流（5 次/15 分钟）
5. **CORS**：根据需要在 Vercel 配置中添加 CORS 规则

---

## 📚 API 文档

### 核心接口

| 端点 | 方法 | 认证 | 说明 |
| --- | --- | --- | --- |
| `/api/health` | GET | ❌ | 健康检查 |
| `/api/auth/login` | POST | ❌ | 用户登录 |
| `/api/auth/refresh` | POST | ❌ | 刷新 Token |
| `/api/customers` | GET/POST | ✅ | 客户列表/创建 |
| `/api/customers/:id` | GET/PUT/DELETE | ✅ | 客户详情/更新/删除 |
| `/api/visits` | GET/POST | ✅ | 回访记录列表/创建 |
| `/api/visits/:id` | GET/PUT/DELETE | ✅ | 回访记录详情/更新/删除 |
| `/api/products` | GET/POST | ✅ | 产品订单列表/创建 |
| `/api/products/:id` | GET/PUT/DELETE | ✅ | 产品订单详情/更新/删除 |
| `/api/products/statistics/summary` | GET | ✅ | 产品销售统计 |
| `/api/dashboard/statistics` | GET | ✅ | 仪表盘统计数据 |
| `/api/presets/customer-categories` | GET/POST | ✅ | 客户分类预设 |
| `/api/presets/customer-categories/:id` | GET/PUT/DELETE | ✅ | 客户分类详情 |

### 认证方式

所有需要认证的接口使用 Bearer Token：

```bash
curl -H "Authorization: Bearer <your-access-token>" \
  https://your-app.vercel.app/api/customers
```

---

## 🐛 常见问题

### Q1: 数据库连接失败
**A**: 检查 `DATABASE_URL` 格式是否正确，确保数据库允许外部连接

### Q2: 迁移失败
**A**: 确保数据库为空或使用 `npx prisma migrate reset` 重置

### Q3: Token 过期
**A**: 访问令牌有效期 15 分钟，使用刷新令牌获取新的访问令牌

### Q4: CORS 错误
**A**: 在 Vercel 配置中添加 CORS 头或使用 API 代理

---

## 📞 技术支持

如需帮助，请参考：
- [Vercel 文档](https://vercel.com/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [项目开发文档](./DEVELOPMENT.md)

---

**最后更新**：2024-11-06  
**维护人**：AI Agent
