function customersPage() {
  return {
    loading: true,
    error: '',
    customers: [],
    categories: [],
    intentions: [],
    regions: [],
    budgetRanges: [],
    visitMethods: [],
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
    showModal: false,
    modalMode: 'create',
    modalLoading: false,
    formData: {},
    formErrors: {},
    async init() {
      if (!apiClient.isAuthenticated()) {
        window.location.href = '/index.html';
        return;
      }

      await Promise.all([this.loadFilters(), this.loadCustomers()]);
    },
    async loadFilters() {
      try {
        const [categoryData, intentionData, regionData, budgetData, visitMethodData] = await Promise.all([
          apiClient.getPresets('customer-categories'),
          apiClient.getPresets('customer-intentions'),
          apiClient.getPresets('regions'),
          apiClient.getPresets('budget-ranges'),
          apiClient.getPresets('visit-methods')
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
        
        this.regions = Array.isArray(regionData?.data)
          ? regionData.data
          : Array.isArray(regionData)
            ? regionData
            : [];
        
        this.budgetRanges = Array.isArray(budgetData?.data)
          ? budgetData.data
          : Array.isArray(budgetData)
            ? budgetData
            : [];
        
        this.visitMethods = Array.isArray(visitMethodData?.data)
          ? visitMethodData.data
          : Array.isArray(visitMethodData)
            ? visitMethodData
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
    },
    openCreateModal() {
      this.modalMode = 'create';
      this.formData = {
        name: '',
        phone: '',
        email: '',
        company: '',
        birthday: '',
        address: '',
        demand: '',
        wechat: '',
        whatsapp: '',
        facebook: '',
        remark: '',
        customerCategoryId: '',
        customerIntentionLevel: '',
        regionId: '',
        budgetRangeId: '',
        plannedVisitDate: '',
        plannedVisitContent: '',
        plannedVisitMethodId: ''
      };
      this.formErrors = {};
      this.modalLoading = false;
      this.showModal = true;
    },
    async openEditModal(customer) {
      this.modalMode = 'edit';
      this.modalLoading = true;
      try {
        const detailData = await apiClient.getCustomer(customer.id);
        this.formData = {
          id: detailData.id,
          name: detailData.name || '',
          phone: detailData.phone || '',
          email: detailData.email || '',
          company: detailData.company || '',
          birthday: detailData.birthday ? detailData.birthday.split('T')[0] : '',
          address: detailData.address || '',
          demand: detailData.demand || '',
          wechat: detailData.wechat || '',
          whatsapp: detailData.whatsapp || '',
          facebook: detailData.facebook || '',
          remark: detailData.remark || '',
          customerCategoryId: detailData.category || '',
          customerIntentionLevel: detailData.intention || '',
          regionId: detailData.region || '',
          budgetRangeId: detailData.budgetRange || '',
          plannedVisitDate: detailData.plannedVisitDate ? detailData.plannedVisitDate.split('T')[0] : '',
          plannedVisitContent: detailData.plannedVisitContent || '',
          plannedVisitMethodId: detailData.plannedVisitMethodId ? String(detailData.plannedVisitMethodId) : ''
        };
        this.formErrors = {};
        this.showModal = true;
      } catch (error) {
        alert('加载客户信息失败：' + error.message);
      } finally {
        this.modalLoading = false;
      }
    },
    closeModal() {
      this.showModal = false;
      this.modalLoading = false;
      this.formData = {};
      this.formErrors = {};
    },
    validateForm() {
      this.formErrors = {};
      
      if (!this.formData.name || !this.formData.name.trim()) {
        this.formErrors.name = '客户姓名不能为空';
      }
      
      if (!this.formData.phone || !this.formData.phone.trim()) {
        this.formErrors.phone = '联系电话不能为空';
      } else if (!/^[0-9+\-()\s]+$/.test(this.formData.phone)) {
        this.formErrors.phone = '电话号码格式不正确';
      }
      
      if (this.formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
        this.formErrors.email = '邮箱格式不正确';
      }
      
      return Object.keys(this.formErrors).length === 0;
    },
    async submitForm() {
      if (!this.validateForm()) {
        return;
      }
      
      this.modalLoading = true;
      
      try {
        const submitData = { ...this.formData };
        
        // 清理空字段
        Object.keys(submitData).forEach(key => {
          if (submitData[key] === '') {
            submitData[key] = null;
          }
        });

        if (submitData.plannedVisitMethodId !== null && submitData.plannedVisitMethodId !== undefined) {
          const methodId = Number(submitData.plannedVisitMethodId);
          submitData.plannedVisitMethodId = Number.isNaN(methodId) ? null : methodId;
        }
        
        if (this.modalMode === 'create') {
          await apiClient.createCustomer(submitData);
          alert('客户创建成功');
        } else {
          const customerId = submitData.id;
          delete submitData.id;
          await apiClient.updateCustomer(customerId, submitData);
          alert('客户更新成功');
        }
        
        this.closeModal();
        await this.loadCustomers();
      } catch (error) {
        alert('操作失败：' + error.message);
      } finally {
        this.modalLoading = false;
      }
    }
  };
}

if (typeof window !== 'undefined') {
  window.customersPage = customersPage;
}
