function dashboardPage() {
  return {
    loading: true,
    error: '',
    stats: {
      monthlySales: 0,
      monthlyOrders: 0,
      averageOrderValue: 0,
      monthlyNewCustomers: 0,
      monthlyVisits: 0,
      monthlyTransactionCustomers: 0,
    },
    intentions: [],
    reminders: [],
    activities: [],
    async init() {
      if (!apiClient.isAuthenticated()) {
        window.location.href = '/index.html';
        return;
      }

      await this.loadData();
    },
    async loadData() {
      try {
        this.loading = true;
        const data = await apiClient.getDashboardStatistics();
        this.stats = {
          monthlySales: data.monthlySales,
          monthlyOrders: data.monthlyOrders,
          averageOrderValue: data.averageOrderValue,
          monthlyNewCustomers: data.monthlyNewCustomers,
          monthlyVisits: data.monthlyVisits,
          monthlyTransactionCustomers: data.monthlyTransactionCustomers,
          totalCustomers: data.totalCustomers ?? 0,
          activeCustomers: data.activeCustomers ?? 0
        };

        const intentionColors = ['#2563EB', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];
        this.intentions = (data.intentionDistribution || []).map((item, index) => ({
          ...item,
          color: intentionColors[index % intentionColors.length]
        }));

        const reminderTypeText = {
          planned_visit: '计划回访',
          product_followup: '产品回访',
          customer_birthday: '客户生日'
        };

        this.reminders = (data.importantReminders || []).map((item, index) => ({
          ...item,
          type: reminderTypeText[item.type] || '提醒',
          id: `${item.type}-${item.customerId}-${index}`
        }));

        this.loading = false;
      } catch (error) {
        console.error('加载仪表盘数据失败', error);
        this.error = error.message || '加载数据失败';
        this.loading = false;
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY'
      }).format(value || 0);
    },
    formatDate(dateStr) {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
  };
}

if (typeof window !== 'undefined') {
  window.dashboardPage = dashboardPage;
}
