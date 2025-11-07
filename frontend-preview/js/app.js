// 全局应用状态和工具函数

(function syncThemePreference() {
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  } catch (error) {
    console.warn('无法同步主题偏好', error);
  }
})();

// 主题管理
function themeManager() {
  return {
    theme: (function () {
      try {
        return localStorage.getItem('theme') || 'light';
      } catch (error) {
        return 'light';
      }
    })(),
    init() {
      this.applyTheme();
    },
    toggle() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      this.applyTheme();
      try {
        localStorage.setItem('theme', this.theme);
      } catch (error) {
        console.warn('无法保存主题偏好', error);
      }
    },
    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.theme);
    }
  };
}

// 底部导航管理
function navManager() {
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  return {
    active: currentPage,
    navigate(url) {
      window.location.href = url;
    }
  };
}

// 模拟数据生成器
const mockData = {
  // 仪表盘统计
  dashboard: {
    stats: {
      monthlySales: 125680.50,
      monthlyOrders: 42,
      avgOrderValue: 2992.39,
      newCustomers: 8,
      visits: 15,
      dealCustomers: 12
    },
    intentions: [
      { level: 'H', name: '高意向', count: 5, color: '#EF4444' },
      { level: 'A', name: 'A类', count: 12, color: '#F97316' },
      { level: 'B', name: 'B类', count: 18, color: '#F59E0B' },
      { level: 'C', name: 'C类', count: 25, color: '#10B981' },
      { level: 'D', name: 'D类', count: 8, color: '#6B7280' }
    ],
    reminders: [
      {
        id: 1,
        type: '计划回访',
        customerName: '张三',
        customerId: 1,
        date: '2024-06-01',
        content: '跟进新产品需求'
      },
      {
        id: 2,
        type: '产品回访',
        customerName: '李四',
        customerId: 2,
        date: '2024-06-05',
        productName: '保湿滋养面霜'
      },
      {
        id: 3,
        type: '客户生日',
        customerName: '王五',
        customerId: 3,
        date: '2024-06-10',
        birthday: '1990-06-10'
      }
    ]
  },
  
  // 客户列表
  customers: [
    {
      id: 1,
      name: '张三',
      company: '创新科技有限公司',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      category: 'vip',
      categoryName: 'VIP客户',
      intention: 'H',
      intentionName: '高意向',
      region: '华东',
      lastVisit: '2024-05-20',
      avatar: 'ZS'
    },
    {
      id: 2,
      name: '李四',
      company: '智慧科技公司',
      phone: '13900139000',
      email: 'lisi@example.com',
      category: 'normal',
      categoryName: '普通客户',
      intention: 'A',
      intentionName: 'A类客户',
      region: '华南',
      lastVisit: '2024-05-18',
      avatar: 'LS'
    },
    {
      id: 3,
      name: '王五',
      company: '企业管理咨询',
      phone: '13700137000',
      email: 'wangwu@example.com',
      category: 'potential',
      categoryName: '潜在客户',
      intention: 'B',
      intentionName: 'B类客户',
      region: '华北',
      lastVisit: '2024-05-15',
      avatar: 'WW'
    }
  ],
  
  // 回访记录
  visits: [
    {
      id: 1,
      customerId: 1,
      customerName: '张三',
      visitTime: '2024-05-20 14:00',
      method: '电话回访',
      type: '计划回访',
      content: '讨论新产品功能需求',
      effect: '良好',
      satisfaction: '满意',
      intention: 'H',
      intentionPrev: 'A',
      followUp: '两周后再次跟进'
    },
    {
      id: 2,
      customerId: 2,
      customerName: '李四',
      visitTime: '2024-05-18 10:30',
      method: '现场拜访',
      type: '产品回访',
      content: '产品使用反馈收集',
      effect: '一般',
      satisfaction: '满意',
      intention: 'A',
      intentionPrev: 'B',
      followUp: '提供额外培训资料'
    }
  ],
  
  // 产品订单
  products: [
    {
      id: 1,
      customerId: 1,
      customerName: '张三',
      productName: '保湿滋养面霜',
      quantity: 5,
      price: 298.00,
      total: 1490.00,
      purchaseDate: '2024-04-01',
      afterSale: '1年质保',
      followUpDate: '2024-07-01',
      status: 'delivered'
    },
    {
      id: 2,
      customerId: 2,
      customerName: '李四',
      productName: '紧致抗皱精华',
      quantity: 3,
      price: 598.00,
      total: 1794.00,
      purchaseDate: '2024-04-10',
      afterSale: '2年质保',
      followUpDate: '2024-07-10',
      status: 'processing'
    }
  ],
  
  // 预设数据类型
  presetCategories: [
    { id: 'customer-categories', name: '客户分类', icon: 'tag' },
    { id: 'customer-intentions', name: '意向等级', icon: 'fire' },
    { id: 'regions', name: '地区管理', icon: 'map' },
    { id: 'budget-ranges', name: '预算范围', icon: 'currency' },
    { id: 'visit-methods', name: '回访方式', icon: 'phone' },
    { id: 'visit-types', name: '回访类型', icon: 'calendar' },
    { id: 'preset-products', name: '预设产品', icon: 'box' }
  ],
  
  // 客户分类示例
  customerCategories: [
    { id: 'vip', name: 'VIP客户', description: '高价值客户', displayOrder: 1 },
    { id: 'normal', name: '普通客户', description: '常规客户', displayOrder: 2 },
    { id: 'potential', name: '潜在客户', description: '待开发客户', displayOrder: 3 }
  ]
};

// 日期格式化
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// 货币格式化
function formatCurrency(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(value);
}

// 相对时间
function relativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
}

// 加载状态管理
function loadingState() {
  return {
    loading: false,
    async delay(ms = 300) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  };
}

// Toast通知
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 12px;';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  const colors = {
    success: 'background: #10B981; color: white;',
    error: 'background: #EF4444; color: white;',
    warning: 'background: #F97316; color: white;',
    info: 'background: #2563EB; color: white;'
  };
  
  toast.style.cssText = `
    ${colors[type] || colors.info}
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 0.9rem;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
    animation: slideInRight 0.3s ease;
  `;
  toast.textContent = message;
  
  document.getElementById('toast-container').appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 简易图表渲染（仪表盘使用）
function renderSimpleChart(canvasId, type, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  // 这里可以使用Chart.js或其他图表库
  // 暂时使用简单的Canvas绘制作为示例
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 添加CSS动画
const animationCSS = `
@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(400px);
    opacity: 0;
  }
}
`;

if (!document.getElementById('app-animations')) {
  const style = document.createElement('style');
  style.id = 'app-animations';
  style.textContent = animationCSS;
  document.head.appendChild(style);
}

// 导出工具函数
window.mockData = mockData;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.relativeTime = relativeTime;
window.showToast = showToast;
window.themeManager = themeManager;
window.navManager = navManager;
window.loadingState = loadingState;

document.addEventListener('DOMContentLoaded', () => {
  const current = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.primary-nav a').forEach((link) => {
    if (link.getAttribute('href') === current) {
      link.classList.add('is-active');
    }
  });
});
