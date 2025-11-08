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

// 搜索字段配置
const SEARCH_FIELD_CONFIGS = Object.freeze({
  customer: [
    { accessor: item => item.name, weight: 120 },
    { accessor: item => item.company, weight: 110 },
    { accessor: item => item.phone, weight: 100 },
    { accessor: item => item.email, weight: 80 },
    { accessor: item => item.wechat, weight: 70 },
    { accessor: item => item.position, weight: 70 },
    { accessor: item => [item.categoryName, item.category], weight: 65 },
    { accessor: item => [item.intentionName, item.intention], weight: 65 },
    { accessor: item => [item.regionDetail, item.region], weight: 60 },
    { accessor: item => item.source, weight: 55 },
    { accessor: item => item.notes, weight: 50 },
    { accessor: item => item.budget, weight: 45 },
    { accessor: item => [item.totalOrders, item.totalAmount], weight: 40 },
    { accessor: item => [item.createTime, item.lastVisit, item.birthday], weight: 35 }
  ],
  product: [
    { accessor: item => item.productName, weight: 120 },
    { accessor: item => item.customerName, weight: 110 },
    { accessor: item => item.productCode, weight: 100 },
    { accessor: item => [item.statusText, item.status], weight: 80 },
    { accessor: item => item.deliveryAddress, weight: 70 },
    { accessor: item => item.orderNote, weight: 60 },
    { accessor: item => item.afterSale, weight: 55 },
    { accessor: item => [item.purchaseDate, item.followUpDate, item.warranty], weight: 50 },
    { accessor: item => [item.quantity, item.price, item.total], weight: 45 }
  ],
  visit: [
    { accessor: item => item.customerName, weight: 120 },
    { accessor: item => item.content, weight: 105 },
    { accessor: item => item.type, weight: 95 },
    { accessor: item => item.method, weight: 85 },
    { accessor: item => item.effect, weight: 70 },
    { accessor: item => item.followUp, weight: 65 },
    { accessor: item => [item.satisfaction, item.intention, item.intentionPrev], weight: 60 },
    { accessor: item => [item.visitTime, item.nextVisitDate], weight: 55 },
    { accessor: item => item.duration, weight: 45 }
  ]
});

function applyPrioritySearch(items, keyword, fieldConfigs) {
  if (!Array.isArray(items)) {
    return [];
  }

  const trimmedKeyword = (keyword || '').trim();
  if (!trimmedKeyword) {
    return items.slice();
  }

  const lowerKeyword = trimmedKeyword.toLowerCase();
  const configs = Array.isArray(fieldConfigs) ? fieldConfigs : [];
  const results = [];

  items.forEach((item, originalIndex) => {
    let score = 0;

    for (const config of configs) {
      const rawValue = typeof config.accessor === 'function'
        ? config.accessor(item)
        : item && config.field ? item[config.field] : undefined;

      const values = Array.isArray(rawValue) ? rawValue : [rawValue];

      for (const value of values) {
        if (value === undefined || value === null) {
          continue;
        }

        const text = String(value).toLowerCase();
        if (!text) {
          continue;
        }

        const position = text.indexOf(lowerKeyword);
        if (position === -1) {
          continue;
        }

        let weight = config.weight || 1;
        if (text === lowerKeyword) {
          weight *= 3;
        } else if (position === 0) {
          weight *= 2;
        }

        score += weight;
        break;
      }
    }

    if (score > 0) {
      results.push({ item, score, index: originalIndex });
    }
  });

  if (!results.length) {
    return [];
  }

  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.index - b.index;
  });

  return results.map(entry => entry.item);
}

