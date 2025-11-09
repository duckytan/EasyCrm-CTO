// 预览模式支持 - 在没有后端 API 时使用模拟数据

// 检测是否处于预览模式（GitHub Pages 或其他静态托管）
function isPreviewMode() {
  return localStorage.getItem('previewMode') === 'true';
}

// 模拟数据
const mockData = {
  // 仪表盘统计数据
  dashboard: {
    monthlySales: 285680.50,
    monthlyOrders: 62,
    averageOrderValue: 4607.43,
    monthlyNewCustomers: 15,
    monthlyVisits: 28,
    monthlyTransactionCustomers: 38,
    totalCustomers: 120,
    activeCustomers: 45,
    intentionDistribution: [
      { intention: '高意向', count: 25, percentage: 20.83 },
      { intention: '中意向', count: 48, percentage: 40.00 },
      { intention: '低意向', count: 32, percentage: 26.67 },
      { intention: '未分类', count: 15, percentage: 12.50 }
    ],
    importantReminders: [
      {
        type: 'planned_visit',
        customerId: 1,
        customerName: '张三',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        description: '计划回访'
      },
      {
        type: 'product_followup',
        customerId: 2,
        customerName: '李四',
        date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        description: '产品跟进'
      }
    ]
  },

  // 客户列表
  customers: {
    data: [
      {
        id: 1,
        name: '张三',
        company: '阳光科技有限公司',
        category: 'VIP客户',
        intention: '高意向',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        region: '北京市',
        budgetRange: '50-100万',
        createdAt: '2024-01-15T08:00:00Z'
      },
      {
        id: 2,
        name: '李四',
        company: '创新软件公司',
        category: '普通客户',
        intention: '中意向',
        phone: '13800138002',
        email: 'lisi@example.com',
        region: '上海市',
        budgetRange: '20-50万',
        createdAt: '2024-02-10T08:00:00Z'
      },
      {
        id: 3,
        name: '王五',
        company: '智能制造集团',
        category: 'VIP客户',
        intention: '高意向',
        phone: '13800138003',
        email: 'wangwu@example.com',
        region: '深圳市',
        budgetRange: '100万以上',
        createdAt: '2024-03-05T08:00:00Z'
      }
    ],
    total: 3,
    page: 1,
    pageSize: 20
  },

  // 回访记录
  visits: {
    data: [
      {
        id: 1,
        customerId: 1,
        customerName: '张三',
        visitDate: '2024-03-20T08:00:00Z',
        visitMethod: '电话',
        visitType: '常规回访',
        satisfaction: '满意',
        nextSteps: '安排产品演示',
        notes: '客户对产品功能表示满意'
      },
      {
        id: 2,
        customerId: 2,
        customerName: '李四',
        visitDate: '2024-03-18T08:00:00Z',
        visitMethod: '面谈',
        visitType: '跟进',
        satisfaction: '一般',
        nextSteps: '准备方案报价',
        notes: '需要详细了解价格方案'
      }
    ],
    total: 2
  },

  // 产品订单
  products: {
    data: [
      {
        id: 1,
        customerId: 1,
        customerName: '张三',
        presetProductId: 1,
        productName: 'CRM系统标准版',
        quantity: 1,
        unitPrice: 50000,
        totalAmount: 50000,
        purchaseDate: '2024-03-15',
        status: '已交付',
        paymentMethod: '银行转账',
        followUpDate: '2024-06-13',
        afterSalesContact: '售后部'
      },
      {
        id: 2,
        customerId: 3,
        customerName: '王五',
        presetProductId: 2,
        productName: 'CRM系统企业版',
        quantity: 1,
        unitPrice: 150000,
        totalAmount: 150000,
        purchaseDate: '2024-03-10',
        status: '实施中',
        paymentMethod: '银行转账',
        followUpDate: '2024-06-08',
        afterSalesContact: '实施团队'
      }
    ],
    total: 2
  },

  // 预设数据
  presets: {
    'customer-categories': [
      { id: 1, name: 'VIP客户', displayOrder: 1 },
      { id: 2, name: '普通客户', displayOrder: 2 },
      { id: 3, name: '潜在客户', displayOrder: 3 }
    ],
    'customer-intentions': [
      { id: 1, name: '高意向', displayOrder: 1 },
      { id: 2, name: '中意向', displayOrder: 2 },
      { id: 3, name: '低意向', displayOrder: 3 },
      { id: 4, name: '未分类', displayOrder: 4 }
    ],
    'regions': [
      { id: 1, name: '北京市', displayOrder: 1 },
      { id: 2, name: '上海市', displayOrder: 2 },
      { id: 3, name: '深圳市', displayOrder: 3 },
      { id: 4, name: '广州市', displayOrder: 4 }
    ],
    'budget-ranges': [
      { id: 1, name: '10万以下', displayOrder: 1 },
      { id: 2, name: '10-20万', displayOrder: 2 },
      { id: 3, name: '20-50万', displayOrder: 3 },
      { id: 4, name: '50-100万', displayOrder: 4 },
      { id: 5, name: '100万以上', displayOrder: 5 }
    ]
  }
};

