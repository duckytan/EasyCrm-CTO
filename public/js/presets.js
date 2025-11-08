function presetsPage() {
  return {
    loading: true,
    error: '',
    activeType: 'customer-categories',
    presets: [],
    presetTypes: [
      { id: 'customer-categories', name: '客户分类', icon: '📁' },
      { id: 'customer-intentions', name: '客户意向', icon: '🎯' },
      { id: 'regions', name: '地区', icon: '🌍' },
      { id: 'budget-ranges', name: '预算范围', icon: '💰' },
      { id: 'superior-contacts', name: '上级联系人', icon: '👤' },
      { id: 'subordinate-contacts', name: '下级联系人', icon: '👥' },
      { id: 'preset-products', name: '预设产品', icon: '📦' },
      { id: 'visit-methods', name: '回访方式', icon: '📞' },
      { id: 'visit-types', name: '回访类型', icon: '📝' },
      { id: 'navigation-modes', name: '导航模式', icon: '🗺' },
      { id: 'reminder-cycles', name: '提醒周期', icon: '⏰' }
    ],
    async init() {
      if (!apiClient.isAuthenticated()) {
        window.location.href = '/index.html';
        return;
      }

      await this.loadPresets();
    },
    async loadPresets() {
      try {
        this.loading = true;
        this.error = '';
        
        const data = await apiClient.getPresets(this.activeType);
        
        this.presets = Array.isArray(data?.data) 
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

        this.loading = false;
      } catch (error) {
        console.error('加载预设数据失败', error);
        this.error = error.message || '加载预设数据失败';
        this.loading = false;
      }
    },
    async switchType(type) {
      this.activeType = type;
      await this.loadPresets();
    },
    getTypeName(typeId) {
      const type = this.presetTypes.find(t => t.id === typeId);
      return type ? type.name : typeId;
    },
    getTypeIcon(typeId) {
      const type = this.presetTypes.find(t => t.id === typeId);
      return type ? type.icon : '📋';
    },
    async deletePreset(presetId, presetName) {
      if (!confirm(`确定要删除"${presetName}"吗？\n注意：如果有客户或记录正在使用此预设，删除操作将失败。`)) {
        return;
      }

      try {
        await apiClient.deletePreset(this.activeType, presetId);
        alert('删除成功');
        await this.loadPresets();
      } catch (error) {
        alert('删除失败：' + error.message);
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return '暂无';
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    }
  };
}

if (typeof window !== 'undefined') {
  window.presetsPage = presetsPage;
}