// 模拟数据生成器
const mockData = {
  // 仪表盘统计
  dashboard: {
    stats: {
      monthlySales: 285680.50,
      monthlyOrders: 62,
      avgOrderValue: 4607.43,
      newCustomers: 15,
      visits: 28,
      dealCustomers: 18,
      totalCustomers: 68,
      activeCustomers: 45
    },
    intentions: [
      { level: 'H', name: '高意向（已签约）', count: 8, color: '#EF4444', description: '已成交客户' },
      { level: 'A', name: 'A类（强意向）', count: 15, color: '#F97316', description: '购买意愿强烈' },
      { level: 'B', name: 'B类（有意向）', count: 22, color: '#F59E0B', description: '有一定意向' },
      { level: 'C', name: 'C类（观望中）', count: 16, color: '#10B981', description: '还在观望' },
      { level: 'D', name: 'D类（待培育）', count: 7, color: '#6B7280', description: '需要长期培养' }
    ],
    reminders: [
      {
        id: 1,
        type: '计划回访',
        customerName: '张三',
        customerId: 1,
        date: '2024-06-01',
        content: '跟进新产品需求，讨论订单细节',
        priority: 'high'
      },
      {
        id: 2,
        type: '产品回访',
        customerName: '李四',
        customerId: 2,
        date: '2024-06-05',
        productName: '保湿滋养面霜',
        content: '回访产品使用效果，收集反馈',
        priority: 'normal'
      },
      {
        id: 3,
        type: '客户生日',
        customerName: '王五',
        customerId: 3,
        date: '2024-06-10',
        birthday: '1990-06-10',
        content: '送上生日祝福，维护客户关系',
        priority: 'normal'
      },
      {
        id: 4,
        type: '合同到期',
        customerName: '赵六',
        customerId: 4,
        date: '2024-06-15',
        content: '服务合同即将到期，联系续约',
        priority: 'high'
      },
      {
        id: 5,
        type: '产品回访',
        customerName: '周九',
        customerId: 7,
        date: '2024-06-03',
        productName: '企业数字化升级套餐',
        content: '新订单首次回访，收集使用反馈',
        priority: 'high'
      },
      {
        id: 6,
        type: '客户生日',
        customerName: '吴十',
        customerId: 8,
        date: '2024-06-12',
        birthday: '1987-12-08',
        content: '发送生日祝福，加深客户关系',
        priority: 'normal'
      }
    ],
    recentActivities: [
      { type: 'order', customer: '周九', time: '30分钟前', content: '签订企业数字化升级大单 ¥198,000' },
      { type: 'visit', customer: '钱十二', time: '2小时前', content: '完成产品演示，客户反馈优秀' },
      { type: 'order', customer: '吴十', time: '3小时前', content: '购买技术支持服务包' },
      { type: 'visit', customer: '张三', time: '5小时前', content: '跟进新产品需求讨论' },
      { type: 'customer', customer: '郑十一', time: '1天前', content: '新增潜在客户，待培育' },
      { type: 'order', customer: '钱十二', time: '1天前', content: '订购多门店运营管理模块' }
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
      regionDetail: '上海市浦东新区',
      lastVisit: '2024-05-20',
      avatar: 'ZS',
      budget: '10-30万',
      source: '线上推广',
      createTime: '2023-08-15',
      totalOrders: 8,
      totalAmount: 85600.00,
      notes: '重要客户，注重产品品质和服务',
      birthday: '1985-03-12',
      wechat: 'zhangsan_wx',
      position: '采购总监'
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
      regionDetail: '深圳市南山区',
      lastVisit: '2024-05-18',
      avatar: 'LS',
      budget: '5-10万',
      source: '老客户推荐',
      createTime: '2023-10-20',
      totalOrders: 5,
      totalAmount: 42800.00,
      notes: '对价格敏感，需要定期优惠',
      birthday: '1990-07-22',
      wechat: 'lisi2024',
      position: '运营经理'
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
      regionDetail: '北京市朝阳区',
      lastVisit: '2024-05-15',
      avatar: 'WW',
      budget: '3-5万',
      source: '展会接触',
      createTime: '2024-03-08',
      totalOrders: 2,
      totalAmount: 8900.00,
      notes: '初次合作，需要建立信任',
      birthday: '1988-11-05',
      wechat: 'wangwu88',
      position: '项目负责人'
    },
    {
      id: 4,
      name: '赵六',
      company: '华夏贸易集团',
      phone: '13600136000',
      email: 'zhaoliu@example.com',
      category: 'vip',
      categoryName: 'VIP客户',
      intention: 'H',
      intentionName: '高意向',
      region: '华东',
      regionDetail: '杭州市西湖区',
      lastVisit: '2024-05-22',
      avatar: 'ZL',
      budget: '30-50万',
      source: '商业合作伙伴',
      createTime: '2023-05-10',
      totalOrders: 12,
      totalAmount: 156000.00,
      notes: '长期合作客户，有多个项目需求',
      birthday: '1982-02-18',
      wechat: 'zhao_liu',
      position: '总经理'
    },
    {
      id: 5,
      name: '陈七',
      company: '天成电子商务',
      phone: '13500135000',
      email: 'chenqi@example.com',
      category: 'normal',
      categoryName: '普通客户',
      intention: 'B',
      intentionName: 'B类客户',
      region: '华南',
      regionDetail: '广州市天河区',
      lastVisit: '2024-05-10',
      avatar: 'CQ',
      budget: '5-10万',
      source: '线上咨询',
      createTime: '2024-01-15',
      totalOrders: 3,
      totalAmount: 18500.00,
      notes: '电商行业，订单频率高',
      birthday: '1992-09-30',
      wechat: 'chenqi_tc',
      position: '电商主管'
    },
    {
      id: 6,
      name: '孙八',
      company: '锦绣文化传媒',
      phone: '13400134000',
      email: 'sunba@example.com',
      category: 'potential',
      categoryName: '潜在客户',
      intention: 'C',
      intentionName: 'C类客户',
      region: '华中',
      regionDetail: '武汉市江汉区',
      lastVisit: '2024-04-28',
      avatar: 'SB',
      budget: '3-5万',
      source: '电话营销',
      createTime: '2024-04-05',
      totalOrders: 1,
      totalAmount: 3200.00,
      notes: '首次购买，观望中',
      birthday: '1995-06-14',
      wechat: 'sunba95',
      position: '市场专员'
    },
    {
      id: 7,
      name: '周九',
      company: '远大物流集团',
      phone: '13300133000',
      email: 'zhoujiu@example.com',
      category: 'vip',
      categoryName: 'VIP客户',
      intention: 'A',
      intentionName: 'A类客户',
      region: '华东',
      regionDetail: '南京市江宁区',
      lastVisit: '2024-05-25',
      avatar: 'ZJ',
      budget: '50万以上',
      source: '大客户推荐',
      createTime: '2023-03-05',
      totalOrders: 15,
      totalAmount: 268900.00,
      notes: '物流行业龙头企业，年度合作客户',
      birthday: '1978-08-20',
      wechat: 'zhou_logistics',
      position: '副总经理'
    },
    {
      id: 8,
      name: '吴十',
      company: '智联科技服务',
      phone: '13200132000',
      email: 'wushi@example.com',
      category: 'normal',
      categoryName: '普通客户',
      intention: 'B',
      intentionName: 'B类客户',
      region: '华南',
      regionDetail: '深圳市福田区',
      lastVisit: '2024-05-12',
      avatar: 'WS',
      budget: '10-30万',
      source: '网络广告',
      createTime: '2024-02-18',
      totalOrders: 4,
      totalAmount: 28600.00,
      notes: 'IT服务行业，重视技术支持',
      birthday: '1987-12-08',
      wechat: 'wushi_tech',
      position: '技术总监'
    },
    {
      id: 9,
      name: '郑十一',
      company: '金石投资咨询',
      phone: '13100131000',
      email: 'zheng11@example.com',
      category: 'potential',
      categoryName: '潜在客户',
      intention: 'D',
      intentionName: 'D类客户',
      region: '华北',
      regionDetail: '北京市海淀区',
      lastVisit: '2024-04-20',
      avatar: 'Z1',
      budget: '3万以下',
      source: '客户自主咨询',
      createTime: '2024-04-10',
      totalOrders: 0,
      totalAmount: 0.00,
      notes: '投资行业，尚未成交，需要长期培育',
      birthday: '1993-05-16',
      wechat: 'zheng_invest',
      position: '投资顾问'
    },
    {
      id: 10,
      name: '钱十二',
      company: '旭日餐饮连锁',
      phone: '13000130000',
      email: 'qian12@example.com',
      category: 'normal',
      categoryName: '普通客户',
      intention: 'A',
      intentionName: 'A类客户',
      region: '华东',
      regionDetail: '杭州市滨江区',
      lastVisit: '2024-05-22',
      avatar: 'Q2',
      budget: '10-30万',
      source: '线下展会',
      createTime: '2023-11-28',
      totalOrders: 6,
      totalAmount: 52300.00,
      notes: '餐饮连锁企业，有扩展需求',
      birthday: '1985-01-25',
      wechat: 'qian_food',
      position: '区域经理'
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
      content: '详细讨论了新产品功能需求，客户对智能化功能很感兴趣，希望能在下个月安排产品演示。提到了预算范围在20-30万之间。',
      effect: '良好',
      satisfaction: '非常满意',
      intention: 'H',
      intentionPrev: 'A',
      followUp: '两周后安排产品演示会，准备详细方案',
      duration: 35,
      nextVisitDate: '2024-06-03'
    },
    {
      id: 2,
      customerId: 2,
      customerName: '李四',
      visitTime: '2024-05-18 10:30',
      method: '现场拜访',
      type: '产品回访',
      content: '现场查看了产品使用情况，客户反馈整体满意但提出了3个优化建议。已记录并承诺在下个版本改进。',
      effect: '一般',
      satisfaction: '满意',
      intention: 'A',
      intentionPrev: 'B',
      followUp: '提供额外培训资料，一个月后回访使用情况',
      duration: 90,
      nextVisitDate: '2024-06-18'
    },
    {
      id: 3,
      customerId: 3,
      customerName: '王五',
      visitTime: '2024-05-15 16:20',
      method: '线上会议',
      type: '需求沟通',
      content: '通过视频会议了解了客户的具体需求场景，包括用户规模约50人，预计使用周期2年。讨论了定制化方案的可行性。',
      effect: '良好',
      satisfaction: '满意',
      intention: 'B',
      intentionPrev: 'B',
      followUp: '准备定制化方案报价，一周内提交',
      duration: 45,
      nextVisitDate: '2024-05-22'
    },
    {
      id: 4,
      customerId: 4,
      customerName: '赵六',
      visitTime: '2024-05-22 09:15',
      method: '现场拜访',
      type: '合同续约',
      content: '拜访客户讨论合同续约事宜，客户表示非常满意现有服务，愿意续约并增加服务范围。现场签署了意向协议。',
      effect: '优秀',
      satisfaction: '非常满意',
      intention: 'H',
      intentionPrev: 'H',
      followUp: '一周内准备正式合同，安排法务审核',
      duration: 120,
      nextVisitDate: '2024-06-22'
    },
    {
      id: 5,
      customerId: 5,
      customerName: '陈七',
      visitTime: '2024-05-10 14:45',
      method: '电话回访',
      type: '订单回访',
      content: '回访上个月订单情况，客户反馈物流及时，产品质量符合预期。询问了批量采购优惠政策。',
      effect: '良好',
      satisfaction: '满意',
      intention: 'B',
      intentionPrev: 'C',
      followUp: '发送批量采购优惠方案，等待客户反馈',
      duration: 25,
      nextVisitDate: '2024-06-10'
    },
    {
      id: 6,
      customerId: 6,
      customerName: '孙八',
      visitTime: '2024-04-28 11:20',
      method: '微信沟通',
      type: '需求沟通',
      content: '通过微信了解客户对新产品的兴趣，客户表示需要时间考虑预算问题，目前处于观望阶段。',
      effect: '一般',
      satisfaction: '一般',
      intention: 'C',
      intentionPrev: 'C',
      followUp: '保持定期联系，关注客户预算审批进度',
      duration: 15,
      nextVisitDate: '2024-06-08'
    },
    {
      id: 7,
      customerId: 7,
      customerName: '周九',
      visitTime: '2024-05-25 15:30',
      method: '现场拜访',
      type: '合同续约',
      content: '上门拜访VIP客户，商谈年度续约事宜。客户对服务质量非常满意，当场确认续约意向，并新增两个子项目合作。',
      effect: '优秀',
      satisfaction: '非常满意',
      intention: 'A',
      intentionPrev: 'A',
      followUp: '准备续约合同及新项目方案，下周提交审批',
      duration: 150,
      nextVisitDate: '2024-07-25'
    },
    {
      id: 8,
      customerId: 8,
      customerName: '吴十',
      visitTime: '2024-05-12 10:00',
      method: '线上会议',
      type: '技术支持',
      content: '通过在线会议解决客户遇到的系统集成问题，提供了技术方案和培训指导。客户表示满意，愿意增加技术支持服务购买。',
      effect: '良好',
      satisfaction: '满意',
      intention: 'B',
      intentionPrev: 'B',
      followUp: '提供技术支持服务报价单，等待采购审批',
      duration: 60,
      nextVisitDate: '2024-06-12'
    },
    {
      id: 9,
      customerId: 9,
      customerName: '郑十一',
      visitTime: '2024-04-20 16:45',
      method: '电话回访',
      type: '计划回访',
      content: '定期回访新客户，了解客户公司近期业务规划。客户表示暂时没有采购需求，建议过段时间再联系。',
      effect: '一般',
      satisfaction: '一般',
      intention: 'D',
      intentionPrev: 'D',
      followUp: '持续关注，等待客户业务发展时机',
      duration: 12,
      nextVisitDate: '2024-07-20'
    },
    {
      id: 10,
      customerId: 10,
      customerName: '钱十二',
      visitTime: '2024-05-22 13:15',
      method: '现场拜访',
      type: '产品演示',
      content: '到客户总部进行新产品演示，展示了最新功能。客户对产品智能化功能很感兴趣，准备向总部申请采购预算。',
      effect: '优秀',
      satisfaction: '非常满意',
      intention: 'A',
      intentionPrev: 'B',
      followUp: '提供详细报价方案，协助客户准备采购申请材料',
      duration: 90,
      nextVisitDate: '2024-06-20'
    }
  ],
  
  // 产品订单
  products: [
    {
      id: 1,
      customerId: 1,
      customerName: '张三',
      productName: '保湿滋养面霜',
      productCode: 'SK-001',
      quantity: 5,
      price: 298.00,
      total: 1490.00,
      purchaseDate: '2024-04-01',
      afterSale: '1年质保',
      followUpDate: '2024-07-01',
      status: 'delivered',
      statusText: '已交付',
      deliveryAddress: '上海市浦东新区张江高科技园区',
      orderNote: '客户要求加急处理',
      warranty: '2025-04-01'
    },
    {
      id: 2,
      customerId: 2,
      customerName: '李四',
      productName: '紧致抗皱精华',
      productCode: 'SK-002',
      quantity: 3,
      price: 598.00,
      total: 1794.00,
      purchaseDate: '2024-04-10',
      afterSale: '2年质保',
      followUpDate: '2024-07-10',
      status: 'processing',
      statusText: '处理中',
      deliveryAddress: '深圳市南山区科技园',
      orderNote: '需要开具增值税发票',
      warranty: '2026-04-10'
    },
    {
      id: 3,
      customerId: 3,
      customerName: '王五',
      productName: '美白淡斑精华液',
      productCode: 'SK-003',
      quantity: 2,
      price: 488.00,
      total: 976.00,
      purchaseDate: '2024-04-15',
      afterSale: '1年质保',
      followUpDate: '2024-07-15',
      status: 'delivered',
      statusText: '已交付',
      deliveryAddress: '北京市朝阳区CBD商务区',
      orderNote: '首次购买客户',
      warranty: '2025-04-15'
    },
    {
      id: 4,
      customerId: 4,
      customerName: '赵六',
      productName: '高端护肤套装',
      productCode: 'SK-SET-01',
      quantity: 10,
      price: 1580.00,
      total: 15800.00,
      purchaseDate: '2024-04-20',
      afterSale: '2年质保+免费上门服务',
      followUpDate: '2024-07-20',
      status: 'delivered',
      statusText: '已交付',
      deliveryAddress: '杭州市西湖区文一西路',
      orderNote: 'VIP客户大额订单',
      warranty: '2026-04-20'
    },
    {
      id: 5,
      customerId: 5,
      customerName: '陈七',
      productName: '水润补水面膜（10片装）',
      productCode: 'SK-004',
      quantity: 20,
      price: 128.00,
      total: 2560.00,
      purchaseDate: '2024-05-05',
      afterSale: '6个月质保',
      followUpDate: '2024-08-05',
      status: 'shipped',
      statusText: '已发货',
      deliveryAddress: '广州市天河区珠江新城',
      orderNote: '电商渠道批量订单',
      warranty: '2024-11-05'
    },
    {
      id: 6,
      customerId: 1,
      customerName: '张三',
      productName: '修复精华乳',
      productCode: 'SK-005',
      quantity: 8,
      price: 398.00,
      total: 3184.00,
      purchaseDate: '2024-05-08',
      afterSale: '1年质保',
      followUpDate: '2024-08-08',
      status: 'delivered',
      statusText: '已交付',
      deliveryAddress: '上海市浦东新区张江高科技园区',
      orderNote: '重复购买客户',
      warranty: '2025-05-08'
    },
    {
      id: 7,
      customerId: 7,
      customerName: '周九',
      productName: '企业数字化升级套餐',
      productCode: 'AI-ENTER-01',
      quantity: 1,
      price: 198000.00,
      total: 198000.00,
      purchaseDate: '2024-05-26',
      afterSale: '3年企业级服务',
      followUpDate: '2024-06-26',
      status: 'pending',
      statusText: '待签约',
      deliveryAddress: '南京市江宁区高新园',
      orderNote: '年度大单，合同审批中',
      warranty: '2027-05-26'
    },
    {
      id: 8,
      customerId: 8,
      customerName: '吴十',
      productName: '技术支持服务包',
      productCode: 'AI-SUPPORT-12',
      quantity: 12,
      price: 1200.00,
      total: 14400.00,
      purchaseDate: '2024-05-15',
      afterSale: '在线支持 + 现场服务',
      followUpDate: '2024-06-15',
      status: 'processing',
      statusText: '实施中',
      deliveryAddress: '深圳市福田区创新中心',
      orderNote: '需安排工程师驻场三天',
      warranty: '2025-05-15'
    },
    {
      id: 9,
      customerId: 9,
      customerName: '郑十一',
      productName: 'AI客户洞察试用包',
      productCode: 'AI-TRIAL-30',
      quantity: 1,
      price: 0.00,
      total: 0.00,
      purchaseDate: '2024-04-18',
      afterSale: '30天试用',
      followUpDate: '2024-05-18',
      status: 'trial',
      statusText: '试用中',
      deliveryAddress: '北京市海淀区中关村',
      orderNote: '待确认转正购买',
      warranty: '2024-05-18'
    },
    {
      id: 10,
      customerId: 10,
      customerName: '钱十二',
      productName: '多门店运营管理模块',
      productCode: 'AI-RETAIL-08',
      quantity: 3,
      price: 9800.00,
      total: 29400.00,
      purchaseDate: '2024-05-22',
      afterSale: '一年免费升级',
      followUpDate: '2024-06-30',
      status: 'shipped',
      statusText: '已发货',
      deliveryAddress: '杭州市滨江区科技园',
      orderNote: '需安排门店培训',
      warranty: '2025-05-22'
    }
  ],
  
  // 预设数据类型
  presetCategories: [
    { id: 'customer-categories', name: '客户分类', icon: 'tag', description: '管理客户类型标签' },
    { id: 'customer-intentions', name: '意向等级', icon: 'fire', description: '客户购买意向分级' },
    { id: 'regions', name: '地区管理', icon: 'map', description: '业务覆盖区域' },
    { id: 'budget-ranges', name: '预算范围', icon: 'currency', description: '客户预算区间' },
    { id: 'visit-methods', name: '回访方式', icon: 'phone', description: '回访沟通方式' },
    { id: 'visit-types', name: '回访类型', icon: 'calendar', description: '回访业务类型' },
    { id: 'preset-products', name: '预设产品', icon: 'box', description: '常用产品快捷选择' }
  ],
  
  // 客户分类
  customerCategories: [
    { id: 'vip', name: 'VIP客户', description: '高价值客户，年消费10万以上', displayOrder: 1, count: 12 },
    { id: 'normal', name: '普通客户', description: '常规客户，稳定消费', displayOrder: 2, count: 35 },
    { id: 'potential', name: '潜在客户', description: '待开发客户，有合作意向', displayOrder: 3, count: 21 }
  ],
  
  // 意向等级
  customerIntentions: [
    { id: 'H', name: '高意向（已签约）', description: '已成交客户', color: '#EF4444', displayOrder: 1, count: 8 },
    { id: 'A', name: 'A类（强意向）', description: '购买意愿强烈，预计1个月内成交', color: '#F97316', displayOrder: 2, count: 15 },
    { id: 'B', name: 'B类（有意向）', description: '有一定意向，需持续跟进', color: '#F59E0B', displayOrder: 3, count: 22 },
    { id: 'C', name: 'C类（观望中）', description: '还在观望，需要长期培育', color: '#10B981', displayOrder: 4, count: 16 },
    { id: 'D', name: 'D类（待培育）', description: '兴趣较低，需要长期维护', color: '#6B7280', displayOrder: 5, count: 7 }
  ],
  
  // 地区
  regions: [
    { id: 'east', name: '华东地区', description: '上海、江苏、浙江、安徽等', displayOrder: 1, count: 28 },
    { id: 'south', name: '华南地区', description: '广东、广西、海南等', displayOrder: 2, count: 18 },
    { id: 'north', name: '华北地区', description: '北京、天津、河北、山西等', displayOrder: 3, count: 12 },
    { id: 'central', name: '华中地区', description: '河南、湖北、湖南等', displayOrder: 4, count: 10 }
  ],
  
  // 预算范围
  budgetRanges: [
    { id: 'b1', name: '3万以下', description: '小额预算客户', displayOrder: 1, count: 15 },
    { id: 'b2', name: '3-5万', description: '中小额预算', displayOrder: 2, count: 22 },
    { id: 'b3', name: '5-10万', description: '中等预算', displayOrder: 3, count: 18 },
    { id: 'b4', name: '10-30万', description: '较大预算', displayOrder: 4, count: 10 },
    { id: 'b5', name: '30万以上', description: '大额预算客户', displayOrder: 5, count: 3 }
  ],
  
  // 回访方式
  visitMethods: [
    { id: 'phone', name: '电话回访', description: '通过电话沟通', displayOrder: 1, count: 45 },
    { id: 'visit', name: '现场拜访', description: '上门拜访客户', displayOrder: 2, count: 28 },
    { id: 'online', name: '线上会议', description: '视频或语音会议', displayOrder: 3, count: 32 },
    { id: 'email', name: '邮件沟通', description: '通过邮件联系', displayOrder: 4, count: 18 },
    { id: 'wechat', name: '微信沟通', description: '微信即时通讯', displayOrder: 5, count: 56 }
  ],
  
  // 回访类型
  visitTypes: [
    { id: 'plan', name: '计划回访', description: '定期跟进客户', displayOrder: 1, count: 38 },
    { id: 'product', name: '产品回访', description: '产品使用反馈', displayOrder: 2, count: 42 },
    { id: 'need', name: '需求沟通', description: '了解客户需求', displayOrder: 3, count: 25 },
    { id: 'contract', name: '合同续约', description: '合同到期续约', displayOrder: 4, count: 12 },
    { id: 'complaint', name: '投诉处理', description: '处理客户投诉', displayOrder: 5, count: 5 }
  ],
  
  // 预设产品
  presetProducts: [
    { id: 'p1', name: '保湿滋养面霜', code: 'SK-001', price: 298.00, category: '面部护理', displayOrder: 1 },
    { id: 'p2', name: '紧致抗皱精华', code: 'SK-002', price: 598.00, category: '面部护理', displayOrder: 2 },
    { id: 'p3', name: '美白淡斑精华液', code: 'SK-003', price: 488.00, category: '面部护理', displayOrder: 3 },
    { id: 'p4', name: '水润补水面膜（10片装）', code: 'SK-004', price: 128.00, category: '面膜系列', displayOrder: 4 },
    { id: 'p5', name: '修复精华乳', code: 'SK-005', price: 398.00, category: '面部护理', displayOrder: 5 },
    { id: 'p6', name: '高端护肤套装', code: 'SK-SET-01', price: 1580.00, category: '套装系列', displayOrder: 6 }
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
