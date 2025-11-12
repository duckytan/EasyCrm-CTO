# Vercel 部署配置修复说明

## 问题描述

遇到 Vercel 部署后提示：
```
No Production Deployment
Your Production Domain is not serving traffic
```

## 问题原因

原有的 `vercel.json` 配置存在以下问题：

1. **buildCommand 配置不当**
   - 原配置：`"buildCommand": "npm run prisma:generate"`
   - 问题：Vercel 会在安装依赖后自动执行 `package.json` 中的 `prepare` 脚本，该脚本已经包含了 `prisma generate`，因此不需要额外配置 buildCommand
   - 额外的 buildCommand 可能导致部署流程混乱

2. **路由配置不正确**
   - 原配置：使用 `rewrites` 并将 `/` 重写到 `/public/index.html`
   - 问题：Vercel 默认将项目根目录下的 `public` 目录作为静态文件服务目录，但路径映射不正确，导致静态文件无法正确访问
   - 结果：Production Domain 无法正常提供服务

## 修复方案

已更新 `vercel.json`，主要改动：

### 1. 移除 buildCommand
```json
// 移除了这一行
"buildCommand": "npm run prisma:generate",
```

理由：
- `package.json` 中已有 `"prepare": "prisma generate"` 脚本
- Vercel 会在 `npm install` 后自动执行 prepare 脚本
- 无需重复配置

### 2. 修改路由规则
从 `rewrites` 改为 `routes`，并添加完整的路由映射：

```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "/api/$1"
  },
  {
    "src": "/(.*\\.(css|js|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot))",
    "dest": "/public/$1"
  },
  {
    "src": "/(.*\\.html)",
    "dest": "/public/$1"
  },
  {
    "src": "/",
    "dest": "/public/index.html"
  },
  {
    "src": "/(.*)",
    "dest": "/public/$1"
  }
]
```

路由规则说明：
1. **API 路由**：所有 `/api/*` 请求转发到 Serverless Functions
2. **静态资源**：CSS、JS、图片等静态文件从 `/public/` 目录提供服务
3. **HTML 页面**：所有 HTML 文件从 `/public/` 目录提供服务
4. **根路径**：将 `/` 映射到 `/public/index.html`（登录页）
5. **兜底规则**：其他所有请求尝试从 `/public/` 目录获取

## 部署步骤

修复后，请按以下步骤重新部署：

### 方法 1：通过 Git 自动部署（推荐）

```bash
# 提交更改
git add vercel.json
git commit -m "fix: 修复 Vercel 路由配置"
git push origin main
```

Vercel 会自动检测到推送并重新部署。

### 方法 2：通过 Vercel CLI 手动部署

```bash
# 部署到生产环境
vercel --prod
```

### 方法 3：通过 Vercel Dashboard 手动触发

1. 进入 Vercel Dashboard
2. 选择你的项目
3. 点击 "Deployments" 选项卡
4. 点击最新部署右侧的 "..." 按钮
5. 选择 "Redeploy"
6. 勾选 "Use existing Build Cache" (可选)
7. 点击 "Redeploy" 确认

## 验证部署

部署完成后，请验证以下功能：

### 1. 访问首页
```
https://你的域名.vercel.app
```
应该能看到登录页面。

### 2. 测试静态资源
打开浏览器开发者工具（F12），检查：
- CSS 文件是否正常加载
- JavaScript 文件是否正常加载
- 图标等静态资源是否正常显示

### 3. 测试 API
```bash
# 健康检查
curl https://你的域名.vercel.app/api/health

# 预期返回
{"status":"ok","timestamp":"..."}
```

### 4. 测试登录功能
使用默认账号登录：
- 用户名：`admin`
- 密码：`admin123`

如果能成功登录并跳转到仪表盘页面，说明部署成功！

## 环境变量确认

确保在 Vercel Dashboard → Settings → Environment Variables 中配置了以下变量：

| 变量名 | 说明 | 环境 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | Production, Preview, Development |
| `JWT_SECRET` | JWT 访问令牌密钥 | Production, Preview, Development |
| `JWT_REFRESH_SECRET` | JWT 刷新令牌密钥 | Production, Preview, Development |

如果缺少任何一个变量，请添加后重新部署。

## 常见问题

### Q1: 部署成功但仍然访问不了？
**A**: 检查环境变量是否正确配置，尤其是 `DATABASE_URL`。

### Q2: 静态文件 404？
**A**: 检查 `public` 目录下是否有对应文件，并确认 `vercel.json` 的路由配置正确。

### Q3: API 请求 500 错误？
**A**: 查看 Vercel Dashboard → Deployments → 最新部署 → Runtime Logs，检查具体错误信息。

### Q4: 数据库连接失败？
**A**: 
1. 检查 `DATABASE_URL` 格式是否正确
2. 确认数据库是否已运行且可从外部访问
3. 运行 `npx prisma migrate deploy` 确保数据库表结构已创建

## 后续建议

1. **修改默认密码**：部署成功后立即修改管理员密码
2. **监控日志**：定期检查 Vercel Runtime Logs，确保没有异常
3. **配置自定义域名**：在 Vercel Dashboard → Settings → Domains 中添加
4. **启用分析**：在 Vercel Dashboard → Analytics 中查看访问统计

## 技术说明

### Vercel 部署架构
```
用户请求
   ↓
Vercel CDN (Edge Network)
   ↓
路由判断 (根据 vercel.json 的 routes)
   ↓
   ├─→ /api/* → Serverless Functions (api/**/*.ts)
   └─→ 其他请求 → Static Files (public/***)
```

### 项目文件结构
```
project/
├── api/              # Serverless Functions (后端 API)
│   ├── auth/         # 认证相关
│   ├── customers/    # 客户管理
│   ├── visits/       # 回访记录
│   └── ...
├── public/           # 静态文件 (前端页面)
│   ├── index.html    # 登录页
│   ├── dashboard.html
│   ├── css/
│   └── js/
├── prisma/           # 数据库模型
└── vercel.json       # Vercel 配置
```

### 部署流程
1. Git push 触发 Vercel Webhook
2. Vercel 克隆代码
3. 执行 `npm install`（自动触发 `prepare` 脚本 → `prisma generate`）
4. 分析 `vercel.json` 配置
5. 将 `api/` 目录下的 TypeScript 文件编译为 Serverless Functions
6. 将 `public/` 目录部署为静态资源
7. 应用路由规则
8. 部署到全球 CDN
9. 返回部署 URL

## 参考文档

- [Vercel 配置文档](https://vercel.com/docs/project-configuration)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Vercel 路由配置](https://vercel.com/docs/project-configuration#routes)
- [项目完整部署指南](./docs/VERCEL_QUICK_START.md)
