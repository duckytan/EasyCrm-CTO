# Vercel 部署详细教程（零基础版）

> 本教程将手把手带你完成 AI-CRM Serverless 项目在 Vercel 平台的部署，从账号注册到生产环境验证，全流程详解。

---

## 📋 目录

1. [前置准备](#1-前置准备)
2. [数据库准备](#2-数据库准备)
3. [准备代码仓库](#3-准备代码仓库)
4. [部署方式选择](#4-部署方式选择)
5. [方式一：GitHub 自动部署（推荐）](#5-方式一github-自动部署推荐)
6. [方式二：CLI 手动部署](#6-方式二cli-手动部署)
7. [配置环境变量](#7-配置环境变量)
8. [初始化生产数据库](#8-初始化生产数据库)
9. [部署验证](#9-部署验证)
10. [域名配置（可选）](#10-域名配置可选)
11. [常见问题排查](#11-常见问题排查)
12. [生产环境最佳实践](#12-生产环境最佳实践)

---

## 1. 前置准备

### 1.1 注册 Vercel 账号

1. 访问 [Vercel 官网](https://vercel.com)
2. 点击右上角 "Sign Up" 按钮
3. **推荐**：选择 "Continue with GitHub" 使用 GitHub 账号登录
   - 这样后续可以直接从 GitHub 导入项目，实现自动部署
   - 如果没有 GitHub 账号，先去 [GitHub](https://github.com) 注册一个
4. 完成 Vercel 的首次配置向导

### 1.2 安装必要工具

```bash
# 检查 Node.js 版本（需要 18.17.0 或更高）
node -v

# 如果版本过低，请从 https://nodejs.org 下载最新 LTS 版本

# 安装 Vercel CLI（全局安装）
npm install -g vercel

# 验证安装
vercel --version
```

### 1.3 安装 Git

如果还没有安装 Git：

**Windows:**
- 下载 [Git for Windows](https://git-scm.com/download/win)
- 按默认选项安装

**Mac:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt-get install git  # Ubuntu/Debian
sudo yum install git      # CentOS/RHEL
```

---

## 2. 数据库准备

Vercel Serverless 需要一个云端的 PostgreSQL 数据库。以下是三个推荐选项：

### 选项 A：Supabase（推荐新手）

**优点**：免费层充足，国内访问稳定，界面友好

**步骤**：

1. 访问 [Supabase](https://supabase.com)
2. 点击 "Start your project"，使用 GitHub 账号登录
3. 创建新项目（Organization）：
   - Organization name：随意填写（如 `my-projects`）
4. 创建数据库项目：
   - Project name：`ai-crm-db`（或其他名称）
   - Database Password：设置一个强密码并**务必保存**
   - Region：选择 `Northeast Asia (Tokyo)` 或离你最近的区域
   - Pricing Plan：选择 "Free"
5. 等待约 2 分钟，数据库创建完成
6. 在项目首页点击左侧 "Project Settings" → "Database"
7. 找到 "Connection string" 部分，选择 "URI" 模式
8. 复制连接字符串（格式类似）：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
   - 将 `[YOUR-PASSWORD]` 替换为你第 4 步设置的密码
9. **保存这个连接字符串**，后续配置环境变量时需要

### 选项 B：Neon（自动扩容）

**优点**：无活动时自动暂停，节省资源

**步骤**：

1. 访问 [Neon](https://neon.tech)
2. 使用 GitHub 账号登录
3. 点击 "Create a project"：
   - Project name：`ai-crm`
   - Region：选择 `AWS Asia Pacific (Singapore)` 或其他
   - Postgres version：保持默认（最新版）
4. 创建完成后，会自动显示连接字符串：
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname
   ```
5. 复制并保存这个连接字符串

### 选项 C：Vercel Postgres（深度集成）

**优点**：与 Vercel 项目无缝集成，环境变量自动注入

**步骤**：

1. 登录 Vercel Dashboard
2. 进入你的团队页面，点击 "Storage" 选项卡
3. 点击 "Create Database"
4. 选择 "Postgres"
5. 填写数据库名称：`ai-crm-db`
6. 选择区域（推荐选择离你目标用户最近的）
7. 点击 "Create"
8. 创建完成后，先不用管连接字符串，后续会自动关联到项目

---

## 3. 准备代码仓库

### 3.1 如果代码在本地

```bash
# 进入项目目录
cd /path/to/ai-crm-serverless

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"
```

### 3.2 推送到 GitHub

1. 在 GitHub 上创建一个新仓库：
   - 访问 [GitHub 新建仓库页面](https://github.com/new)
   - Repository name：`ai-crm-serverless`
   - 选择 "Private"（推荐）或 "Public"
   - **不要**勾选 "Add a README file"（因为本地已有代码）
   - 点击 "Create repository"

2. 关联远程仓库并推送：
   ```bash
   # 添加远程仓库（替换成你自己的仓库地址）
   git remote add origin https://github.com/你的用户名/ai-crm-serverless.git
   
   # 推送到 GitHub
   git branch -M main
   git push -u origin main
   ```

---

## 4. 部署方式选择

Vercel 提供两种主要部署方式：

| 方式 | 优点 | 缺点 | 适合场景 |
|------|------|------|----------|
| **GitHub 自动部署** | • 每次 push 自动部署<br>• 自动回滚<br>• 团队协作友好 | 需要 GitHub 仓库 | **推荐用于长期项目** |
| **CLI 手动部署** | • 快速部署<br>• 不依赖 Git | 每次都要手动执行 | 快速测试或个人项目 |

我们推荐使用 **GitHub 自动部署**，下面两种方式都会详细说明。

---

## 5. 方式一：GitHub 自动部署（推荐）

### 5.1 导入项目到 Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击右上角 "Add New..." 按钮 → 选择 "Project"
3. 在 "Import Git Repository" 页面：
   - 如果看到你的仓库，直接点击 "Import"
   - 如果没看到，点击 "Adjust GitHub App Permissions" 授权 Vercel 访问你的仓库

### 5.2 配置项目

在 "Configure Project" 页面：

1. **Project Name**：`ai-crm-serverless`（可自定义）
2. **Framework Preset**：选择 "Other"（因为是自定义 Serverless 项目）
3. **Root Directory**：保持 `./`（使用根目录）
4. **Build & Development Settings**：
   - Build Command：会自动读取 `vercel.json` 中的配置
   - Output Directory：留空
   - Install Command：`npm install`

### 5.3 暂时跳过环境变量

先点击 "Deploy" 开始首次部署。

> **注意**：首次部署会失败，因为缺少数据库连接，这是正常的。我们将在下一步添加环境变量后重新部署。

### 5.4 等待部署完成

- Vercel 会显示构建日志
- 即使失败也没关系，继续下一步配置环境变量

---

## 6. 方式二：CLI 手动部署

### 6.1 登录 Vercel CLI

```bash
vercel login
```

会打开浏览器进行验证，完成后回到终端。

### 6.2 进入项目目录并初始化

```bash
cd /path/to/ai-crm-serverless

# 首次部署（开发环境预览）
vercel
```

### 6.3 根据提示完成配置

```
? Set up and deploy "~/ai-crm-serverless"? [Y/n] y
? Which scope do you want to deploy to? 选择你的账户
? Link to existing project? [y/N] n
? What's your project's name? ai-crm-serverless
? In which directory is your code located? ./
```

### 6.4 查看预览部署

完成后会得到一个预览 URL，例如：
```
https://ai-crm-serverless-xxxx.vercel.app
```

### 6.5 暂时先不部署到生产环境

等配置好环境变量后再执行 `vercel --prod`。

---

## 7. 配置环境变量

### 7.1 生成 JWT 密钥

在终端运行以下命令生成两个随机密钥：

```bash
# 生成 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 再次运行生成 JWT_REFRESH_SECRET（不要重复使用同一个）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制并保存这两个密钥。

### 7.2 在 Vercel Dashboard 中添加环境变量

1. 进入你的项目页面（Vercel Dashboard → 选择你的项目）
2. 点击顶部 "Settings" 选项卡
3. 在左侧菜单点击 "Environment Variables"
4. 添加以下三个环境变量：

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | 你在第 2 步获取的数据库连接字符串 | Production, Preview, Development（全选） |
| `JWT_SECRET` | 第一个生成的随机字符串 | Production, Preview, Development（全选） |
| `JWT_REFRESH_SECRET` | 第二个生成的随机字符串 | Production, Preview, Development（全选） |

**操作步骤**：
- 点击 "Add New" 按钮
- 输入 Name（例如 `DATABASE_URL`）
- 输入 Value（粘贴对应的值）
- 勾选所有三个环境（Production, Preview, Development）
- 点击 "Save"
- 重复以上步骤添加其余两个变量

### 7.3 可选：添加 CRON_SECRET（定时任务保护）

如果你想保护定时任务接口：

```bash
# 生成 CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

在 Vercel 环境变量中添加：
- Name: `CRON_SECRET`
- Value: 生成的随机字符串

---

## 8. 初始化生产数据库

环境变量配置完成后，需要初始化数据库表结构和种子数据。

### 8.1 拉取环境变量到本地

```bash
# 在项目目录下执行
vercel env pull .env.production
```

这会将 Vercel 上的环境变量下载到本地 `.env.production` 文件。

### 8.2 安装依赖并生成 Prisma Client

```bash
npm install
npx prisma generate
```

### 8.3 运行数据库迁移

```bash
# 使用生产环境的数据库 URL
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

> **注意**：将 `postgresql://...` 替换为你实际的数据库连接字符串（从第 2 步获取）

**或者**使用 `.env.production` 文件：

```bash
# 临时加载 .env.production
export $(cat .env.production | xargs)

# 运行迁移
npx prisma migrate deploy
```

### 8.4 填充种子数据

```bash
# 继续使用生产数据库
DATABASE_URL="postgresql://..." npm run prisma:seed
```

或：
```bash
npm run prisma:seed
```

**成功标志**：
终端会显示类似以下输出：
```
✓ Created default admin user
✓ Seeded 11 preset categories
✓ Seeded customer data
Database seeded successfully!
```

---

## 9. 部署验证

### 9.1 触发重新部署

**方法 A：通过 GitHub（如果使用 GitHub 集成）**
1. 做一个小的代码修改（如在 README 添加一行）
2. 提交并推送：
   ```bash
   git add .
   git commit -m "Trigger deployment"
   git push
   ```
3. Vercel 会自动检测到推送并重新部署

**方法 B：通过 Vercel Dashboard**
1. 进入项目页面
2. 点击 "Deployments" 选项卡
3. 找到最新的部署，点击右侧的 "..." 菜单
4. 选择 "Redeploy"

**方法 C：通过 CLI**
```bash
vercel --prod
```

### 9.2 等待部署完成

在 Vercel Dashboard 的 "Deployments" 页面可以实时查看部署进度：
- Building（构建中）
- Deploying（部署中）
- Ready（就绪）✅

### 9.3 获取生产 URL

部署成功后，Vercel 会分配一个生产 URL，例如：
```
https://ai-crm-serverless.vercel.app
```

记下这个 URL，接下来要测试。

---

## 10. 测试部署是否成功

### 10.1 健康检查

在浏览器或终端测试：

```bash
curl https://你的域名.vercel.app/api/health
```

**预期返回**：
```json
{"status":"ok","timestamp":"2024-12-19T..."}
```

### 10.2 登录测试

```bash
curl -X POST https://你的域名.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**预期返回**：
```json
{
  "manager": {
    "id": "...",
    "username": "admin",
    ...
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### 10.3 访问前端页面

在浏览器打开：
```
https://你的域名.vercel.app
```

应该能看到 AI-CRM 的登录界面。

### 10.4 完整功能测试

使用默认账号登录：
- 用户名：`admin`
- 密码：`admin123`

登录后测试以下功能：
- ✅ 查看仪表盘统计
- ✅ 添加客户信息
- ✅ 创建回访记录
- ✅ 查看产品订单
- ✅ 访问预设数据管理

---

## 11. 域名配置（可选）

如果你有自己的域名，可以绑定到 Vercel 项目上。

### 11.1 添加自定义域名

1. 在 Vercel 项目页面，点击 "Settings" → "Domains"
2. 输入你的域名（如 `crm.yourdomain.com`）
3. 点击 "Add"

### 11.2 配置 DNS

Vercel 会提供 DNS 配置指引，通常需要添加以下记录之一：

**A 记录方式：**
```
Type: A
Name: crm (或 @，如果是根域名)
Value: 76.76.21.21
```

**CNAME 方式（推荐）：**
```
Type: CNAME
Name: crm
Value: cname.vercel-dns.com
```

### 11.3 等待生效

- DNS 生效时间：通常 5-30 分钟
- Vercel 会自动签发免费 SSL 证书（Let's Encrypt）
- 生效后，你的网站会自动使用 HTTPS

---

## 12. 常见问题排查

### 问题 1：部署时构建失败

**错误信息**：`Error: Cannot find module '@prisma/client'`

**解决方案**：
```bash
# 确保 package.json 中有 prepare 脚本
npm run prisma:generate

# 提交并重新部署
git add .
git commit -m "Add prisma generate to build"
git push
```

### 问题 2：数据库连接失败

**错误信息**：`P1001: Can't reach database server`

**排查步骤**：
1. 检查 `DATABASE_URL` 环境变量是否正确设置
2. 确认数据库服务正在运行（登录 Supabase/Neon 控制台查看）
3. 检查数据库防火墙设置，确保允许 Vercel IP 访问
4. 测试连接字符串：
   ```bash
   psql "postgresql://your-connection-string"
   ```

### 问题 3：登录返回 401

**可能原因**：
- 种子数据未执行
- JWT_SECRET 配置错误
- 密码输入错误

**解决方案**：
```bash
# 重新运行种子脚本
DATABASE_URL="your-db-url" npm run prisma:seed

# 确认管理员账号已创建
psql "your-db-url" -c "SELECT * FROM managers;"
```

### 问题 4：API 返回 500 错误

**排查方法**：
1. 在 Vercel Dashboard 查看实时日志：
   - 项目页面 → "Deployments" → 点击最新部署 → "Logs"
2. 查找具体错误信息
3. 常见原因：
   - 环境变量缺失
   - 数据库连接超时
   - Prisma Client 未正确生成

### 问题 5：Service Worker 不工作

**解决方案**：
1. 确保 `public/service-worker.js` 和 `public/manifest.json` 已部署
2. 在浏览器开发者工具 → Application → Service Workers 查看状态
3. 如果有旧版本，执行：
   ```javascript
   // 在浏览器控制台运行
   navigator.serviceWorker.getRegistrations().then(regs => {
     regs.forEach(reg => reg.unregister())
   })
   ```
4. 刷新页面重新注册

### 问题 6：Vercel CLI 部署卡住

**解决方案**：
```bash
# 升级 Vercel CLI 到最新版本
npm i -g vercel@latest

# 清除缓存
vercel logout
vercel login

# 重新部署
vercel --prod
```

---

## 13. 生产环境最佳实践

### 13.1 安全建议

1. **立即修改默认密码**：
   ```bash
   # 登录后调用密码修改接口
   curl -X POST https://你的域名/api/managers/change-password \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "oldPassword": "admin123",
       "newPassword": "YourStrongPassword123!"
     }'
   ```

2. **定期轮换 JWT 密钥**：
   - 每 3-6 个月更换一次
   - 更换后所有用户需要重新登录

3. **启用 Vercel 防护功能**：
   - 在 Settings → Security 中启用 DDoS 保护
   - 配置 IP 白名单（如果需要）

### 13.2 监控与日志

1. **查看实时日志**：
   ```bash
   vercel logs https://你的域名.vercel.app --follow
   ```

2. **接入日志服务**（推荐）：
   - [Axiom](https://axiom.co)：Vercel 官方集成
   - [Logtail](https://logtail.com)：结构化日志

### 13.3 备份策略

1. **数据库备份**：
   - Supabase：Settings → Database → Backups（每日自动备份）
   - Neon：通过 `pg_dump` 手动备份
   - Vercel Postgres：自动备份到 Vercel Blob

2. **定期导出数据**：
   ```bash
   # 使用 pg_dump
   pg_dump "your-db-url" > backup-$(date +%Y%m%d).sql
   ```

### 13.4 性能优化

1. **启用 Vercel Edge Caching**：
   在 `vercel.json` 中配置缓存头（仅适用于公开数据）

2. **监控 Serverless Function 执行时间**：
   - 目标：< 1 秒
   - 超过 3 秒需要优化查询或增加索引

3. **数据库索引**：
   确保已运行所有迁移，Prisma schema 中定义的索引已生效

---

## 14. 下一步

恭喜！🎉 你已经成功将 AI-CRM 项目部署到 Vercel。

**推荐接下来做的事情**：

1. ✅ 修改管理员密码
2. 📱 测试 PWA 安装（在手机浏览器中访问，点击"添加到主屏幕"）
3. 🔔 配置提醒通知功能
4. 📊 添加真实客户数据
5. 👥 创建更多管理员账号
6. 🌐 绑定自定义域名
7. 📈 接入分析工具（如 Google Analytics）

---

## 15. 获取帮助

如果遇到问题，可以：

1. **查看官方文档**：
   - [Vercel 文档](https://vercel.com/docs)
   - [Prisma 文档](https://www.prisma.io/docs)

2. **查看项目其他文档**：
   - `docs/DEPLOYMENT.md` - 简明部署指南
   - `docs/technical/00_快速开始指南.md` - 本地开发指南

3. **社区支持**：
   - Vercel Discord 社区
   - GitHub Issues（如果项目开源）

---

**最后更新**：2024-12-19  
**维护者**：AI-CRM 开发团队  
**文档版本**：v1.0

---

> 💡 **小提示**：建议将本文档打印或保存为 PDF，部署过程中随时查阅。
