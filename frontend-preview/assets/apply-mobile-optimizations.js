/**
 * 自动应用移动端优化到所有表格的脚本
 * 使用方法：将此脚本添加到页面底部，自动为现有表格添加响应式支持
 */

(function () {
  'use strict';

  // 自动为所有表格添加data-label属性
  function addDataLabels() {
    const tables = document.querySelectorAll('table:not(.responsive-table)');
    
    tables.forEach(table => {
      // 添加响应式类
      table.classList.add('responsive-table');
      
      // 获取表头
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      
      // 为每个td添加data-label
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
          if (headers[index] && !cell.hasAttribute('data-label')) {
            cell.setAttribute('data-label', headers[index]);
          }
        });
      });
    });
  }

  // 为操作列添加移动端菜单
  function convertActionsToMobile() {
    const actionCells = document.querySelectorAll('td[data-label="操作"]');
    
    actionCells.forEach(cell => {
      // 检查是否已经有移动端菜单
      if (cell.querySelector('.mobile-actions')) {
        return;
      }
      
      // 获取现有操作按钮
      const actions = Array.from(cell.querySelectorAll('a, button')).filter(el => 
        !el.closest('.mobile-actions') && !el.closest('.desktop-actions')
      );
      
      if (actions.length === 0) return;
      
      // 包装桌面端操作
      const desktopWrapper = document.createElement('div');
      desktopWrapper.className = 'desktop-actions hidden sm:inline-flex items-center gap-2';
      
      actions.forEach(action => {
        const clone = action.cloneNode(true);
        desktopWrapper.appendChild(clone);
        action.style.display = 'none';
      });
      
      // 创建移动端菜单
      const mobileWrapper = document.createElement('div');
      mobileWrapper.className = 'mobile-actions action-menu sm:hidden';
      
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'action-menu-trigger w-full justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium';
      trigger.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
        </svg>
        操作
      `;
      
      const dropdown = document.createElement('div');
      dropdown.className = 'action-menu-dropdown';
      
      actions.forEach(action => {
        const menuItem = document.createElement(action.tagName.toLowerCase());
        menuItem.className = 'action-menu-item';
        menuItem.textContent = action.textContent.trim();
        
        if (action.href) {
          menuItem.href = action.href;
        }
        
        if (action.onclick) {
          menuItem.onclick = action.onclick;
        }
        
        // 检测删除操作
        if (action.textContent.includes('删除') || action.className.includes('red')) {
          menuItem.classList.add('danger');
        }
        
        dropdown.appendChild(menuItem);
      });
      
      mobileWrapper.appendChild(trigger);
      mobileWrapper.appendChild(dropdown);
      
      cell.appendChild(desktopWrapper);
      cell.appendChild(mobileWrapper);
      
      // 更新cell class
      cell.classList.add('sm:text-right');
    });
  }

  // 包装表格容器
  function wrapTableContainer() {
    const tables = document.querySelectorAll('table.responsive-table');
    
    tables.forEach(table => {
      const parent = table.parentElement;
      
      // 检查是否已经有容器
      if (parent.classList.contains('responsive-table-container')) {
        return;
      }
      
      // 检查父元素是否有overflow-x-auto
      if (parent.classList.contains('overflow-x-auto') && !parent.classList.contains('responsive-table-container')) {
        parent.classList.add('responsive-table-container');
        
        // 添加滚动提示
        if (!parent.querySelector('.scroll-hint')) {
          const hint = document.createElement('div');
          hint.className = 'scroll-hint lg:hidden';
          hint.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
            <span>左右滑动查看更多</span>
          `;
          parent.insertBefore(hint, table);
        }
      }
    });
  }

  // 主函数
  function autoApplyOptimizations() {
    console.log('🔧 正在自动应用移动端表格优化...');
    
    try {
      addDataLabels();
      console.log('✓ 已添加 data-label 属性');
      
      convertActionsToMobile();
      console.log('✓ 已转换操作按钮为移动端菜单');
      
      wrapTableContainer();
      console.log('✓ 已包装表格容器');
      
      // 重新初始化移动端辅助功能
      if (window.MobileHelpers) {
        window.MobileHelpers.initTableScrollIndicator();
        window.MobileHelpers.initActionMenus();
        console.log('✓ 已重新初始化移动端辅助功能');
      }
      
      console.log('✅ 移动端优化应用完成！');
    } catch (error) {
      console.error('❌ 应用移动端优化时出错:', error);
    }
  }

  // 在DOM加载完成后自动运行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoApplyOptimizations);
  } else {
    autoApplyOptimizations();
  }

  // 导出函数供外部使用
  window.ApplyMobileOptimizations = {
    autoApply: autoApplyOptimizations,
    addDataLabels,
    convertActionsToMobile,
    wrapTableContainer
  };
})();
