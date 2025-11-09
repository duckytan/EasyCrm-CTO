function customerDetailPage() {
  return {
    loading: true,
    error: '',
    customerId: null,
    customer: null,
    visits: [],
    orders: [],
    communicationChannels: [],
    nextPlan: null,
    tab: 'overview',
    async init() {
      // 检查认证
      if (!apiClient.isAuthenticated()) {
        window.location.href = '/index.html';
        return;
      }

      // 从URL获取客户ID
      const params = new URLSearchParams(window.location.search);
      this.customerId = params.get('id');

      if (!this.customerId) {
        this.error = '未找到客户ID';
        this.loading = false;
        return;
      }

      // 加载客户数据
      await this.loadCustomerData();
    },
    async loadCustomerData() {
      try {
        this.loading = true;
        this.error = '';

        // 加载客户详情（已包含最近的回访记录和订单）
        const customerData = await apiClient.getCustomer(this.customerId);

        this.customer = {
          ...customerData,
          avatar: this.generateAvatar(customerData.name),
          lastVisit: customerData.visits && customerData.visits.length > 0 ? customerData.visits[0].visitTime : null
        };

        // 后端API已经返回了visits和orders，但需要格式化
        this.visits = (customerData.visits || []).map(visit => ({
          ...visit,
          visitTime: this.formatDateTime(visit.visitTime),
          type: visit.visitTypeName || '未分类',
          method: visit.visitMethodName || '未知',
          intention: visit.intentionName || visit.intentionLevel || '未知',
        }));

        this.orders = (customerData.orders || []).map(order => {
          const rawPrice = typeof order.price === 'number' ? order.price : parseFloat(order.price || '0');
          const price = Number.isFinite(rawPrice) ? rawPrice : 0;
          const rawQuantity = Number(order.quantity || 0);
          const quantity = Number.isFinite(rawQuantity) ? rawQuantity : 0;
          const total = price * quantity;
          return {
            ...order,
            price,
            quantity,
            total,
            purchaseDate: order.purchaseDate,
            followUpDate: order.followUpDate || null
          };
        });

        // 设置沟通渠道
        this.communicationChannels = [];
        if (customerData.phone) this.communicationChannels.push('电话');
        if (customerData.email) this.communicationChannels.push('邮箱');
        if (customerData.wechat) this.communicationChannels.push('微信');
        if (customerData.whatsapp) this.communicationChannels.push('WhatsApp');
        if (customerData.facebook) this.communicationChannels.push('Facebook');
        this.communicationChannels = Array.from(new Set(this.communicationChannels));

        // 设置下次计划
        if (customerData.plannedVisitDate) {
          this.nextPlan = {
            date: this.formatDate(customerData.plannedVisitDate),
            method: customerData.plannedVisitMethodName || '未设置',
            content: customerData.plannedVisitContent || '未填写'
          };
        }

        this.loading = false;
      } catch (error) {
        console.error('加载客户详情失败', error);
        this.error = error.message || '加载数据失败';
        this.loading = false;
      }
    },
    generateAvatar(name) {
      if (!name) return '?';
      const chars = name.trim();
      if (chars.length === 0) return '?';
      if (chars.length === 1) return chars[0].toUpperCase();
      
      // 对于中文名字，取前两个字
      if (/[\u4e00-\u9fa5]/.test(chars)) {
        return chars.substring(0, 2);
      }
      
      // 对于英文名字，取首字母
      const words = chars.split(/\s+/);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return chars.substring(0, 2).toUpperCase();
    },
    formatDate(dateStr) {
      if (!dateStr) return '暂无';
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    },
    formatDateTime(dateStr) {
      if (!dateStr) return '暂无';
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    formatCurrency(amount) {
      if (!amount && amount !== 0) return '¥0.00';
      return '¥' + Number(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },
    changeTab(tabName) {
      this.tab = tabName;
    },
    editCustomer() {
      // TODO: 打开编辑客户弹窗
      alert('编辑客户功能待实现');
    },
    createVisit() {
      // TODO: 打开创建回访弹窗
      alert('创建回访功能待实现');
    },
    createOrder() {
      // TODO: 打开创建订单弹窗
      alert('创建订单功能待实现');
    },
    goBack() {
      window.location.href = 'customers.html';
    }
  };
}

if (typeof window !== 'undefined') {
  window.customerDetailPage = customerDetailPage;
}
