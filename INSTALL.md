# AI-CRM Serverless 安装指南

本文档详细介绍如何使用交互式安装向导完成 AI-CRM Serverless 项目的初始化配置和部署。

## 📋 目录

- [系统要求](#系统要求)
- [安装前准备](#安装前准备)
- [快速安装](#快速安装)
- [安装步骤详解](#安装步骤详解)
- [配置参数说明](#配置参数说明)
- [常见问题](#常见问题)
- [手动安装](#手动安装)

## 🔧 系统要求

在开始安装前，请确保您的系统满足以下要求：

### 必需软件

- **Node.js**: >= 18.17.0
- **npm**: >= 9.0.0（通常随 Node.js 一起安装）
- **PostgreSQL**: >= 12.0（推荐 14.0+）

### 操作系统

- Linux（Ubuntu 18.04+, CentOS 7+, Debian 10+）
- macOS 10.15+
- Windows 10/11（推荐使用 WSL2）

### 硬件建议

- CPU: 2 核心或以上
- 内存: 4GB RAM 或以上
- 磁盘: 至少 1GB 可用空间

## 📦 安装前准备

### 1. 安装 Node.js

如果您还没有安装 Node.js，请访问 [nodejs.org](https://nodejs.org/) 下载并安装。

验证安装：
```bash
node --version  # 应显示 v18.17.0 或更高
npm --version   # 应显示 npm 版本
```

### 2. 安装 PostgreSQL

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS (使用 Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Windows:
下载并安装 [PostgreSQL](https://www.postgresql.org/download/windows/)

### 3. 创建数据库

```bash
# 登录 PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE ai_crm;
CREATE USER ai_crm_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_crm TO ai_crm_user;

# 退出
\q
```

### 4. 克隆项目

```bash
git clone <your-repository-url>
cd ai-crm-serverless
```

## 🚀 快速安装

### 使用安装向导（推荐）

安装向导会引导您完成所有配置步骤：

```bash
# 第一次运行前需要安装依赖
npm install

# 运行安装向导
npm run install-wizard
```

按照屏幕提示输入配置信息即可。整个过程大约需要 5-10 分钟。

### 安装完成后

```bash
# 启动开发服务器
npm run dev

# 在浏览器中访问
# http://localhost:3000
```

## 📖 安装步骤详解

安装向导包含以下 6 个步骤：

### 步骤 1: 数据库配置

配置 PostgreSQL 数据库连接信息。

**需要输入的参数：**

| 参数 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| 数据库主机 | PostgreSQL 服务器地址 | localhost | localhost 或 db.example.com |
| 数据库端口 | PostgreSQL 端口号 | 5432 | 5432 |
| 数据库名称 | 数据库名称 | ai_crm | ai_crm |
| 数据库用户名 | 数据库用户 | postgres | ai_crm_user |
| 数据库密码 | 数据库密码 | - | your_password |

**验证项：**
- 自动测试数据库连接
- 验证端口号有效性
- 检查数据库名称格式

### 步骤 2: JWT 安全密钥配置

配置用于用户认证的 JWT 密钥。

**需要输入的参数：**

| 参数 | 说明 | 建议 |
|------|------|------|
| JWT Secret | 访问令牌签名密钥 | 自动生成 64 位随机字符串 |
| JWT Refresh Secret | 刷新令牌签名密钥 | 自动生成 64 位随机字符串 |

**安全建议：**
- 建议使用自动生成的随机密钥
- 两个密钥必须不同
- 生产环境密钥长度应至少 32 个字符
- 定期更换密钥（建议每 3-6 个月）

### 步骤 3: 项目基础信息配置

配置项目的基本信息。

**需要输入的参数：**

| 参数 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| 项目名称 | 系统显示名称 | AI-CRM 智能客户管理系统 | 我的CRM系统 |
| 项目描述 | 项目简短描述 | 基于AI的智能客户关系管理系统 | - |
| 项目URL | 访问地址 | http://localhost:3000 | https://crm.example.com |
| 运行环境 | 环境类型 | development | development 或 production |
| 服务器端口 | 本地开发端口 | 3000 | 3000 |

### 步骤 4: 管理员账户配置

创建系统管理员账户。

**需要输入的参数：**

| 参数 | 说明 | 默认值 | 要求 |
|------|------|--------|------|
| 管理员用户名 | 登录用户名 | admin | 3-20个字符，字母、数字、下划线 |
| 管理员显示名称 | 系统显示名称 | 系统管理员 | 任意字符 |
| 管理员密码 | 登录密码 | - | 至少6个字符，包含字母和数字 |

**密码要求：**
- 最小长度：6 个字符
- 必须包含字母
- 必须包含数字
- 建议包含特殊字符（生产环境）
- 需要确认输入两次

### 步骤 5: 配置确认

显示所有配置信息供您确认。

确认无误后，按 `y` 继续安装。

### 步骤 6: 执行安装

自动执行以下操作：

1. ✓ 检查项目依赖
2. ✓ 创建 .env 环境配置文件
3. ✓ 生成 Prisma 数据库客户端
4. ✓ 运行数据库迁移（创建表结构）
5. ✓ 创建管理员账户
6. ✓ 导入预设数据（可选）

## ⚙️ 配置参数说明

### 数据库连接字符串格式

安装向导会自动生成以下格式的连接字符串：

```
postgresql://用户名:密码@主机:端口/数据库名
```

示例：
```
postgresql://ai_crm_user:mypassword@localhost:5432/ai_crm
```

### 环境变量说明

安装完成后，会在项目根目录创建 `.env` 文件，包含以下配置：

```bash
# 数据库配置
DATABASE_URL="postgresql://..."

# JWT 密钥配置
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."

# 项目配置
PROJECT_NAME="..."
PROJECT_DESCRIPTION="..."
PROJECT_URL="..."
NODE_ENV="development"
PORT="3000"

# 管理员配置
ADMIN_USERNAME="..."
ADMIN_DISPLAY_NAME="..."
ADMIN_PASSWORD="..."
```

### 预设数据说明

安装向导会创建以下预设数据（可选）：

- **客户分类**: 普通客户、VIP客户、企业客户、代理商、潜在客户
- **意向等级**: H（高意向）、A（有意向）、B（一般）、C（低意向）、D（无意向）
- **地区**: 华东、华南、华北、华中、西南、西北、东北
- **预算范围**: 1000-5000、5000-10000、10000-50000、50000-100000、100000+
- **回访方式**: 电话回访、邮件回访、现场拜访、微信沟通、WhatsApp、视频会议
- **回访类型**: 计划回访、产品回访、客户生日、其他回访
- **导航模式**: Google Maps、高德地图、百度地图
- **提醒周期**: 今天、3天内、7天内、15天内、30天内、90天内、180天内、360天内

## ❓ 常见问题

### Q1: 数据库连接测试失败？

**可能原因：**
1. PostgreSQL 服务未启动
2. 主机地址或端口错误
3. 用户名或密码错误
4. 数据库不存在
5. 用户权限不足

**解决方法：**
```bash
# 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 启动服务
sudo systemctl start postgresql

# 检查数据库和用户
sudo -u postgres psql -l
```

### Q2: 依赖安装失败？

**解决方法：**
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### Q3: Prisma 迁移失败？

**可能原因：**
- 数据库连接问题
- 表已存在（重复安装）

**解决方法：**
```bash
# 重置数据库（会删除所有数据）
npx prisma migrate reset

# 或手动删除表后重试
npx prisma db push
```

### Q4: 忘记管理员密码？

**解决方法：**

方法1：重新运行安装向导
```bash
npm run install-wizard
```

方法2：手动重置密码
```bash
# 连接数据库
psql -U ai_crm_user -d ai_crm

# 查看用户
SELECT * FROM managers;

# 使用 bcryptjs 生成新密码哈希
# 然后更新数据库
UPDATE managers SET password_hash = '...' WHERE username = 'admin';
```

### Q5: 端口被占用？

**解决方法：**
```bash
# 查找占用端口的进程（以 3000 为例）
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者修改 .env 中的 PORT 配置
```

### Q6: 如何更改配置？

重新运行安装向导会覆盖现有配置：
```bash
npm run install-wizard
```

或手动编辑 `.env` 文件。

## 🔧 手动安装

如果您希望手动完成安装过程，请按以下步骤操作：

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入配置信息
nano .env
```

### 3. 生成 Prisma 客户端
```bash
npm run prisma:generate
```

### 4. 运行数据库迁移
```bash
npx prisma migrate deploy
# 或者
npx prisma db push
```

### 5. 导入种子数据
```bash
# 编辑 prisma/seed.ts 修改管理员信息
# 然后运行
npm run prisma:seed
```

### 6. 启动服务
```bash
npm run dev
```

## 📚 其他资源

- [完整文档](README.md)
- [开发指南](DEVELOPMENT.md)
- [部署指南](docs/DEPLOYMENT.md)
- [API 文档](docs/DEPLOYMENT.md#api文档)

## 🆘 获取帮助

如果遇到问题：

1. 查看本文档的"常见问题"部分
2. 检查项目的 [Issue](https://github.com/your-repo/issues) 页面
3. 创建新的 Issue 描述您的问题

## 📝 版本信息

- 当前版本: 0.1.0
- 最后更新: 2024-12-19
- 维护人: AI Agent

---

祝您使用愉快！🎉
