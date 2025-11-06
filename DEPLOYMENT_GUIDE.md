# AI-CRM Serverless 部署指南

> **项目状态**：Phase 2 已完成，可进行开发环境测试和部署预览  
> **最后更新**：2024-11-06

---

## 📋 前置要求

在部署之前，请确保您具备以下条件：

1. **Node.js 环境**：Node.js >= 18.17.0, npm >= 9.0.0
2. **Vercel 账号**：[注册 Vercel](https://vercel.com/signup)（免费）
3. **PostgreSQL 数据库**：
   - 选项A：[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)（推荐，免费）
   - 选项B：[Supabase](https://supabase.com/)（免费）
   - 选项C：[Neon](https://neon.tech/)（免费）
   - 选项D：自建 PostgreSQL

---

## 🚀 快速部署（Vercel + Vercel Postgres）

### 步骤 1：克隆或下载项目

```bash
# 如果项目在 Git 仓库
git clone <your-repo-url>
cd ai-crm-serverless

# 或者直接在当前目录
cd /home/engine/project
```

### 步骤 2：安装依赖

```bash
npm install
```

### 步骤 3：设置 Vercel 项目

#### 3.1 安装 Vercel CLI（如果尚未安装）

```bash
npm install -g vercel
```

#### 3.2 登录 Vercel

```bash
vercel login
```

#### 3.3 创建并链接项目

```bash
vercel
```

首次运行会询问：
- Set up and deploy? → **Y**
- Which scope? → 选择您的账户
- Link to existing project? → **N**
- Project name? → `ai-crm-serverless`（或自定义名称）
- In which directory? → `.`（当前目录）
- Modify settings? → **N**

### 步骤 4：创建 Vercel Postgres 数据库

#### 4.1 在 Vercel Dashboard 创建数据库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 点击 **Storage** 标签
4. 点击 **Create Database**
5. 选择 **Postgres**
6. 选择区域（推荐选择离您最近的区域）
7. 点击 **Create**

#### 4.2 连接数据库到项目

1. 在 Postgres 数据库页面，点击 **Connect Project**
2. 选择您的项目 `ai-crm-serverless`
3. 点击 **Connect**

这会自动将 `DATABASE_URL` 等环境变量添加到您的项目中。

### 步骤 5：设置环境变量

在 Vercel Dashboard 中设置以下环境变量：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | (自动设置) | 数据库连接字符串 |
| `JWT_SECRET` | `your-secure-random-secret` | JWT 访问令牌密钥（至少32字符） |
| `JWT_REFRESH_SECRET` | `your-secure-refresh-secret` | JWT 刷新令牌密钥（至少32字符） |

**生成安全密钥**：
```bash
# Linux/Mac
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 步骤 6：运行数据库迁移和初始化

#### 6.1 拉取环境变量到本地

```bash
vercel env pull .env.local
```

#### 6.2 运行 Prisma 迁移

```bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库表结构
npx prisma db push

# 插入初始数据（管理员账户和预设数据）
npx prisma db seed
```

**默认管理员账户**：
- 用户名：`admin`
- 密码：`admin123`

⚠️ **安全提示**：生产环境请立即修改默认密码！

### 步骤 7：部署到 Vercel

```bash
# 部署到生产环境
vercel --prod
```

部署完成后，Vercel 会返回您的项目 URL，例如：
```
https://ai-crm-serverless.vercel.app
```

---

## 🧪 本地开发和测试

### 启动本地开发服务器

```bash
# 方式1：使用 Vercel Dev（推荐）
vercel dev

# 方式2：使用 Next.js Dev
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm test -- --coverage

# Watch 模式（开发时）
npx vitest watch
```

### 查看数据库（Prisma Studio）

```bash
npx prisma studio
```

浏览器会自动打开 Prisma Studio，您可以可视化查看和编辑数据库数据。

---

## 🔍 验证部署

### 1. 测试健康检查接口

```bash
curl https://your-app.vercel.app/api/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-11-06T12:34:56.789Z"
}
```

### 2. 测试登录接口

```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

预期响应：
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "manager": {
    "id": 1,
    "username": "admin",
    "displayName": "系统管理员"
  }
}
```

### 3. 测试认证保护的接口

```bash
# 使用上一步获得的 accessToken
curl -X GET "https://your-app.vercel.app/api/customers" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📊 已实现的 API 接口

### 认证接口
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新令牌

### 客户管理
- `GET /api/customers` - 获取客户列表（分页、搜索、过滤）
- `POST /api/customers` - 创建客户
- `GET /api/customers/:id` - 获取客户详情
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户

### 回访记录
- `GET /api/visits` - 获取回访列表（分页、按客户过滤）
- `POST /api/visits` - 创建回访记录
- `GET /api/visits/:id` - 获取回访详情
- `PUT /api/visits/:id` - 更新回访记录
- `DELETE /api/visits/:id` - 删除回访记录

### 产品订单
- `GET /api/products` - 获取订单列表（分页、按客户过滤）
- `POST /api/products` - 创建产品订单
- `GET /api/products/:id` - 获取订单详情
- `PUT /api/products/:id` - 更新订单
- `DELETE /api/products/:id` - 删除订单
- `GET /api/products/statistics/summary` - 销售统计

### 健康检查
- `GET /api/health` - 健康检查

---

## 🔐 安全建议

### 生产环境必做：

1. **修改默认密码**
   ```bash
   curl -X POST https://your-app.vercel.app/api/managers/change-password \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "currentPassword": "admin123",
       "newPassword": "YOUR_STRONG_PASSWORD"
     }'
   ```

2. **使用强随机 JWT 密钥**
   - 至少 32 字符
   - 包含大小写字母、数字和特殊字符
   - 不要使用默认值或简单字符串

3. **启用 HTTPS**（Vercel 自动提供）

4. **限制 CORS**（如果需要前端访问）
   - 在 `vercel.json` 中配置允许的来源

5. **定期更新依赖**
   ```bash
   npm audit
   npm audit fix
   ```

---

## 📱 使用 Postman 测试

### 导入 Postman Collection（待完成）

我们将在 Phase 1 完成后提供完整的 Postman Collection。

### 手动测试步骤

1. **登录获取 Token**
   - Method: `POST`
   - URL: `https://your-app.vercel.app/api/auth/login`
   - Body (JSON):
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```
   - 复制返回的 `accessToken`

2. **创建客户**
   - Method: `POST`
   - URL: `https://your-app.vercel.app/api/customers`
   - Headers:
     - `Authorization: Bearer YOUR_ACCESS_TOKEN`
     - `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "name": "张三",
       "phone": "13800138000",
       "email": "zhangsan@example.com",
       "company": "测试公司"
     }
     ```

3. **查询客户列表**
   - Method: `GET`
   - URL: `https://your-app.vercel.app/api/customers?page=1&limit=20`
   - Headers:
     - `Authorization: Bearer YOUR_ACCESS_TOKEN`

4. **创建回访记录**
   - Method: `POST`
   - URL: `https://your-app.vercel.app/api/visits`
   - Headers:
     - `Authorization: Bearer YOUR_ACCESS_TOKEN`
     - `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "customerId": 1,
       "visitTime": "2024-06-01T10:00:00Z",
       "content": "电话回访，了解客户需求"
     }
     ```

5. **创建产品订单**
   - Method: `POST`
   - URL: `https://your-app.vercel.app/api/products`
   - Headers:
     - `Authorization: Bearer YOUR_ACCESS_TOKEN`
     - `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "customerId": 1,
       "productName": "保湿滋养面霜",
       "quantity": 5,
       "price": 298.50,
       "purchaseDate": "2024-04-01"
     }
     ```

6. **查看销售统计**
   - Method: `GET`
   - URL: `https://your-app.vercel.app/api/products/statistics/summary`
   - Headers:
     - `Authorization: Bearer YOUR_ACCESS_TOKEN`

---

## 🐛 常见问题

### Q1: 数据库连接失败

**症状**：`Error: P1001: Can't reach database server`

**解决方案**：
1. 检查 `DATABASE_URL` 环境变量是否正确设置
2. 确保数据库实例正在运行
3. 检查网络连接和防火墙设置
4. 在 Vercel 项目设置中验证环境变量

### Q2: JWT 验证失败

**症状**：`401 Unauthorized - Invalid or expired access token`

**解决方案**：
1. 检查 `JWT_SECRET` 环境变量是否设置
2. 确保本地和生产环境使用相同的密钥
3. Token 可能已过期（15分钟），使用 refresh token 更新
4. 检查 Authorization header 格式：`Bearer YOUR_TOKEN`

### Q3: Prisma Client 错误

**症状**：`@prisma/client did not initialize yet`

**解决方案**：
```bash
# 重新生成 Prisma Client
npx prisma generate

# 重新部署
vercel --prod
```

### Q4: 测试失败

**症状**：部分测试用例失败

**解决方案**：
```bash
# 确保依赖已安装
npm install

# 清除缓存重新测试
npx vitest --clearCache
npm test
```

---

## 📈 监控和日志

### Vercel 日志查看

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 点击 **Deployments** 查看部署历史
4. 点击具体部署 → **Logs** 查看实时日志

### 设置错误监控（可选）

推荐集成 [Sentry](https://sentry.io/)：

1. 注册 Sentry 账号
2. 创建新项目
3. 获取 DSN
4. 在 Vercel 环境变量中添加 `SENTRY_DSN`
5. 在代码中集成 Sentry SDK（Phase 7 将实现）

---

## 🎯 下一步：完整功能开发

当前项目进度：**35%**（Phase 2 完成）

**剩余开发任务**：

- ⬜ **Phase 3**：仪表盘统计与提醒聚合
- ⬜ **Phase 4**：预设数据管理（客户分类、意向等级等）
- ⬜ **Phase 5**：用户设置与数据维护（备份、恢复、清空）
- ⬜ **Phase 6**：前端开发（HTML + JavaScript）
- ⬜ **Phase 7**：部署优化与监控

---

## 📞 技术支持

如果您在部署过程中遇到问题：

1. 查看本文档的 **常见问题** 部分
2. 查看项目根目录的 `DEVELOPMENT.md`
3. 查看 Vercel 官方文档：https://vercel.com/docs
4. 查看 Prisma 官方文档：https://www.prisma.io/docs

---

## 📝 变更日志

- **2024-11-06**：创建部署指南，覆盖 Phase 0-2 功能
- 后续版本将持续更新

---

**祝您部署顺利！🎉**
