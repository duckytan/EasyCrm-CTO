# 🎨 AI-CRM 前端界面预览

这是一个独立的前端界面预览模板，用于展示 AI-CRM 系统的设计风格和交互效果。

## 📁 文件说明

- [`index.html`](./index.html) - 登录页面
- [`dashboard.html`](./dashboard.html) - 仪表盘（主页）
- [`customers.html`](./customers.html) - 客户列表页
- [`customer-detail.html`](./customer-detail.html) - 客户详情页
- [`visits.html`](./visits.html) - 回访记录页
- [`products.html`](./products.html) - 产品订单页
- [`presets.html`](./presets.html) - 预设数据管理页
- [`settings.html`](./settings.html) - 用户设置页
- [`assets/`](./assets/) - 样式和脚本（如果需要）

## 🚀 如何预览

### 方式 1: 直接打开文件
双击 `index.html` 在浏览器中打开即可查看登录页面。

### 方式 2: 使用本地服务器（推荐）
```bash
# 在 frontend-preview 目录下运行
python3 -m http.server 8080

# 或使用 Node.js
npx http-server -p 8080
```

然后访问：http://localhost:8080

## 🎨 设计特点

- ✨ 现代简洁的 UI 设计
- 🌓 深色/浅色主题切换
- 📱 完全响应式（手机、平板、桌面）
- 🎯 符合 AI-CRM UI 设计规范
- 🔄 流畅的交互动画
- 📊 图表和数据可视化
- 🎭 使用模拟数据展示效果

## 🛠️ 技术栈

- **Tailwind CSS** (CDN) - 现代化样式框架
- **Alpine.js** (CDN) - 轻量级交互框架
- **Heroicons** - 图标库
- **Chart.js** - 图表库（仪表盘使用）
- 纯 HTML/CSS/JavaScript - 无需构建步骤

## 📝 注意事项

这是一个**静态预览模板**，使用模拟数据：
- 登录功能是模拟的（任意账号密码都能登录）
- 数据修改不会保存
- 仅用于展示 UI 风格和交互效果

如果满意这个设计，我将把它集成到实际项目中，连接真实的后端 API。

## 🎯 预览重点

1. **视觉风格** - 颜色、字体、布局是否符合预期
2. **交互体验** - 按钮、表单、弹窗等交互是否流畅
3. **响应式效果** - 调整浏览器宽度查看不同设备的适配
4. **深色模式** - 点击右上角切换查看深浅主题
5. **功能完整性** - 各个页面是否涵盖所有需求

## 📞 反馈

预览后请告知：
- ✅ 满意，可以集成到项目
- 🔧 需要调整（指出具体部分）
- ❌ 不满意，重新设计
