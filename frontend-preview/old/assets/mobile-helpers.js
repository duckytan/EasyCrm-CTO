/**
 * AI-CRM Mobile Helper Functions
 * 增强移动端交互和优化
 */

(function () {
  'use strict';

  // 检测滚动到表格末端
  function initTableScrollIndicator() {
    const tableContainers = document.querySelectorAll('.responsive-table-container');
    
    tableContainers.forEach(container => {
      const checkScroll = () => {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          container.classList.add('scrolled-end');
        } else {
          container.classList.remove('scrolled-end');
        }
      };
      
      container.addEventListener('scroll', checkScroll);
      checkScroll(); // 初始检查
    });
  }

  // 移动端操作菜单
  function initActionMenus() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.action-menu-trigger');
      
      if (trigger) {
        e.stopPropagation();
        const menu = trigger.nextElementSibling;
        if (menu && menu.classList.contains('action-menu-dropdown')) {
          menu.classList.toggle('active');
        }
        
        // 关闭其他菜单
        document.querySelectorAll('.action-menu-dropdown').forEach(m => {
          if (m !== menu) {
            m.classList.remove('active');
          }
        });
      } else {
        // 点击外部关闭所有菜单
        document.querySelectorAll('.action-menu-dropdown').forEach(m => {
          m.classList.remove('active');
        });
      }
    });
  }

  // 筛选器折叠/展开
  function initFilterToggle() {
    const toggleBtns = document.querySelectorAll('.filter-collapse-toggle');
    
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const content = btn.nextElementSibling;
        if (content && content.classList.contains('filter-content')) {
          content.classList.toggle('expanded');
          
          // 更新图标
          const icon = btn.querySelector('svg');
          if (icon && content.classList.contains('expanded')) {
            icon.style.transform = 'rotate(180deg)';
          } else if (icon) {
            icon.style.transform = 'rotate(0deg)';
          }
        }
      });
    });
  }

  // 优化触摸反馈
  function initTouchFeedback() {
    const clickables = document.querySelectorAll('button, a, .clickable');
    
    clickables.forEach(element => {
      element.addEventListener('touchstart', function() {
        this.style.opacity = '0.7';
      }, { passive: true });
      
      element.addEventListener('touchend', function() {
        setTimeout(() => {
          this.style.opacity = '';
        }, 100);
      }, { passive: true });
      
      element.addEventListener('touchcancel', function() {
        this.style.opacity = '';
      }, { passive: true });
    });
  }

  // 防止iOS缩放
  function preventIOSZoom() {
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
      });
    }
  }

  // 监听视口变化
  function handleViewportResize() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // 重新初始化表格滚动指示器
        initTableScrollIndicator();
      }, 250);
    });
  }

  // 改进表单输入体验
  function improveFormInputs() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // iOS输入时防止自动缩放
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        input.addEventListener('focus', () => {
          document.body.classList.add('ios-input-focus');
        });
        
        input.addEventListener('blur', () => {
          document.body.classList.remove('ios-input-focus');
          window.scrollTo(0, 0); // 重置滚动
        });
      }
      
      // 添加清除按钮到搜索框
      if (input.type === 'search' && !input.nextElementSibling?.classList.contains('clear-search')) {
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'clear-search';
        clearBtn.innerHTML = '×';
        clearBtn.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 20px; color: #6B7280; cursor: pointer; display: none;';
        
        if (input.parentElement.style.position !== 'relative') {
          input.parentElement.style.position = 'relative';
        }
        
        input.parentElement.appendChild(clearBtn);
        
        input.addEventListener('input', () => {
          clearBtn.style.display = input.value ? 'block' : 'none';
        });
        
        clearBtn.addEventListener('click', () => {
          input.value = '';
          input.focus();
          clearBtn.style.display = 'none';
          input.dispatchEvent(new Event('input'));
        });
      }
    });
  }

  // 懒加载图片
  function initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // 优化长列表性能（虚拟滚动提示）
  function optimizeListPerformance() {
    const lists = document.querySelectorAll('.mobile-cards');
    
    lists.forEach(list => {
      if (list.children.length > 50) {
        console.warn('建议为超过50项的列表实现虚拟滚动以提升性能');
      }
    });
  }

  // 添加下拉刷新提示（可选）
  function initPullToRefresh() {
    let touchStartY = 0;
    let touchCurrentY = 0;
    const threshold = 80;
    
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      touchCurrentY = e.touches[0].clientY;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop === 0 && touchCurrentY > touchStartY) {
        const distance = touchCurrentY - touchStartY;
        if (distance > threshold) {
          // 可以在这里添加刷新UI
          // console.log('下拉刷新触发');
        }
      }
    }, { passive: true });
  }

  // 安全区域适配
  function handleSafeArea() {
    if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
      document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
      document.documentElement.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
    }
  }

  // 键盘弹出时调整视图
  function handleKeyboardShow() {
    let visualViewport = window.visualViewport;
    
    if (visualViewport) {
      visualViewport.addEventListener('resize', () => {
        const focusedElement = document.activeElement;
        if (focusedElement && (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA')) {
          const elementRect = focusedElement.getBoundingClientRect();
          const viewportHeight = visualViewport.height;
          
          // 如果输入框被键盘遮挡，滚动到视图中
          if (elementRect.bottom > viewportHeight) {
            setTimeout(() => {
              focusedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }
        }
      });
    }
  }

  // 添加返回顶部按钮
  function initBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
      </svg>
    `;
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #2563EB;
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 100;
      transition: all 0.3s;
    `;
    
    document.body.appendChild(backToTopBtn);
    
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        backToTopBtn.style.display = 'flex';
      } else {
        backToTopBtn.style.display = 'none';
      }
    });
    
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 检测网络状态
  function initNetworkStatus() {
    if ('onLine' in navigator) {
      const updateOnlineStatus = () => {
        if (!navigator.onLine) {
          showNotification('网络连接已断开', 'warning');
        }
      };
      
      window.addEventListener('online', () => {
        showNotification('网络已连接', 'success');
      });
      
      window.addEventListener('offline', updateOnlineStatus);
      
      if (!navigator.onLine) {
        updateOnlineStatus();
      }
    }
  }

  // 简单通知系统
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideDown 0.3s ease-out;
    `;
    
    const colors = {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#2563EB'
    };
    
    notification.style.background = colors[type] || colors.info;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // 添加CSS动画
  function injectAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
      }
      .ios-input-focus { position: fixed; width: 100%; }
    `;
    document.head.appendChild(style);
  }

  // 主初始化函数
  function init() {
    // 只在移动设备上运行某些功能
    const isMobile = window.innerWidth <= 1024;
    
    initTableScrollIndicator();
    initActionMenus();
    initFilterToggle();
    
    if (isMobile) {
      improveFormInputs();
      preventIOSZoom();
      handleSafeArea();
      handleKeyboardShow();
      initBackToTop();
      initNetworkStatus();
      injectAnimations();
      // initPullToRefresh(); // 可选功能
    }
    
    initLazyLoading();
    handleViewportResize();
    optimizeListPerformance();
  }

  // DOMContentLoaded时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 导出工具函数供外部使用
  window.MobileHelpers = {
    showNotification,
    initTableScrollIndicator,
    initActionMenus
  };
})();
