function visitsPage() {
  return {
    loading: true,
    error: '',
    visits: [],
    visitMethods: [],
    visitTypes: [],
    search: '',
    filterMethod: '',
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

      await Promise.all([this.loadFilters(), this.loadVisits()]);
    },
    async loadFilters() {
      try {
        const [methodsData, typesData] = await Promise.all([
          apiClient.getPresets('visit-methods'),
          apiClient.getPresets('visit-types')
        ]);

        this.visitMethods = Array.isArray(methodsData?.data)
          ? methodsData.data
          : Array.isArray(methodsData)
            ? methodsData
            : [];

        this.visitTypes = Array.isArray(typesData?.data)
          ? typesData.data
          : Array.isArray(typesData)
            ? typesData
            : [];
      } catch (error) {
        console.warn('加载筛选项失败', error);
      }
    },
    async loadVisits() {
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

        const data = await apiClient.getVisits(params);

        this.visits = (data.data || []).map(visit => ({
          id: visit.id,
          customerId: visit.customerId,
          customerName: visit.customerName || '未知客户',
          customerPhone: visit.customerPhone || '',
          customerCompany: visit.customerCompany || '',
          visitTime: visit.visitTime,
          content: visit.content,
          effect: visit.effect || '无',
          satisfaction: visit.satisfaction || '未评估',
          followUp: visit.followUp || '暂无计划',
          visitTypeName: visit.visitTypeName || '未分类',
          visitMethodName: visit.visitMethodName || '未设置',
          intentionLevel: visit.intentionLevel || '',
          intentionName: visit.intentionName || ''
        }));

        this.pagination = data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        };

        this.loading = false;
      } catch (error) {
        console.error('加载回访记录失败', error);
        this.error = error.message || '加载回访记录失败';
        this.loading = false;
      }
    },
    async searchVisits() {
      this.pagination.page = 1;
      await this.loadVisits();
    },
    async filterVisits() {
      this.pagination.page = 1;
      await this.loadVisits();
    },
    async changePage(page) {
      if (page < 1 || page > this.pagination.totalPages) return;
      this.pagination.page = page;
      await this.loadVisits();
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
    async deleteVisit(visitId, customerName) {
      if (!confirm(`确定要删除对"${customerName}"的回访记录吗？`)) {
        return;
      }

      try {
        await apiClient.deleteVisit(visitId);
        alert('回访记录删除成功');
        await this.loadVisits();
      } catch (error) {
        alert('删除失败：' + error.message);
      }
    }
  };
}

if (typeof window !== 'undefined') {
  window.visitsPage = visitsPage;
}
