function productsPage() {
  return {
    loading: true,
    error: '',
    products: [],
    statistics: {
      totalSales: 0,
      totalOrders: 0,
      averageOrder: 0,
      topProducts: []
    },
    search: '',
    filterStatus: '',
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    async init() {
      if (!apiClient.isAuthenticated()) {
        window.location.href = '/index.html';
        return;
      }

      await Promise.all([this.loadStatistics(), this.loadProducts()]);
    },
    async loadStatistics() {
      try {
        const data = await apiClient.getProductStatistics();
        
        this.statistics = {
          totalSales: data.totalSales || 0,
          totalOrders: data.totalOrders || 0,
          averageOrder: data.averageOrderValue || 0,
          topProducts: data.topProducts || []
        };
      } catch (error) {
        console.warn('加载统计数据失败', error);
      }
    },
    async loadProducts() {
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

        const data = await apiClient.getProducts(params);

        this.products = (data.data || []).map(product => ({
          ...product,
          customerName: product.customer?.name || '未知客户',
          productName: product.presetProduct?.name || product.productName || '未知产品',
          statusText: this.getStatusText(product.status)
        }));

        this.pagination = data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        };

        this.loading = false;
      } catch (error) {
        console.error('加载订单列表失败', error);
        this.error = error.message || '加载订单数据失败';
        this.loading = false;
      }
    },
    async searchProducts() {
      this.pagination.page = 1;
      await this.loadProducts();
    },
    async changePage(page) {
      if (page < 1 || page > this.pagination.totalPages) return;
      this.pagination.page = page;
      await this.loadProducts();
    },
    getStatusText(status) {
      const statusMap = {
        'pending': '待发货',
        'shipped': '已发货',
        'delivered': '已送达',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      return statusMap[status] || status || '未知';
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
    formatCurrency(value) {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY'
      }).format(value || 0);
    },
    async deleteProduct(productId, productName) {
      if (!confirm(`确定要删除订单"${productName}"吗？`)) {
        return;
      }

      try {
        await apiClient.deleteProduct(productId);
        alert('订单删除成功');
        await Promise.all([this.loadStatistics(), this.loadProducts()]);
      } catch (error) {
        alert('删除失败：' + error.message);
      }
    }
  };
}

if (typeof window !== 'undefined') {
  window.productsPage = productsPage;
}
