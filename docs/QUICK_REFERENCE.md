# 📄 Vercel 部署快速参考卡

> **一页纸搞定 Vercel 部署** - 适合已经了解基础知识的用户快速查阅

---

## 🎯 三步部署法

```bash
# 1️⃣ 准备数据库（获取 DATABASE_URL）
# 推荐：Supabase.com → New Project → 复制连接字符串

# 2️⃣ 生成密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_REFRESH_SECRET

# 3️⃣ 部署到 Vercel
vercel                    # 首次部署
vercel --prod            # 部署到生产环境
```

---

## 🔧 环境变量配置

在 Vercel Dashboard → Settings → Environment Variables 添加：

| 变量名 | 如何获取 | 示例 |
|--------|---------|------|
| `DATABASE_URL` | Supabase/Neon 连接字符串 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | `node -e "console.log(crypto.randomBytes(32).toString('hex'))"` | `a3f8b2...` |
| `JWT_REFRESH_SECRET` | 同上（生成另一个） | `e7d1c9...` |

**重要**：所有环境都要勾选（Production, Preview, Development）

---

## 💾 数据库初始化

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npm run prisma:generate

# 创建表结构
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# 填充初始数据（创建 admin 账号）
DATABASE_URL="postgresql://..." npm run prisma:seed
```

---

## 🧪 快速测试

```bash
# 健康检查
curl https://你的域名.vercel.app/api/health

# 登录测试（默认账号：admin / admin123）
curl -X POST https://你的域名.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 📱 常用命令

### Vercel CLI
```bash
vercel login              # 登录 Vercel
vercel                    # 部署到预览环境
vercel --prod             # 部署到生产环境
vercel env pull           # 拉取环境变量到本地
vercel logs               # 查看部署日志
vercel domains            # 管理域名
vercel rollback           # 回滚到上一个版本
```

### Git 操作
```bash
git add .
git commit -m "描述"
git push                  # 推送后 Vercel 自动部署
```

### Prisma 数据库
```bash
npx prisma studio         # 打开数据库可视化界面
npx prisma migrate dev    # 本地开发迁移
npx prisma migrate deploy # 生产环境迁移
npm run prisma:seed       # 填充种子数据
```

---

## 🚨 常见错误速查

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `DATABASE_URL not found` | 环境变量未配置 | 在 Vercel 添加环境变量 |
| `JWT secret not provided` | JWT 密钥未配置 | 添加 JWT_SECRET 环境变量 |
| `Connection refused` | 数据库连接失败 | 检查 DATABASE_URL 格式 |
| `P1001: Can't reach database` | 数据库未启动 | 检查数据库服务状态 |
| `Table not found` | 数据库未初始化 | 运行 `prisma migrate deploy` |
| `Invalid username or password` | 数据库无种子数据 | 运行 `prisma:seed` |

---

## 📊 项目 URL 结构

```
https://你的项目名.vercel.app/
├── /                          # 前端首页（登录页）
├── /dashboard.html            # 仪表盘
├── /customers.html            # 客户列表
├── /visits.html              # 回访记录
├── /products.html            # 产品订单
├── /settings.html            # 系统设置
└── /api/
    ├── /health               # 健康检查
    ├── /auth/login           # 登录
    ├── /auth/refresh         # 刷新令牌
    ├── /customers            # 客户管理
    ├── /visits               # 回访管理
    ├── /products             # 产品管理
    ├── /dashboard/statistics # 统计数据
    └── /presets/*            # 预设数据（11个模块）
```

---

## 🎨 默认账号

- **用户名**：`admin`
- **密码**：`admin123`
- ⚠️ **首要任务**：登录后立即修改密码！

---

## 🔗 快速链接

- **Vercel Dashboard**：https://vercel.com/dashboard
- **Supabase Dashboard**：https://app.supabase.com
- **Neon Dashboard**：https://console.neon.tech
- **GitHub Repo**：https://github.com/你的用户名/你的仓库名

---

## 📚 完整文档

- 🚀 [小白快速部署](VERCEL_QUICK_START.md) - 手把手 30 分钟教程
- ✅ [部署检查清单](DEPLOYMENT_CHECKLIST.md) - 追踪部署进度
- 📖 [详细部署教程](Vercel部署详细教程.md) - 零基础图文指南
- 🛠️ [部署指南](DEPLOYMENT.md) - 技术细节和最佳实践

---

## ⚡ 一键复制命令

### 完整部署流程

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 初始化项目
cd /path/to/your/project
npm install
npm run prisma:generate

# 4. 初始化生产数据库（替换为你的 DATABASE_URL）
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
npm run prisma:seed

# 5. 部署到生产环境
vercel --prod

# 6. 测试
curl https://你的域名.vercel.app/api/health
```

---

**💡 提示**：把这个页面加入书签，方便随时查阅！
