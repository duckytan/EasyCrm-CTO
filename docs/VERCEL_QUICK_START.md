# 🚀 Vercel 部署快速指南（小白版）

> **这个指南是专门为完全不懂部署的朋友准备的！** 只要跟着步骤一步一步来，保证能成功部署到 Vercel 上！

---

## ⏱️ 需要多长时间？

- 首次部署：约 **30-45 分钟**
- 熟练后：只需 **5 分钟**

---

## 📋 部署前检查清单

在开始之前，请确保你有以下东西：

- [ ] 一个 GitHub 账号（没有的话去 [github.com](https://github.com) 注册一个）
- [ ] 一台能上网的电脑（Windows/Mac/Linux 都可以）
- [ ] 30 分钟的空闲时间
- [ ] 一颗耐心的心 ❤️

---

## 🎯 部署路线图

```
第1步: 准备工作 (5分钟)
   ↓
第2步: 准备数据库 (10分钟)
   ↓
第3步: 上传代码到 GitHub (5分钟)
   ↓
第4步: 连接 Vercel 和 GitHub (5分钟)
   ↓
第5步: 配置环境变量 (5分钟)
   ↓
第6步: 初始化数据库 (5分钟)
   ↓
第7步: 测试部署结果 (5分钟)
   ↓
🎉 完成！你的网站上线了！
```

---

## 第1步：准备工作 (5分钟)

### 1.1 注册 Vercel 账号

1. 打开浏览器，访问 [vercel.com](https://vercel.com)
2. 点击右上角 **"Sign Up"**（注册）按钮
3. 选择 **"Continue with GitHub"**（用 GitHub 登录）
   - 💡 这样做的好处：后面可以自动部署，超级方便！
4. 按照提示授权 Vercel 访问你的 GitHub
5. 完成后你会看到 Vercel 的欢迎页面

✅ **检查点**：你现在应该能看到 Vercel 的控制面板了

### 1.2 安装 Node.js

1. 访问 [nodejs.org](https://nodejs.org)
2. 下载 **LTS 版本**（左边那个，推荐版本）
3. 双击下载的文件，一路点击 "下一步" 完成安装
4. 打开命令行工具：
   - **Windows**：按 `Win + R`，输入 `cmd`，按回车
   - **Mac**：按 `Cmd + 空格`，输入 `terminal`，按回车
   - **Linux**：按 `Ctrl + Alt + T`
5. 在命令行中输入以下命令检查是否安装成功：
   ```bash
   node -v
   ```
   应该会显示版本号，比如 `v18.17.0` 或更高

✅ **检查点**：命令行显示了 Node.js 版本号

### 1.3 安装 Vercel CLI

在命令行中输入：
```bash
npm install -g vercel
```

等待安装完成（可能需要 1-2 分钟），然后验证：
```bash
vercel --version
```

应该会显示 Vercel CLI 的版本号。

✅ **检查点**：命令行显示了 Vercel CLI 版本号

---

## 第2步：准备数据库 (10分钟)

你的项目需要一个 PostgreSQL 数据库。我们推荐使用 **Supabase**（免费、简单、好用）。

### 2.1 注册 Supabase

1. 访问 [supabase.com](https://supabase.com)
2. 点击 **"Start your project"**
3. 选择 **"Continue with GitHub"**（用 GitHub 登录）
4. 按提示完成注册

### 2.2 创建数据库

1. 在 Supabase 控制面板，点击 **"New Project"**（新建项目）
2. 填写项目信息：
   - **Organization**：如果是第一次使用，先创建一个组织，名字随便起（比如 `my-projects`）
   - **Name**：`ai-crm-db`（或者你喜欢的名字）
   - **Database Password**：设置一个强密码
     - ⚠️ **超级重要**：把这个密码复制保存到记事本里，千万别忘了！
   - **Region**：选择 **"Northeast Asia (Tokyo)"**（离中国最近，速度快）
   - **Pricing Plan**：选择 **"Free"**（免费版）
3. 点击 **"Create new project"**
4. 等待 2-3 分钟，数据库创建中...

### 2.3 获取数据库连接字符串

1. 数据库创建完成后，点击左侧菜单的 **"Project Settings"**（项目设置）
2. 选择 **"Database"**
3. 向下滚动，找到 **"Connection string"** 部分
4. 点击 **"URI"** 标签
5. 复制那个长长的连接字符串，看起来像这样：
   ```
   postgresql://postgres.[项目ID]:[密码]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```
6. 把 `[密码]` 部分替换成你在第 2.2 步设置的密码
7. **把这个完整的连接字符串保存到记事本**，后面要用！

✅ **检查点**：你的记事本里现在有一个完整的数据库连接字符串

---

## 第3步：上传代码到 GitHub (5分钟)

### 3.1 安装 Git（如果还没有）

**Windows 用户**：
1. 访问 [git-scm.com](https://git-scm.com/download/win)
2. 下载并安装，默认选项就可以

**Mac 用户**：
```bash
brew install git
```

**Linux 用户**：
```bash
sudo apt-get install git
```

### 3.2 在 GitHub 创建新仓库

1. 登录 [github.com](https://github.com)
2. 点击右上角 **"+"** → **"New repository"**（新建仓库）
3. 填写信息：
   - **Repository name**：`ai-crm-serverless`
   - **Description**：`我的 AI-CRM 系统`（可选）
   - **Public/Private**：选择 **"Private"**（私有，只有你能看到）
   - ⚠️ **不要勾选** "Add a README file"
4. 点击 **"Create repository"**
5. 创建完成后，**先别关闭这个页面**，后面要用！

### 3.3 上传本地代码到 GitHub

打开命令行，进入你的项目文件夹：
```bash
cd /path/to/your/ai-crm-serverless
```
（把 `/path/to/your/ai-crm-serverless` 替换成你的项目实际路径）

然后依次执行以下命令：

```bash
# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit"

# 连接到 GitHub（替换成你自己的仓库地址）
git remote add origin https://github.com/你的用户名/ai-crm-serverless.git

# 推送代码
git branch -M main
git push -u origin main
```

💡 **提示**：在第 3.2 步创建仓库后，GitHub 会显示这些命令，你可以直接复制。

✅ **检查点**：刷新 GitHub 仓库页面，应该能看到你的代码了

---

## 第4步：连接 Vercel 和 GitHub (5分钟)

### 4.1 在 Vercel 导入项目

1. 回到 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击右上角 **"Add New..."** → **"Project"**
3. 在 "Import Git Repository" 页面：
   - 你应该能看到刚才创建的 `ai-crm-serverless` 仓库
   - 如果没看到，点击 **"Adjust GitHub App Permissions"**，授权 Vercel 访问

### 4.2 配置项目

1. 点击仓库旁边的 **"Import"** 按钮
2. 在配置页面：
   - **Project Name**：保持 `ai-crm-serverless`（或自定义）
   - **Framework Preset**：选择 **"Other"**
   - **Root Directory**：保持 `./`
   - **Build Command**：会自动使用 `vercel.json` 的配置，不用改
   - **Output Directory**：留空
   - **Install Command**：保持 `npm install`

### 4.3 暂时不配置环境变量

1. 向下滚动到 "Environment Variables" 部分
2. **先不填任何东西**，直接点击 **"Deploy"**
3. 等待部署...
   - ⚠️ **正常情况**：部署会失败，因为缺少数据库配置
   - 这是预期的，不用担心！

✅ **检查点**：你的项目已经出现在 Vercel Dashboard 里了

---

## 第5步：配置环境变量 (5分钟)

### 5.1 生成密钥

打开命令行，依次运行以下命令：

**生成 JWT_SECRET：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**复制输出的字符串**（一长串随机字母和数字），保存到记事本，标记为 `JWT_SECRET`

**生成 JWT_REFRESH_SECRET：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**再次复制输出的字符串**，保存到记事本，标记为 `JWT_REFRESH_SECRET`

现在你的记事本里应该有：
- `DATABASE_URL`（数据库连接字符串）
- `JWT_SECRET`（第一个随机字符串）
- `JWT_REFRESH_SECRET`（第二个随机字符串）

### 5.2 在 Vercel 添加环境变量

1. 在 Vercel Dashboard，进入你的项目
2. 点击顶部的 **"Settings"**（设置）选项卡
3. 在左侧菜单点击 **"Environment Variables"**（环境变量）
4. 添加第一个变量：
   - 点击 **"Add New"**
   - **Name**：`DATABASE_URL`
   - **Value**：粘贴你的数据库连接字符串
   - **Environment**：勾选 **所有三个**（Production, Preview, Development）
   - 点击 **"Save"**
5. 添加第二个变量：
   - 点击 **"Add New"**
   - **Name**：`JWT_SECRET`
   - **Value**：粘贴你的 JWT_SECRET
   - **Environment**：勾选 **所有三个**
   - 点击 **"Save"**
6. 添加第三个变量：
   - 点击 **"Add New"**
   - **Name**：`JWT_REFRESH_SECRET`
   - **Value**：粘贴你的 JWT_REFRESH_SECRET
   - **Environment**：勾选 **所有三个**
   - 点击 **"Save"**

✅ **检查点**：你应该能在环境变量列表中看到 3 个变量

---

## 第6步：初始化数据库 (5分钟)

现在我们要创建数据库表结构和初始数据。

### 6.1 安装项目依赖

在命令行中，进入项目目录：
```bash
cd /path/to/your/ai-crm-serverless
```

安装依赖：
```bash
npm install
```

等待安装完成（可能需要 2-3 分钟）

### 6.2 生成 Prisma Client

```bash
npm run prisma:generate
```

### 6.3 创建数据库表

```bash
DATABASE_URL="你的数据库连接字符串" npx prisma migrate deploy
```

⚠️ **重要**：把 `你的数据库连接字符串` 替换成真实的连接字符串！

例如：
```bash
DATABASE_URL="postgresql://postgres.abcd:password123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres" npx prisma migrate deploy
```

看到类似这样的输出就说明成功了：
```
✔ All migrations have been applied successfully
```

### 6.4 填充初始数据

```bash
DATABASE_URL="你的数据库连接字符串" npm run prisma:seed
```

成功后会显示：
```
✓ Created default admin user
✓ Seeded 11 preset categories
✓ Seeded customer data
Database seeded successfully!
```

✅ **检查点**：数据库已经准备好了，包含了默认管理员账号和测试数据

---

## 第7步：重新部署并测试 (5分钟)

### 7.1 触发重新部署

现在环境变量配置好了，需要重新部署：

**方法1：通过 GitHub（推荐）**
```bash
# 在项目目录
git commit --allow-empty -m "Trigger redeploy"
git push
```

**方法2：通过 Vercel Dashboard**
1. 进入项目页面
2. 点击 **"Deployments"** 选项卡
3. 找到最新的部署
4. 点击右侧的 **"..."** → **"Redeploy"**

等待部署完成，大约需要 1-2 分钟。

### 7.2 获取你的网站地址

部署成功后：
1. 在 Vercel Dashboard 的项目页面
2. 点击 **"Visit"** 按钮
3. 或者直接访问：`https://你的项目名.vercel.app`

你会看到一个类似这样的地址：
```
https://ai-crm-serverless.vercel.app
```

**把这个地址保存好！** 这就是你的网站地址！

### 7.3 测试网站功能

#### 测试1：打开网站首页

在浏览器中访问：`https://你的网站地址.vercel.app`

你应该能看到登录页面。

#### 测试2：测试登录

使用默认账号登录：
- **用户名**：`admin`
- **密码**：`admin123`

点击 "登录"，如果进入了系统主页（仪表盘），说明部署成功！🎉

#### 测试3：测试 API 接口

在命令行或浏览器中测试：
```bash
curl https://你的网站地址.vercel.app/api/health
```

应该返回：
```json
{"status":"ok","timestamp":"2024-12-19T..."}
```

✅ **检查点**：所有测试都通过了，网站已经成功部署！

---

## 🎉 恭喜你！部署成功！

你的 AI-CRM 系统现在已经在线上运行了！

### 你的网站信息

- **网站地址**：`https://你的项目名.vercel.app`
- **管理员账号**：`admin`
- **管理员密码**：`admin123`
- **数据库**：Supabase PostgreSQL

### ⚠️ 重要：安全设置

为了安全，请立即做以下事情：

1. **修改管理员密码**
   - 登录系统后，进入 "设置" → "修改密码"
   - 或通过 API：`POST /api/managers/change-password`

2. **定期备份数据库**
   - Supabase 有自动备份功能
   - 也可以在 Supabase Dashboard → Database → Backups 手动创建备份

---

## 📱 后续操作

### 如何更新代码？

每次修改代码后，只需要：
```bash
git add .
git commit -m "描述你的修改"
git push
```

Vercel 会自动检测到推送并重新部署！超级方便！

### 如何查看部署日志？

1. 进入 Vercel Dashboard
2. 选择你的项目
3. 点击 **"Deployments"**
4. 点击任意一个部署记录
5. 查看 **"Building"** 和 **"Runtime Logs"**

### 如何绑定自己的域名？

如果你有自己的域名（比如 `www.mycrm.com`）：
1. 在 Vercel 项目页面，点击 **"Settings"** → **"Domains"**
2. 输入你的域名，点击 **"Add"**
3. 按照提示在你的域名服务商那里配置 DNS
4. 等待 DNS 生效（可能需要几分钟到几小时）

---

## ❓ 常见问题

### Q1: 部署失败了怎么办？

**A**: 别慌！按以下步骤排查：

1. **检查环境变量**
   - 进入 Vercel → Settings → Environment Variables
   - 确认 3 个变量都配置正确

2. **查看部署日志**
   - Vercel Dashboard → Deployments → 点击失败的部署
   - 查看错误信息

3. **常见错误**：
   - `DATABASE_URL not found`：环境变量没配置
   - `Connection refused`：数据库连接字符串错误
   - `JWT secret not provided`：JWT 密钥没配置

### Q2: 登录失败，提示用户名或密码错误？

**A**: 确认以下几点：

1. 数据库是否正确初始化了？
   - 重新运行 `npm run prisma:seed`

2. 用户名和密码是否正确？
   - 默认：`admin` / `admin123`
   - 注意区分大小写

3. API 是否正常工作？
   - 访问 `https://你的网站/api/health` 检查

### Q3: 页面打开很慢或打不开？

**A**: 可能的原因：

1. **网络问题**
   - Vercel 的服务器在国外，可能会有点慢
   - 可以尝试使用代理或 VPN

2. **Serverless 冷启动**
   - 第一次访问可能需要 5-10 秒
   - 之后会快很多

3. **数据库休眠**
   - Supabase 免费版可能会休眠
   - 第一次访问需要唤醒（约 5 秒）

### Q4: 如何查看数据库里的数据？

**A**: 使用 Supabase 的 Table Editor：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击左侧的 **"Table Editor"**
4. 就能看到所有表和数据了

### Q5: 忘记了管理员密码怎么办？

**A**: 可以通过数据库重置：

1. 进入 Supabase Table Editor
2. 找到 `Manager` 表
3. 找到 `admin` 用户
4. 你可以：
   - 选项1：使用 Prisma Studio 重置（推荐）
     ```bash
     npx prisma studio
     ```
   - 选项2：重新运行种子脚本
     ```bash
     DATABASE_URL="..." npm run prisma:seed
     ```

---

## 📚 更多资源

如果你想了解更多细节：

- [完整部署教程](Vercel部署详细教程.md) - 包含更多高级选项
- [部署指南](DEPLOYMENT.md) - 技术细节
- [API 文档](DEPLOYMENT.md#api文档) - 所有接口说明
- [项目架构](technical/02_技术架构设计文档.md) - 系统设计

---

## 💪 你已经成功了！

如果你按照这个指南完成了所有步骤，那么恭喜你！

你现在已经：
- ✅ 掌握了基本的 Git 和 GitHub 操作
- ✅ 学会了使用 Vercel 部署应用
- ✅ 了解了如何配置云数据库
- ✅ 拥有了一个在线运行的 AI-CRM 系统

接下来，你可以：
- 🎨 自定义界面和功能
- 📊 添加更多数据
- 🔐 邀请团队成员使用
- 🌍 绑定自己的域名

**Keep coding! 💻**

---

## 需要帮助？

如果在部署过程中遇到任何问题：

1. 先查看本文档的 [常见问题](#❓-常见问题) 部分
2. 查看 [完整部署教程](Vercel部署详细教程.md) 寻找更多细节
3. 在项目的 GitHub Issues 中提问
4. 发送邮件给项目维护者

**祝你部署顺利！** 🚀
