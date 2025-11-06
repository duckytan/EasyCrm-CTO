# 🚀 AI-CRM Serverless - 立即部署指南

> **项目状态**: ✅ 核心功能已完成，可直接部署使用  
> **完成度**: 85% (所有后端 API 已完成)  
> **测试状态**: ✅ 91/91 测试通过

---

## 📊 项目完成情况

### ✅ 已完成的功能模块

| 模块 | 功能 | 状态 | API 端点数 |
|------|------|------|-----------|
| **认证系统** | JWT 登录、刷新 Token | ✅ | 2 |
| **客户管理** | CRUD + 搜索/分页/过滤 | ✅ | 5 |
| **回访记录** | CRUD + 关联客户 | ✅ | 5 |
| **产品订单** | CRUD + 销售统计 | ✅ | 6 |
| **仪表盘** | 统计数据、提醒聚合 | ✅ | 1 |
| **预设数据** | 11个模块完整 CRUD | ✅ | 33+ |

**总计**：52+ 个 API 端点，91 个测试用例全部通过

---

## 🎯 5 分钟快速部署

### 前置要求

- Node.js 18+ 
- PostgreSQL 数据库（或使用云数据库）
- Vercel 账号（免费）

### 步骤 1：准备数据库

**推荐使用 Supabase（免费）**：
1. 访问 https://supabase.com 并注册
2. 创建新项目
3. 进入 `Project Settings > Database`
4. 复制 `Connection string` (URI format)

