function customersPage() {
  return {
    loading: true,
    error: '',
    customers: [],
    categories: [],
    intentions: [],
    search: '',
    filterCategory: '',
    filterIntention: '',
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    stats: {
      total: 0,
      monthlyNew: 0,
      pendingVisits: 0
    },
    async init() {
      if (!apiClient.isAuthenticated()) {
        window.location.href = '/index.html';
        return;
      }

      await Promise.all([this.loadFilters(), this.loadCustomers()]);
    },
    async loadFilters() {
      try {
        const [categoryData, intentionData] = await Promise.all([
          apiClient.getPresets('customer-categories'),
          apiClient.getPresets('customer-intentions')
        ]);

        this.categories = Array.isArray(categoryData?.data)
          ? categoryData.data
          : Array.isArray(categoryData)
            ? categoryData
            : [];

        this.intentions = Array.isArray(intentionData?.data)
          ? intentionData.data
          : Array.isArray(intentionData)
            ? intentionData
            : [];
      } catch (error) {
        console.warn('加载筛选项失败', error);
      }
    },
    async loadCustomers() {
      try {
        this.loading = true;
        this.error = '';
        
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit
        };

        if (this.search.trim()) {
          params.search = this.search.trim();
        }

        if (this.filterCategory) {
          params.category = this.filterCategory;
        }

        if (this.filterIntention) {
          params.intention = this.filterIntention;
        }

        const data = await apiClient.getCustomers(params);

        this.customers = (data.data || []).map(customer => ({
          ...customer,
          avatar: this.generateAvatar(customer.name),
          lastVisit: customer.lastVisitAt
        }));

        this.pagination = data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        };

        // 更新统计数据
        this.stats.total = this.pagination.total;
        // 这些数据暂时用占位值，后续可以从其他API获取
        this.stats.monthlyNew = 0;
        this.stats.pendingVisits = 0;

        this.loading = false;
      } catch (error) {
        console.error('加载客户列表失败', error);
        this.error = error.message || '加载客户数据失败';
        this.loading = false;
      }
    },
    async searchCustomers() {
      this.pagination.page = 1;
      await this.loadCustomers();
    },
    async filterCustomers() {
      this.pagination.page = 1;
      await this.loadCustomers();
    },
    async changePage(page) {
      if (page < 1 || page > this.pagination.totalPages) return;
      this.pagination.page = page;
      await this.loadCustomers();
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
    async deleteCustomer(customerId, customerName) {
      if (!confirm(`确定要删除客户"${customerName}"吗？此操作将同时删除该客户的所有回访记录和订单，且不可恢复。`)) {
        return;
      }

      try {
        await apiClient.deleteCustomer(customerId);
        alert('客户删除成功');
        await this.loadCustomers();
      } catch (error) {
        alert('删除失败：' + error.message);
      }
    }
  };
}

if (typeof window !== 'undefined') {
  window.customersPage = customersPage;
}