// 包装 API 客户端以支持预览模式
if (typeof window !== 'undefined' && window.apiClient) {
  const originalApiClient = window.apiClient;
  
  // 保存原始的请求方法
  const originalRequest = originalApiClient.request.bind(originalApiClient);
  
  // 重写请求方法以支持预览模式
  originalApiClient.request = async function(endpoint, options = {}) {
    if (isPreviewMode()) {
      console.log('[预览模式] 使用模拟数据:', endpoint);
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 根据端点返回模拟数据
      if (endpoint.includes('/dashboard/statistics')) {
        return mockData.dashboard;
      } else if (endpoint.startsWith('/customers/') && !endpoint.includes('?')) {
        const id = parseInt(endpoint.split('/customers/')[1]);
        const customer = mockData.customers.data.find(c => c.id === id);
        if (customer) {
          // 为客户详情页添加额外信息
          return {
            ...customer,
            visits: mockData.visits.data.filter(v => v.customerId === id),
            products: mockData.products.data.filter(p => p.customerId === id)
          };
        }
        return { error: '客户不存在' };
      } else if (endpoint.includes('/customers')) {
        return mockData.customers;
      } else if (endpoint.startsWith('/visits/') && !endpoint.includes('?')) {
        const id = parseInt(endpoint.split('/visits/')[1]);
        const visit = mockData.visits.data.find(v => v.id === id);
        return visit || { error: '回访记录不存在' };
      } else if (endpoint.includes('/visits')) {
        return mockData.visits;
      } else if (endpoint.startsWith('/products/') && !endpoint.includes('?')) {
        const id = parseInt(endpoint.split('/products/')[1]);
        const product = mockData.products.data.find(p => p.id === id);
        return product || { error: '订单不存在' };
      } else if (endpoint.includes('/products/statistics')) {
        return {
          totalSales: 200000,
          totalOrders: 2,
          averageOrderValue: 100000
        };
      } else if (endpoint.includes('/products')) {
        return mockData.products;
      } else if (endpoint.includes('/presets/')) {
        const type = endpoint.split('/presets/')[1].split('?')[0].split('/')[0];
        return mockData.presets[type] || [];
      }
      
      // 默认返回空数据
      return { data: [], total: 0 };
    }
    
    // 非预览模式，调用真实 API
    return originalRequest(endpoint, options);
  };
  
  // 在预览模式下，总是返回 true
  const originalIsAuthenticated = originalApiClient.isAuthenticated.bind(originalApiClient);
  originalApiClient.isAuthenticated = function() {
    if (isPreviewMode()) {
      return true;
    }
    return originalIsAuthenticated();
  };
}

// 导出工具函数
if (typeof window !== 'undefined') {
  window.isPreviewMode = isPreviewMode;
  window.mockData = mockData;
}
