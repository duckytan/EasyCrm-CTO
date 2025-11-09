/**
 * PWA注册和管理
 * 负责注册Service Worker和处理应用更新
 */

(function() {
  'use strict';

  // 检查浏览器是否支持Service Worker
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker 不支持');
    return;
  }

  let refreshing = false;

  // 监听控制器变化（Service Worker更新）
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  // 注册Service Worker
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('Service Worker 注册成功:', registration.scope);

      // 检查更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新的Service Worker已安装，但还在等待激活
            showUpdateNotification(newWorker);
          }
        });
      });

      // 定期检查更新（每小时）
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('Service Worker 注册失败:', error);
    }
  });

  // 显示更新通知
  function showUpdateNotification(worker) {
    const notification = document.createElement('div');
    notification.className = 'pwa-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: calc(var(--bottom-nav-height, 70px) + var(--safe-bottom, 0px) + 16px);
        left: 16px;
        right: 16px;
        max-width: 400px;
        margin: 0 auto;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: 16px;
        box-shadow: var(--color-shadow);
        border: 1px solid var(--color-border);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideUp 0.3s ease;
      ">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">发现新版本</div>
          <div style="font-size: 0.875rem; color: var(--color-text-muted);">
            点击更新以获得最佳体验
          </div>
        </div>
        <button class="btn" style="white-space: nowrap; padding: 8px 16px; font-size: 0.875rem;" onclick="this.closest('div').parentElement.updateApp()">
          立即更新
        </button>
        <button class="btn-ghost" style="padding: 8px; min-width: auto;" onclick="this.closest('div').parentElement.remove()">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    notification.updateApp = () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
      notification.remove();
    };

    document.body.appendChild(notification);

    // 添加动画样式
    if (!document.getElementById('pwa-update-styles')) {
      const style = document.createElement('style');
      style.id = 'pwa-update-styles';
      style.textContent = `
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 安装应用提示（iOS和Android）
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // 可以在这里显示自定义的安装提示
    showInstallPrompt();
  });

  function showInstallPrompt() {
    // 检查是否已经显示过或用户已拒绝
    if (localStorage.getItem('pwa-install-dismissed') === 'true') {
      return;
    }

    // 延迟显示，避免干扰用户
    setTimeout(() => {
      const prompt = document.createElement('div');
      prompt.className = 'pwa-install-prompt';
      prompt.innerHTML = `
        <div style="
          position: fixed;
          bottom: calc(var(--bottom-nav-height, 70px) + var(--safe-bottom, 0px) + 16px);
          left: 16px;
          right: 16px;
          max-width: 400px;
          margin: 0 auto;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: white;
          border-radius: var(--radius-lg);
          padding: 16px;
          box-shadow: var(--color-shadow);
          z-index: 9998;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideUp 0.3s ease;
        ">
          <div style="
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
          ">AI</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">安装到桌面</div>
            <div style="font-size: 0.875rem; opacity: 0.9;">
              快速访问，体验更流畅
            </div>
          </div>
          <button style="
            background: rgba(255, 255, 255, 0.25);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            font-size: 0.875rem;
          " onclick="this.closest('div').parentElement.installApp()">
            安装
          </button>
          <button style="
            background: transparent;
            color: rgba(255, 255, 255, 0.8);
            border: none;
            padding: 8px;
            cursor: pointer;
          " onclick="this.closest('div').parentElement.dismiss()">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      prompt.installApp = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`用户${outcome === 'accepted' ? '接受' : '拒绝'}了安装提示`);
          deferredPrompt = null;
        }
        prompt.remove();
      };

      prompt.dismiss = () => {
        localStorage.setItem('pwa-install-dismissed', 'true');
        prompt.remove();
      };

      document.body.appendChild(prompt);
    }, 3000); // 3秒后显示
  }

  // 监听应用安装成功
  window.addEventListener('appinstalled', () => {
    console.log('PWA 已成功安装');
    deferredPrompt = null;
  });

  // iOS Safari 提示
  if (isIOS() && !isInStandaloneMode()) {
    // 可以显示iOS安装引导
    // showIOSInstallGuide();
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

})();
