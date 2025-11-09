# 修复 GitHub Pages 预览模式问题 - 变更说明

## 🎯 问题描述

用户在 GitHub Pages 上部署时，只能看到预览页面，无法访问实际的应用功能。

## 🔍 根本原因

1. 项目包含两个前端目录：
   - `frontend-preview/` - 仅用于 UI 演示的预览版
   - `public/` - 包含完整 API 集成的生产版

2. `public/` 目录虽然包含完整功能，但需要后端 API 支持
3. GitHub Pages 只提供静态文件托管，没有后端 API
4. 用户尝试登录时，API 请求失败，无法进入系统

## ✅ 解决方案

实现**智能降级机制**：当后端 API 不可用时，自动切换到预览模式使用模拟数据。

### 核心改进

#### 1. 新增预览模式支持脚本 (`public/js/preview-mode.js`)

- 提供完整的模拟数据（客户、回访、订单、仪表盘统计等）
- 拦截 API 请求，在预览模式下返回模拟数据
- 保持与真实 API 相同的数据格式

#### 2. 增强 API 客户端 (`public/js/api-client.js`)

新增方法：
- `getPreviewMode()` - 检查是否处于预览模式
- `setPreviewMode(enabled)` - 设置预览模式状态
- 修改 `isAuthenticated()` - 预览模式下始终返回 true

#### 3. 优化登录流程 (`public/index.html`)

```javascript
// 尝试真实 API 登录
apiClient.login(username, password)
  .then(() => {
    // 成功：正常进入
    window.location.href = 'dashboard.html';
  })
  .catch((err) => {
    // 检测是否为网络错误（API 不可用）
    if (是网络错误) {
      // 自动切换到预览模式
      apiClient.setPreviewMode(true);
      window.location.href = 'dashboard.html';
    } else {
      // 其他错误：显示错误信息
      error = err.message;
    }
  });
```

#### 4. 更新所有页面引用

在所有 HTML 页面的 `<head>` 中添加：
```html
<script src="js/preview-mode.js"></script>
```

确保预览模式脚本在 API 客户端之后、业务逻辑脚本之前加载。

### 修改的文件

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `public/js/preview-mode.js` | 新增 | 预览模式核心逻辑和模拟数据 |
| `public/js/api-client.js` | 修改 | 添加预览模式支持方法 |
| `public/index.html` | 修改 | 优化登录流程，支持自动降级 |
| `public/dashboard.html` | 修改 | 引入预览模式脚本 |
| `public/customers.html` | 修改 | 引入预览模式脚本 |
| `public/customer-detail.html` | 修改 | 引入预览模式脚本 |
| `public/visits.html` | 修改 | 引入预览模式脚本 |
| `public/products.html` | 修改 | 引入预览模式脚本 |
| `public/settings.html` | 修改 | 引入预览模式脚本 |
| `GITHUB_PAGES_SETUP.md` | 新增 | GitHub Pages 部署指南 |

## 🎬 用户体验流程

### 场景 1：有后端 API（Vercel 等）

1. 用户输入正确的用户名密码（如 `admin / admin123`）
2. 系统调用真实 API 验证
3. 验证成功，获取 JWT Token
4. 进入系统，使用真实数据

### 场景 2：无后端 API（GitHub Pages）

1. 用户输入任意用户名和密码
2. 系统尝试调用 API，但请求失败（网络错误）
3. 系统**自动识别**并切换到预览模式
4. 显示"后端 API 不可用，进入预览模式"
5. 进入系统，使用模拟数据
6. 用户可以：
   - ✅ 查看所有页面
   - ✅ 浏览模拟数据
   - ✅ 使用搜索、筛选功能
   - ✅ 体验完整 UI
   - ❌ 无法实际创建/修改/删除数据

## 📊 模拟数据内容

预览模式包含：
- **仪表盘**: 销售额、订单数、客户统计、意向分布、提醒列表
- **客户**: 3 个示例客户（张三、李四、王五）
- **回访记录**: 2 条回访记录
- **产品订单**: 2 个订单
- **预设数据**: 客户分类、意向等级、地区、预算范围等

所有数据格式与真实 API 保持一致。

## 🚀 部署建议

### GitHub Pages 部署

1. 进入仓库 Settings → Pages
2. 选择 Source: `main` 分支
3. 选择 Folder: **`/public`**（而非 `/ (root)` 或 `/frontend-preview`）
4. 保存并等待部署完成

### 验证部署

访问部署的 URL，测试以下功能：
- [ ] 可以访问登录页
- [ ] 输入任意账号可以登录
- [ ] 控制台显示"后端 API 不可用，进入预览模式"
- [ ] 仪表盘显示统计数据
- [ ] 客户列表、回访、订单页面正常
- [ ] 搜索和筛选功能可用
- [ ] 深色模式切换正常

## 🔄 向后兼容性

- ✅ 不影响有后端 API 的正常部署
- ✅ 原有的 `frontend-preview/` 目录保持不变
- ✅ 所有现有功能继续正常工作
- ✅ 预览模式完全透明，不需要用户手动配置

## 📝 额外文档

- [`GITHUB_PAGES_SETUP.md`](GITHUB_PAGES_SETUP.md) - 详细的 GitHub Pages 部署指南
- [`docs/FRONTEND.md`](docs/FRONTEND.md) - 前端功能完整文档
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) - 后端 API 部署指南（Vercel）

## 🎉 总结

现在，`public/` 目录既可以：
1. **连接真实后端 API** - 完整的生产功能
2. **独立运行**（GitHub Pages）- 自动降级到预览模式

用户不再只能看到"预览页面"，而是可以在 GitHub Pages 上**完整体验所有功能**，只是使用的是模拟数据而已。

---

**变更日期**: 2024-12-19  
**分支**: `fix-gh-pages-preview-only`  
**相关 Issue**: 修复 GitHub Pages 只显示预览版的问题
