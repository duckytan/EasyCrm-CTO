# AI-CRM PWA 功能指南

## 什么是 PWA？

PWA (Progressive Web App) 是一种渐进式网页应用技术，它让Web应用具有类似原生应用的体验：

- ✅ **离线访问** - 无网络也能使用
- ✅ **安装到桌面** - 像普通应用一样打开
- ✅ **推送通知** - 实时提醒
- ✅ **快速加载** - 缓存加速
- ✅ **全屏体验** - 沉浸式界面

## AI-CRM 的 PWA 功能

### 1. 应用安装

#### Android / Chrome
1. 访问 AI-CRM 网站
2. 系统会自动弹出"安装到主屏幕"提示
3. 点击"安装"按钮
4. 应用将添加到手机主屏幕

#### iOS / Safari
1. 在 Safari 中打开 AI-CRM 网站
2. 点击底部的分享按钮 📤
3. 选择"添加到主屏幕"
4. 输入名称，点击"添加"

#### 桌面版 Chrome / Edge
1. 访问 AI-CRM 网站
2. 地址栏右侧会出现安装图标 ⊕
3. 点击图标，选择"安装"
4. 应用将添加到开始菜单和桌面

### 2. 离线功能

AI-CRM 使用 Service Worker 实现离线缓存：

**缓存策略**：
- **静态资源**（HTML、CSS、JS）：缓存优先，后台更新
- **API请求**：网络优先，失败时使用缓存（5分钟有效期）
- **应用图标**：永久缓存

**离线可用功能**：
- ✅ 浏览已缓存的页面
- ✅ 查看已缓存的客户数据
- ✅ 查看统计信息（缓存数据）
- ⚠️ 新增/修改/删除操作需要网络连接

### 3. 自动更新

当有新版本发布时：
1. Service Worker 会在后台检测更新
2. 自动下载新资源
3. 页面底部显示"发现新版本"通知
4. 点击"立即更新"刷新应用

### 4. 应用配置

#### manifest.json 配置
```json
{
  "name": "AI-CRM 智能客户关系管理系统",
  "short_name": "AI-CRM",
  "theme_color": "#2563eb",
  "background_color": "#2563eb",
  "display": "standalone"
}
```

#### Service Worker 缓存
- **静态缓存**: `ai-crm-v1.0.0::static`
- **数据缓存**: `ai-crm-v1.0.0::data`
- **自动清理**: 旧版本缓存自动删除

## 技术实现

### 文件结构
```
public/
├── manifest.json           # PWA 应用清单
├── service-worker.js       # Service Worker 脚本
├── js/pwa-register.js      # PWA 注册和管理
└── icons/                  # 应用图标
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    └── icon-512x512.png
```

### HTML Meta 标签
```html
<meta name="theme-color" content="#2563eb">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.json">
<link rel="icon" sizes="192x192" href="icons/icon-192x192.png">
<link rel="apple-touch-icon" sizes="192x192" href="icons/icon-192x192.png">
```

### Service Worker 注册
```javascript
// 自动注册
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
```

## 性能优化

### 缓存策略对比
| 资源类型 | 策略 | 说明 |
|---------|------|------|
| HTML页面 | Cache First | 缓存优先，后台更新 |
| CSS/JS | Cache First | 缓存优先，后台更新 |
| 图标 | Cache Only | 永久缓存 |
| API数据 | Network First | 网络优先，5分钟缓存 |

### 加载性能
- **首次访问**: 正常加载，建立缓存
- **再次访问**: 瞬间加载（从缓存）
- **离线访问**: 使用缓存数据

## 浏览器支持

| 浏览器 | 版本 | PWA 支持 | 安装支持 |
|--------|------|---------|---------|
| Chrome | 67+ | ✅ 完整支持 | ✅ 支持 |
| Edge | 79+ | ✅ 完整支持 | ✅ 支持 |
| Firefox | 60+ | ✅ 完整支持 | ⚠️ 部分支持 |
| Safari | 11.1+ | ⚠️ 部分支持 | ✅ 支持（手动） |
| Opera | 54+ | ✅ 完整支持 | ✅ 支持 |

## 维护和调试

### 清除缓存
在开发者工具中：
1. 打开 Chrome DevTools
2. 进入 Application 标签
3. 选择 Storage → Clear Storage
4. 勾选所有选项，点击 "Clear site data"

### 手动更新
```javascript
// 发送消息给 Service Worker
navigator.serviceWorker.controller.postMessage({
  type: 'SKIP_WAITING'
});
```

### 查看缓存
```javascript
// 在控制台执行
caches.keys().then(console.log);
caches.open('ai-crm-v1.0.0::static').then(cache => {
  cache.keys().then(console.log);
});
```

## 常见问题

### Q: 如何卸载 PWA？
**A**: 
- **Android**: 长按应用图标 → 卸载
- **iOS**: 长按应用图标 → 删除应用
- **桌面**: 在应用设置中卸载

### Q: 更新不生效怎么办？
**A**: 
1. 关闭所有标签页
2. 清除浏览器缓存
3. 重新打开应用

### Q: 离线时能做什么？
**A**: 
- 可以浏览已缓存的页面
- 可以查看已缓存的数据
- 不能执行需要网络的操作（增删改）

### Q: 如何判断是否在离线状态？
**A**: 
系统会自动检测网络状态，离线时会提示用户

## 安全考虑

1. **HTTPS 必需**: PWA 只能在 HTTPS 环境下工作
2. **同源策略**: Service Worker 遵循同源策略
3. **缓存安全**: 敏感数据不应缓存在 Service Worker 中
4. **定期更新**: Service Worker 每24小时检查一次更新

## 未来规划

- [ ] 推送通知功能
- [ ] 后台同步（Background Sync）
- [ ] 离线数据同步队列
- [ ] 更智能的缓存策略
- [ ] 网络状态指示器
- [ ] 离线数据编辑（待同步）

## 参考资源

- [PWA 官方文档](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Can I Use - PWA](https://caniuse.com/serviceworkers)

---

**版本**: 1.0.0  
**更新日期**: 2024-12-19  
**维护者**: AI-CRM 开发团队
