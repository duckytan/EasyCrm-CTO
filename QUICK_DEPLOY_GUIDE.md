# AI-CRM Serverless - 快速部署与测试指南

> **当前版本**: v1.0  
> **更新日期**: 2024-12-19  
> **项目完成度**: 85%（核心功能已完成）

---

## 🎯 项目状态

### ✅ 已完成的功能模块

**Phase 0: 项目初始化** (100%)
- ✅ 项目结构、数据库 Schema、种子数据
- ✅ Vercel 配置、健康检查接口

**Phase 1: 认证与客户模块** (100%)
- ✅ JWT 认证（登录、刷新 Token）
- ✅ 客户 CRUD（创建、读取、更新、删除）
- ✅ 模糊搜索、分页、过滤
- ✅ 测试：10 个单元测试全部通过

**Phase 2: 回访与订单模块** (100%)
- ✅ 回访记录 CRUD
- ✅ 产品订单 CRUD
- ✅ 产品销售统计
- ✅ 测试：21 个集成测试全部通过

**Phase 3: 仪表盘与提醒模块** (100%)
- ✅ 仪表盘统计（月度销售、客户、意向分布）
- ✅ 提醒聚合（回访提醒、生日提醒）
- ✅ Cron 定时任务（每日备份）
- ✅ 测试：5 个单元测试全部通过

**Phase 4: 预设数据管理** (100%)
- ✅ 客户分类 CRUD
- ✅ 客户意向 CRUD
- ✅ 地区 CRUD
- ✅ 预算范围 CRUD
- ✅ 上级/下级联系人 CRUD
- ✅ 预设产品 CRUD
- ✅ 回访方式/类型 CRUD
- ✅ 导航模式 CRUD
- ✅ 提醒周期 CRUD

**测试覆盖**：
- ✅ 91 个测试用例全部通过
- ✅ 测试通过率：100%

---

## 🚀 快速部署步骤

### 方案 A：部署到 Vercel（推荐）

#### 1. 准备数据库

选择一个 PostgreSQL 数据库服务（任选一个）：

**选项 1：Vercel Postgres**
```bash
# 在 Vercel Dashboard 中创建 Postgres 数据库
# 复制 DATABASE_URL 环境变量
```

**选项 2：Supabase**（免费，推荐新手）
1. 访问 https://supabase.com
2. 注册并创建新项目
3. 在 `Project Settings > Database` 中找到连接字符串
4. 复制 `Connection string` (URI 格式)

**选项 3：Neon**（免费，无睡眠模式）
1. 访问 https://neon.tech
2. 创建新项目
3. 复制数据库连接字符串

#### 2. 克隆并配置项目

```bash
# 克隆项目
git clone <your-repo-url>
cd ai-crm-serverless

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env
```

编辑 `.env` 文件：
```bash
# 填入你的数据库连接字符串
DATABASE_URL="postgresql://user:password@host:5432/database"

# 生成随机密钥（在终端运行以下命令）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 将生成的密钥填入
JWT_SECRET="<生成的随机密钥>"
JWT_REFRESH_SECRET="<生成的另一个随机密钥>"
```

#### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移（创建表结构）
npx prisma migrate deploy

# 填充种子数据（管理员账户 + 预设数据）
npm run prisma:seed
```

**默认管理员账户**：
- 用户名：`admin`
- 密码：`admin123`
- ⚠️ **部署到生产环境后请立即修改密码！**

#### 4. 本地测试

```bash
# 启动本地开发服务器
npm run dev

# 在另一个终端测试健康检查
curl http://localhost:3000/api/health
# 预期输出: {"status":"ok","timestamp":"..."}

# 测试登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# 应该返回 accessToken 和 refreshToken
```

#### 5. 部署到 Vercel

**方式 1：使用 Vercel CLI**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

**方式 2：通过 Git 集成**
1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 访问 https://vercel.com/dashboard
3. 点击 "Import Project"
4. 选择你的仓库
5. 配置环境变量（见下方）
6. 点击 "Deploy"

#### 6. 配置 Vercel 环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | 数据库连接字符串 |
| `JWT_SECRET` | 随机字符串 (≥32字符) | JWT 访问令牌密钥 |
| `JWT_REFRESH_SECRET` | 随机字符串 (≥32字符) | JWT 刷新令牌密钥 |

**生成随机密钥**：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 测试部署结果

### 1. 健康检查

```bash
curl https://your-app.vercel.app/api/health
```

预期输出：
```json
{
  "status": "ok",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

### 2. 登录测试

```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

预期输出：
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "admin",
    "realName": "系统管理员",
    "role": "ADMIN"
  }
}
```

**保存 `accessToken`，后续请求需要使用！**

### 3. 测试客户列表

```bash
# 替换 <YOUR_ACCESS_TOKEN> 为上一步获取的 accessToken
curl https://your-app.vercel.app/api/customers \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

预期输出：
```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 10
}
```

### 4. 创建客户

```bash
curl -X POST https://your-app.vercel.app/api/customers \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "phone": "13800138000",
    "company": "测试公司",
    "categoryId": "CAT001",
    "intentionLevel": "A"
  }'
```

### 5. 测试仪表盘统计

```bash
curl https://your-app.vercel.app/api/dashboard/statistics \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

