function settingsPage() {
  return {
    loading: true,
    saving: false,
    error: '',
    message: '',
    settings: {
      theme: 'light',
      language: 'zh-CN',
      timeZone: 'Asia/Shanghai',
      notifications: {
        email: true,
        sms: false,
        inApp: true
      }
    },
    backupStatus: {
      lastBackupAt: null,
      lastRestoreAt: null
    },
    async init() {
      if (!apiClient.isAuthenticated()) {
        window.location.href = '/index.html';
        return;
      }

      await this.loadSettings();
    },
    async loadSettings() {
      try {
        this.loading = true;
        this.error = '';
        this.message = '';

        const data = await apiClient.getSettings();

        this.settings = {
          theme: data.theme ?? 'light',
          language: data.language ?? 'zh-CN',
          timeZone: data.timeZone ?? 'Asia/Shanghai',
          notifications: {
            email: data.notifications?.email ?? true,
            sms: data.notifications?.sms ?? false,
            inApp: data.notifications?.inApp ?? true
          }
        };

        this.backupStatus = {
          lastBackupAt: data.lastBackupAt ?? null,
          lastRestoreAt: data.lastRestoreAt ?? null
        };

        this.loading = false;
      } catch (error) {
        console.error('加载系统设置失败', error);
        this.error = error.message || '加载系统设置失败';
        this.loading = false;
      }
    },
    async saveSettings() {
      try {
        this.saving = true;
        this.error = '';
        this.message = '';

        await apiClient.updateSettings(this.settings);
        this.message = '设置已保存';
      } catch (error) {
        console.error('保存设置失败', error);
        this.error = error.message || '保存设置失败';
      } finally {
        this.saving = false;
      }
    },
    async triggerBackup() {
      if (!confirm('确认立即备份数据吗？')) {
        return;
      }

      try {
        await apiClient.backup();
        this.message = '数据备份成功';
        await this.loadSettings();
      } catch (error) {
        console.error('数据备份失败', error);
        this.error = error.message || '数据备份失败';
      }
    },
    async triggerRestore() {
      if (!confirm('确认从最近的备份恢复数据吗？当前数据将被覆盖。')) {
        return;
      }

      try {
        await apiClient.restore({ mode: 'latest' });
        this.message = '数据恢复已启动，请稍后刷新查看状态';
        await this.loadSettings();
      } catch (error) {
        console.error('数据恢复失败', error);
        this.error = error.message || '数据恢复失败';
      }
    },
    async triggerClearData() {
      if (!confirm('确认要清空业务数据吗？预设数据将保留。此操作不可撤销。')) {
        return;
      }

      try {
        await apiClient.clearData(true);
        this.message = '数据清空成功';
      } catch (error) {
        console.error('清空数据失败', error);
        this.error = error.message || '清空数据失败';
      }
    },
    formatDateTime(dateStr) {
      if (!dateStr) return '暂无记录';
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
}

if (typeof window !== 'undefined') {
  window.settingsPage = settingsPage;
}