**其他选择**：
- Vercel Postgres
- Neon (https://neon.tech)
- Railway (https://railway.app)

### 步骤 2：本地配置

```bash
# 克隆项目
git clone <your-repo-url>
cd ai-crm-serverless

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env  # 或使用其他编辑器
```

编辑 `.env`：
```bash
# 数据库连接
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# 生成密钥（在终端运行）：
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_SECRET="在此粘贴生成的密钥1"
JWT_REFRESH_SECRET="在此粘贴生成的密钥2"
```

### 步骤 3：初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npx prisma migrate deploy

# 填充种子数据（管理员账户 + 预设数据）
npm run prisma:seed
```

**默认管理员**：
- 用户名：`admin`
- 密码：`admin123`

### 步骤 4：本地测试

```bash
# 启动开发服务器
npm run dev

# 在新终端测试
./test-api.sh http://localhost:3000
```

如果看到 "🎉 所有测试通过！" 表示配置正确！

### 步骤 5：部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

**在 Vercel Dashboard 配置环境变量**：
1. 进入项目 Settings > Environment Variables
2. 添加：
   - `DATABASE_URL`: 你的数据库连接字符串
   - `JWT_SECRET`: JWT 密钥
   - `JWT_REFRESH_SECRET`: JWT 刷新密钥

### 步骤 6：测试部署

```bash
# 替换为你的 Vercel 域名
./test-api.sh https://your-app.vercel.app
```

---

## 📝 使用 Postman 测试

1. 导入 `AI-CRM-Postman-Collection.json`
2. 修改环境变量 `base_url` 为你的部署 URL
3. 运行 "登录" 请求（自动保存 Token）
4. 测试其他接口

---

## 🔍 核心 API 示例

### 1. 登录获取 Token

```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

响应：
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### 2. 创建客户

```bash
curl -X POST https://your-app.vercel.app/api/customers \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "phone": "13800138000",
    "company": "测试公司",
    "categoryId": "CAT001",
    "intentionLevel": "A"
  }'
```

### 3. 获取仪表盘统计

```bash
curl https://your-app.vercel.app/api/dashboard/statistics \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

响应包含：
- 月度销售摘要（总额、订单数、平均订单）
- 客户统计（新增、回访次数、成交客户）
- 意向分布（A/B/C/D/H 级客户数量）
- 提醒列表（回访提醒、生日提醒）

---

## 📚 完整 API 文档

### 认证接口
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新 Token

### 客户管理
- `GET /api/customers` - 列表（支持 `search`, `categoryId`, `intentionLevel` 过滤）
- `POST /api/customers` - 创建
- `GET /api/customers/:id` - 详情
- `PUT /api/customers/:id` - 更新
- `DELETE /api/customers/:id` - 删除

### 回访记录
- `GET /api/visits` - 列表
- `POST /api/visits` - 创建
- `GET /api/visits/:id` - 详情
- `PUT /api/visits/:id` - 更新
- `DELETE /api/visits/:id` - 删除

### 产品订单
- `GET /api/products` - 列表
- `POST /api/products` - 创建
- `GET /api/products/:id` - 详情
- `PUT /api/products/:id` - 更新
- `DELETE /api/products/:id` - 删除
- `GET /api/products/statistics/summary` - 销售统计

### 仪表盘
- `GET /api/dashboard/statistics` - 统计数据

### 预设数据（11 个模块，模式相同）
- `GET/POST /api/presets/customer-categories` - 客户分类
- `GET/POST /api/presets/customer-intentions` - 客户意向
- `GET/POST /api/presets/regions` - 地区
- `GET/POST /api/presets/budget-ranges` - 预算范围
- `GET/POST /api/presets/superior-contacts` - 上级联系人
- `GET/POST /api/presets/subordinate-contacts` - 下级联系人
- `GET/POST /api/presets/preset-products` - 预设产品
- `GET/POST /api/presets/visit-methods` - 回访方式
- `GET/POST /api/presets/visit-types` - 回访类型
- `GET/POST /api/presets/navigation-modes` - 导航模式
- `GET/POST /api/presets/reminder-cycles` - 提醒周期

每个预设数据模块都支持：
- `GET /:id` - 获取详情
- `PUT /:id` - 更新
- `DELETE /:id` - 删除（含引用检查）

---

## 🔒 安全特性

- ✅ JWT 认证（15 分钟有效期）
- ✅ 密码加密（bcrypt）
- ✅ 登录限流（5 次/15 分钟）
- ✅ 输入验证（Zod）
- ✅ SQL 注入防护（Prisma ORM）
- ✅ 环境变量隔离

---

## 🗄️ 数据库管理

### 查看数据（Prisma Studio）

```bash
# 本地
npx prisma studio

# 生产（需要配置 DATABASE_URL）
DATABASE_URL="<生产URL>" npx prisma studio
```

访问 http://localhost:5555

### 数据备份

```bash
# 导出
pg_dump <DATABASE_URL> > backup.sql

# 恢复
psql <DATABASE_URL> < backup.sql
```

---

## 🐛 常见问题

### Q1: 部署后 500 错误
检查 Vercel 环境变量是否正确配置，特别是 `DATABASE_URL`。

### Q2: 数据库连接失败
确认数据库允许外部连接，检查 IP 白名单设置。

### Q3: Token 无效
Access Token 有效期 15 分钟，使用 `/api/auth/refresh` 刷新。

### Q4: 种子数据填充失败
确保数据库为空，或使用 `npx prisma migrate reset` 重置。

### Q5: 测试失败
运行 `npm install` 确保依赖安装完整，然后运行 `npm test`。

---

## 📊 种子数据说明

运行 `npm run prisma:seed` 后会自动创建：

**管理员账户**：
- 用户名：admin
- 密码：admin123（⚠️ 生产环境请立即修改）

**预设数据**：
- 4 个客户分类（老客户、新客户、潜在客户、其他）
- 5 个意向等级（A/B/C/D/H）
- 8 个地区（北京、上海、广州等）
- 6 个预算范围
- 3 个回访方式（电话、微信、面谈）
- 3 个回访类型（初访、跟进、成交）
- 等等...

---

## 🎨 下一步：前端开发（可选）

后端 API 已完成，可以：

1. **使用现成的 Admin 模板**：
   - React Admin
   - Ant Design Pro
   - Refine

2. **自己开发前端**：
   - Next.js + Tailwind CSS
   - Vue 3 + Element Plus
   - React + Material-UI

3. **无代码工具**：
   - Retool
   - Appsmith
   - Budibase

---

## 📞 技术支持

- **部署指南**: `QUICK_DEPLOY_GUIDE.md`
- **开发文档**: `DEVELOPMENT.md`
- **API 参考**: `DEPLOYMENT_INSTRUCTIONS.md`
- **项目状态**: `PROJECT_STATUS.md`

---

## ✅ 验收清单

部署完成后，确认以下功能：

- [ ] 健康检查接口返回 200
- [ ] 登录接口返回 Token
- [ ] 创建客户成功
- [ ] 获取客户列表成功
- [ ] 创建回访记录成功
- [ ] 创建订单成功
- [ ] 仪表盘返回统计数据
- [ ] 所有预设数据接口正常

运行 `./test-api.sh <YOUR_URL>` 自动检查所有项目！

---

**🎉 恭喜！你的 AI-CRM 系统已准备就绪！**

立即部署并开始使用吧！

**最后更新**: 2024-12-19  
**版本**: v1.0
