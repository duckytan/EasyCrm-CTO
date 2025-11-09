# GitHub Pages 部署指南

本文档说明如何将 AI-CRM 系统部署到 GitHub Pages，以展示前端界面和功能。

## 📋 重要说明

### 两个前端版本的区别

项目包含两个前端目录：

1. **`public/`** - 完整版
   - 包含完整的 API 集成
   - 支持 PWA（离线访问、安装到桌面）
   - 可连接真实后端 API
   - **自动降级到预览模式**：当后端 API 不可用时（如在 GitHub Pages 上），会自动使用模拟数据

2. **`frontend-preview/`** - 纯预览版
   - 仅供演示 UI 设计
   - 使用固定的模拟数据
   - 无 API 调用
   - 不推荐用于 GitHub Pages 部署

## 🚀 部署步骤

### 方案 1：通过 GitHub 设置（推荐）

1. 进入 GitHub 仓库的 **Settings**
2. 找到 **Pages** 部分
3. 在 **Source** 下选择：
   - Branch: `main`（或你的主分支）
   - Folder: **`/public`**
4. 点击 **Save**
5. 等待几分钟，GitHub 会自动构建并部署
6. 访问生成的 URL（如 `https://username.github.io/repo-name/`）

### 方案 2：使用 GitHub Actions（高级）

如果你需要更多控制，可以使用 GitHub Actions。创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './public'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 🎭 预览模式工作原理

当 `public/` 部署到 GitHub Pages 时：

1. 用户访问登录页面
2. 输入任意用户名和密码
3. 系统尝试连接后端 API（`/api/auth/login`）
4. 由于 GitHub Pages 只提供静态文件托管，API 请求会失败
5. **系统自动切换到预览模式**，使用内置的模拟数据
6. 用户可以正常浏览所有页面和功能

### 预览模式特性

- ✅ 完整的 UI 展示
- ✅ 所有页面可访问
- ✅ 查看模拟数据（客户、回访、订单、仪表盘）
- ✅ 支持搜索、筛选等交互
- ❌ 无法真正创建/编辑/删除数据（需要真实后端）

## 🔧 自定义配置

### 调整基础路径

如果你的仓库名不是根路径，需要调整链接路径。例如，仓库名为 `ai-crm`：

1. 编辑 `public/js/api-client.js`：
   ```javascript
   const API_BASE_URL = '/ai-crm/api';  // 添加仓库名前缀
   ```

2. 编辑所有 HTML 文件中的资源引用：
   ```html
   <link rel="stylesheet" href="/ai-crm/css/base.css">
   <script src="/ai-crm/js/app.js"></script>
   ```

### 禁用 Jekyll

GitHub Pages 默认使用 Jekyll 处理文件。要禁用它：

在项目根目录创建 `.nojekyll` 文件：
```bash
touch .nojekyll
```

## 📱 PWA 支持

即使在 GitHub Pages 上，PWA 功能仍然可用：

- ✅ 安装到桌面/主屏幕
- ✅ 离线访问已缓存的页面
- ✅ Service Worker 缓存策略
- ✅ 自动更新检测

## 🐛 常见问题

### 问题 1：页面显示空白

**原因**：资源路径错误

**解决**：检查浏览器控制台，查看哪些资源 404，调整路径。

### 问题 2：登录后无数据

**原因**：预览模式未正确启用

**解决**：
1. 打开浏览器控制台
2. 查看是否有 `[预览模式] 使用模拟数据` 的日志
3. 检查 `localStorage.getItem('previewMode')` 是否为 `'true'`

### 问题 3：样式显示不正常

**原因**：CSS 文件未加载或路径错误

**解决**：确保 `public/css/base.css` 路径正确，检查是否有拼写错误。

### 问题 4：想展示真实数据

**解决方案**：
- 将后端部署到 Vercel/Heroku/Railway 等平台
- 在 `public/js/api-client.js` 中修改 `API_BASE_URL` 指向真实 API
- 配置 CORS 允许 GitHub Pages 域名访问

## 📚 相关文档

- [前端文档](docs/FRONTEND.md) - 完整的前端功能说明
- [部署指南](docs/DEPLOYMENT.md) - 后端 API 部署（Vercel）
- [开发指南](DEVELOPMENT.md) - 本地开发环境设置

## ✅ 验证部署

部署完成后，验证以下功能：

- [ ] 可以访问登录页面
- [ ] 输入任意账号密码可以登录
- [ ] 仪表盘显示统计数据
- [ ] 客户列表可以查看和搜索
- [ ] 回访记录正常显示
- [ ] 产品订单页面正常
- [ ] 深色模式切换正常
- [ ] PWA 安装提示出现（移动设备或 Chrome）

---

**最后更新**: 2024-12-19  
**维护人**: AI Agent
