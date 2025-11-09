# AI-CRM Serverless 部署指南

> 该指南涵盖本地验证、Vercel 部署、生产数据库初始化以及常见问题排查。
> 如果你对 Vercel 完全陌生并希望获取更细致的图文步骤，请参考《[Vercel 部署详细教程](./Vercel部署详细教程.md)》。

---

## 1. 环境要求

| 项目 | 说明 |
| --- | --- |
| Node.js | 18.17.0 或更高版本 |
| npm | 9.x 或更高版本 |
| Vercel CLI | `npm i -g vercel` |
| 数据库 | PostgreSQL（Supabase / Neon / Vercel Postgres / 自建均可） |
| 代码仓库 | `git clone <your-repo-url>` |

### 推荐的数据库服务
- **Supabase**：免费层、国内可访问、连接字符串格式 `postgresql://user:password@host:port/database`
- **Neon**：按需扩容，自动暂停，适合低成本环境
- **Vercel Postgres**：与 Vercel 项目深度集成，环境变量自动注入

准备好以下信息：
- `DATABASE_URL`（PostgreSQL 连接字符串）
- `JWT_SECRET` 与 `JWT_REFRESH_SECRET`（32 字节以上随机字符串）

生成随机密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. 本地验证

### 2.1 安装依赖
```bash
npm install
```

### 2.2 配置环境变量
```bash
cp .env.example .env
# 编辑 .env，填入 DATABASE_URL/JWT_SECRET/JWT_REFRESH_SECRET
```

### 2.3 初始化数据库
```bash
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
```

> 种子脚本会创建管理员账号 `admin / admin123` 以及 11 类预设数据。

### 2.4 运行与测试
```bash
# 启动本地开发服务
npm run dev

# 运行测试套件
npm test
```

### 2.5 快速接口验证
```bash
# 健康检查
curl http://localhost:3000/api/health

# 登录获取 token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 3. 部署到 Vercel

### 3.1 创建项目
```bash
vercel login               # 首次使用需要登录
vercel                     # 互动式配置（选择新项目）
```

按照 CLI 提示完成：
1. 选择账户或团队
2. 项目名称（如 `ai-crm-serverless`）
3. 部署目录 `.`
4. 其他选项使用默认值

### 3.2 配置环境变量
在 Vercel Dashboard → *Settings → Environment Variables* 中添加：

| 名称 | 值 | 作用 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL 连接字符串 | 连接生产数据库 |
| `JWT_SECRET` | 随机字符串（>=32 字符） | 签发访问令牌 |
| `JWT_REFRESH_SECRET` | 随机字符串（>=32 字符） | 签发刷新令牌 |
| `CRON_SECRET` *(可选)* | 随机字符串 | 保护定时任务 |

> 如果使用 Vercel Postgres，可在 Storage 页面点击 “Connect Project” 自动写入 `DATABASE_URL`。

### 3.3 拉取环境变量到本地（可选）
```bash
vercel env pull .env.production
```

### 3.4 初始化生产数据库
```bash
# 生成 Prisma Client
npx prisma generate

# 创建表结构（使用生产库）
DATABASE_URL="<prod-url>" npx prisma migrate deploy

# 填充种子数据
DATABASE_URL="<prod-url>" npm run prisma:seed
```

### 3.5 发布
```bash
vercel --prod
```

部署完成后将得到生产 URL，例如 `https://ai-crm-serverless.vercel.app`。

---

## 4. 上线验证清单

| 检查项 | 命令 / 方式 | 预期结果 |
| --- | --- | --- |
| 健康检查 | `curl https://your-app/api/health` | `{"status":"ok"}` |
| 登录接口 | `POST /api/auth/login` | 返回 accessToken/refreshToken |
| 客户列表 | `GET /api/customers` (携带 Bearer Token) | 200 + 分页数据 |
| 回访列表 | `GET /api/visits` | 200 + 数据列表 |
| 仪表盘 | `GET /api/dashboard/statistics` | 200 + 汇总数据 |
| 预设数据 | `GET /api/presets/customer-categories` | 200 + 预设项 |
| 管理员登录 | 使用 `admin/admin123` | 登录成功后立即修改密码 |

---

## 5. 安全与运维建议

1. **修改默认密码**：部署后第一时间调用 `POST /api/managers/change-password`
2. **保护密钥**：环境变量仅在 Vercel 控制台维护，不进入代码仓库
3. **启用 HTTPS**：Vercel 默认为所有域名提供 TLS
4. **监控日志**：Vercel Dashboard → Deployments → Logs
5. **定期备份**：使用 `pg_dump` 或服务商提供的备份功能
6. **审计定时任务**：`vercel.json` 中的定时任务需要 `CRON_SECRET` 验证
7. **依赖更新**：定期运行 `npm audit` 和 `npm update`

---

## 6. API 概览

### 认证
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### 客户管理
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/:id`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

### 回访记录
- `GET /api/visits`
- `POST /api/visits`
- `GET /api/visits/:id`
- `PUT /api/visits/:id`
- `DELETE /api/visits/:id`

### 产品订单
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/products/statistics/summary`

### 仪表盘与提醒
- `GET /api/dashboard/statistics`
- `GET /api/reminders/pending`

### 预设数据（共 11 类）
- `GET /api/presets/<resource>`
- `POST /api/presets/<resource>`
- `GET /api/presets/<resource>/:id`
- `PUT /api/presets/<resource>/:id`
- `DELETE /api/presets/<resource>/:id`

> `<resource>` 包括：`customer-categories`、`customer-intentions`、`regions`、`budget-ranges`、`superior-contacts`、`subordinate-contacts`、`preset-products`、`visit-methods`、`visit-types`、`navigation-modes`、`reminder-cycles`。

---

## 7. 常见问题排查

| 场景 | 可能原因 | 解决方案 |
| --- | --- | --- |
| `P1001: Can't reach database server` | 连接字符串错误、数据库未运行、防火墙限制 | 检查 `DATABASE_URL`、确认数据库可访问 |
| 登录 401 | 种子数据未执行或密码错误 | 重新运行 `npm run prisma:seed` |
| Token 过期后 401 | 未传递刷新令牌或刷新失败 | 确保前端调用 `POST /api/auth/refresh` 并更新 Token |
| `@prisma/client` 未初始化 | 未执行 `prisma generate` | 运行 `npx prisma generate` 并重新部署 |
| Service Worker 未更新 | 新版本未激活 | 关闭所有标签页或执行 `skipWaiting` 消息 |
| CLI 部署卡住 | Vercel CLI 版本过旧或网络问题 | 升级 CLI (`npm i -g vercel@latest`) 或使用 Dashboard 部署 |

---

## 8. 附录

### 8.1 默认账户
- 用户名：`admin`
- 密码：`admin123`
> 生产环境请立即修改密码。

### 8.2 常用命令速查
```bash
# 查看日志
overcel logs <deployment-url>

# 退回上一个部署
overcel rollback

# 本地模拟 Vercel 环境
overcel dev
```

### 8.3 关键信息速览
- 代码分支：`main`（生产） / 功能分支
- 部署环境：Vercel Serverless Functions
- 数据库：PostgreSQL（托管服务）
- 缓存：Service Worker + 浏览器缓存（前端）
- 测试覆盖：Vitest + Supertest，91/91 用例通过

---

**最后更新**：2024-12-19  
**维护人**：AI Agent