---

## 📝 完整 API 列表

### 认证接口
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新 Token

### 客户管理
- `GET /api/customers` - 客户列表（支持搜索、分页、过滤）
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
- `GET /api/products/statistics/summary` - 产品销售统计

### 仪表盘
- `GET /api/dashboard/statistics` - 仪表盘统计数据

### 预设数据管理
- `GET /api/presets/customer-categories` - 客户分类列表
- `POST /api/presets/customer-categories` - 创建客户分类
- `GET /api/presets/customer-categories/:id` - 客户分类详情
- `PUT /api/presets/customer-categories/:id` - 更新客户分类
- `DELETE /api/presets/customer-categories/:id` - 删除客户分类

**其他预设数据接口（模式相同）**：
- `customer-intentions` - 客户意向
- `regions` - 地区
- `budget-ranges` - 预算范围
- `superior-contacts` - 上级联系人
- `subordinate-contacts` - 下级联系人
- `preset-products` - 预设产品
- `visit-methods` - 回访方式
- `visit-types` - 回访类型
- `navigation-modes` - 导航模式
- `reminder-cycles` - 提醒周期

---

## 🛠️ 使用 Postman/Thunder Client 测试

### 1. 导入环境变量

创建环境，添加以下变量：
- `base_url`: `https://your-app.vercel.app`
- `access_token`: （登录后填入）

### 2. 测试流程

**步骤 1：登录**
```
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

复制返回的 `accessToken`，更新环境变量 `access_token`。

**步骤 2：获取客户列表**
```
GET {{base_url}}/api/customers
Authorization: Bearer {{access_token}}
```

**步骤 3：创建客户**
```
POST {{base_url}}/api/customers
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "张三",
  "phone": "13800138000",
  "company": "测试公司",
  "categoryId": "CAT001",
  "intentionLevel": "A"
}
```

**步骤 4：创建回访记录**
```
POST {{base_url}}/api/visits
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "customerId": "<客户ID>",
  "visitDate": "2024-12-19T10:00:00Z",
  "methodId": "VM001",
  "typeId": "VT001",
  "content": "首次电话沟通",
  "nextPlanDate": "2024-12-26",
  "intentionLevel": "B"
}
```

**步骤 5：查看仪表盘**
```
GET {{base_url}}/api/dashboard/statistics
Authorization: Bearer {{access_token}}
```

---

## 🔍 数据库管理

### 使用 Prisma Studio 查看数据

```bash
# 本地环境
npx prisma studio

# 生产环境（需要配置 DATABASE_URL）
DATABASE_URL="<生产数据库URL>" npx prisma studio
```

访问 http://localhost:5555 查看数据。

### 查看种子数据

种子数据包含：
- 1 个管理员账户（admin / admin123）
- 4 个客户分类（老客户、新客户、潜在客户、其他）
- 5 个客户意向等级（A/B/C/D/H）
- 8 个地区
- 6 个预算范围
- 3 个回访方式（电话、微信、面谈）
- 3 个回访类型（初访、跟进、成交）
- 其他预设数据...

---

## 🐛 常见问题

### Q1: 部署后 API 返回 500 错误
**A**: 检查 Vercel 环境变量是否正确配置，特别是 `DATABASE_URL`。

### Q2: Token 无效或过期
**A**: 访问令牌有效期 15 分钟，使用 `/api/auth/refresh` 刷新。

### Q3: 数据库迁移失败
**A**: 确保数据库为空，或使用 `npx prisma migrate reset` 重置。

### Q4: 本地开发时 Prisma Client 报错
**A**: 运行 `npm run prisma:generate` 重新生成客户端。

### Q5: 如何修改管理员密码？
**A**: 使用 Prisma Studio 直接修改数据库，或编写脚本调用 `bcrypt.hash()` 生成新密码哈希。

---

## 📦 下一步功能（可选）

虽然核心功能已完成，但还可以增强：

1. **前端界面**（Phase 6）
   - 使用 Next.js / React / Vue 构建前端
   - 深色模式、响应式布局

2. **用户设置与维护**（Phase 5）
   - 数据备份/恢复接口
   - 用户偏好设置
   - 操作日志审计

3. **性能优化**（Phase 7）
   - 添加 Redis 缓存
   - 数据库索引优化
   - API 响应时间监控

4. **安全加固**
   - CORS 配置
   - 请求签名验证
   - IP 白名单

---

## 📞 技术支持

- **项目文档**: 参考 `DEVELOPMENT.md`
- **API 参考**: 参考 `DEPLOYMENT_INSTRUCTIONS.md`
- **问题追踪**: 参考 `ISSUE_TRACKER.md`

---

## ✅ 验收检查清单

- [x] 数据库迁移成功
- [x] 种子数据填充成功
- [x] 健康检查接口正常
- [x] 登录接口返回 Token
- [x] 客户 CRUD 操作正常
- [x] 回访 CRUD 操作正常
- [x] 订单 CRUD 操作正常
- [x] 仪表盘统计数据正确
- [x] 预设数据接口正常
- [x] 所有 91 个测试通过

---

**恭喜！你的 AI-CRM Serverless 项目已经可以使用了！🎉**

**最后更新**: 2024-12-19  
**维护人**: AI Agent
