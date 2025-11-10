# 快速开始指南

本指南将帮助您在 5 分钟内完成 AI-CRM Serverless 项目的安装和运行。

## 🎯 快速安装（推荐）

### 方法一：使用一键安装脚本（Linux/macOS）

```bash
# 克隆项目
git clone <your-repository-url>
cd ai-crm-serverless

# 运行一键安装脚本
./install.sh
```

脚本会自动检查环境、安装依赖并启动交互式安装向导。

### 方法二：手动运行安装向导（适用所有平台）

```bash
# 1. 克隆项目
git clone <your-repository-url>
cd ai-crm-serverless

# 2. 安装依赖
npm install

# 3. 运行安装向导
npm run install-wizard
```

安装向导会引导您完成以下配置：
- ✅ 数据库连接配置
- ✅ JWT 安全密钥配置
- ✅ 项目基础信息
- ✅ 管理员账户创建
- ✅ 数据库初始化
- ✅ 种子数据导入

## 📋 安装前准备

确保您的系统已安装：

- **Node.js** >= 18.17.0 ([下载地址](https://nodejs.org/))
- **PostgreSQL** >= 12.0 ([安装指南](INSTALL.md#安装前准备))

### 创建数据库

在运行安装向导前，请先创建一个空的 PostgreSQL 数据库：

```bash
# 登录 PostgreSQL
sudo -u postgres psql

# 创建数据库
CREATE DATABASE ai_crm;

# 创建用户（可选）
CREATE USER ai_crm_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_crm TO ai_crm_user;

# 退出
\q
```

## 🚀 启动项目

安装完成后，启动开发服务器：

```bash
npm run dev
```

在浏览器中访问：http://localhost:3000

## 🔐 登录系统

使用安装向导中设置的管理员账户登录：

- 用户名：您设置的用户名（默认：admin）
- 密码：您设置的密码

## 📖 下一步

- 📘 [完整安装指南](INSTALL.md) - 详细的安装步骤和故障排除
- 🔧 [开发指南](DEVELOPMENT.md) - 本地开发和调试
- 🚢 [部署指南](docs/DEPLOYMENT.md) - 生产环境部署
- 📚 [API 文档](docs/DEPLOYMENT.md#api文档) - API 接口说明

## ❓ 遇到问题？

### 数据库连接失败

1. 检查 PostgreSQL 服务是否运行
2. 确认数据库名称、用户名和密码正确
3. 查看详细的[故障排除指南](INSTALL.md#常见问题)

### 端口被占用

修改 `.env` 文件中的 `PORT` 配置：

```bash
PORT=3001
```

### 重新配置

重新运行安装向导会覆盖现有配置：

```bash
npm run install-wizard
```

## 🆘 获取帮助

- 查看[完整文档](README.md)
- 查看[常见问题](INSTALL.md#常见问题)
- 创建 [Issue](https://github.com/your-repo/issues)

---

祝您使用愉快！🎉
