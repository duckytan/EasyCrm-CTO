// API 客户端封装
const API_BASE_URL = '/api';

class ApiClient {
  constructor() {
    this.accessToken = this.getStoredToken('accessToken');
    this.refreshToken = this.getStoredToken('refreshToken');
    this.previewMode = this.getPreviewMode();
  }

  getStoredToken(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('无法访问 localStorage', error);
      return null;
    }
  }

  setStoredToken(key, value) {
    try {
      if (value) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('无法保存到 localStorage', error);
    }
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.setStoredToken('accessToken', accessToken);
    this.setStoredToken('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.setStoredToken('accessToken', null);
    this.setStoredToken('refreshToken', null);
    this.setPreviewMode(false);
  }

  getPreviewMode() {
    try {
      return localStorage.getItem('previewMode') === 'true';
    } catch (error) {
      return false;
    }
  }

  setPreviewMode(enabled) {
    try {
      if (enabled) {
        localStorage.setItem('previewMode', 'true');
      } else {
        localStorage.removeItem('previewMode');
      }
      this.previewMode = enabled;
    } catch (error) {
      console.warn('无法设置预览模式', error);
    }
  }

  isAuthenticated() {
    return !!this.accessToken || this.previewMode;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && this.refreshToken && !options.skipRefresh) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...config, headers });
          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json().catch(() => ({}));
            const retryError = new Error(retryErrorData.message || retryErrorData.error || retryResponse.statusText);
            retryError.status = retryResponse.status;
            retryError.data = retryErrorData;
            throw retryError;
          }
          if (retryResponse.status === 204) {
            return null;
          }
          return await retryResponse.json().catch(() => ({}));
        } else {
          this.clearTokens();
          window.location.href = '/index.html';
          const authError = new Error('认证失败，请重新登录');
          authError.status = 401;
          throw authError;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || errorData.error || response.statusText;
        const error = new Error(message);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json().catch(() => ({}));
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch (error) {
      console.error('刷新 Token 失败:', error);
      return false;
    }
  }

  // 认证相关
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
      skipRefresh: true
    });

    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  logout() {
    this.clearTokens();
    window.location.href = '/index.html';
  }

  // 客户管理
  async getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/customers${query ? '?' + query : ''}`);
  }

  async getCustomer(id) {
    return await this.request(`/customers/${id}`);
  }

  async createCustomer(data) {
    return await this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCustomer(id, data) {
    return await this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCustomer(id) {
    return await this.request(`/customers/${id}`, {
      method: 'DELETE'
    });
  }

  // 回访记录
  async getVisits(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/visits${query ? '?' + query : ''}`);
  }

  async getVisit(id) {
    return await this.request(`/visits/${id}`);
  }

  async createVisit(data) {
    return await this.request('/visits', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateVisit(id, data) {
    return await this.request(`/visits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteVisit(id) {
    return await this.request(`/visits/${id}`, {
      method: 'DELETE'
    });
  }

  // 产品订单
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/products${query ? '?' + query : ''}`);
  }

  async getProduct(id) {
    return await this.request(`/products/${id}`);
  }

  async createProduct(data) {
    return await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProduct(id, data) {
    return await this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteProduct(id) {
    return await this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  async getProductStatistics() {
    return await this.request('/products/statistics/summary');
  }

  // 仪表盘
  async getDashboardStatistics() {
    return await this.request('/dashboard/statistics');
  }

  // 预设数据
  async getPresets(type) {
    return await this.request(`/presets/${type}`);
  }

  async createPreset(type, data) {
    return await this.request(`/presets/${type}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePreset(type, id, data) {
    return await this.request(`/presets/${type}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deletePreset(type, id) {
    return await this.request(`/presets/${type}/${id}`, {
      method: 'DELETE'
    });
  }

  // 用户设置
  async getSettings() {
    return await this.request('/settings');
  }

  async updateSettings(data) {
    return await this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // 数据维护
  async backup() {
    return await this.request('/maintenance/backup', {
      method: 'POST'
    });
  }

  async restore(backupData) {
    return await this.request('/maintenance/restore', {
      method: 'POST',
      body: JSON.stringify(backupData)
    });
  }

  async clearData(confirm) {
    return await this.request('/maintenance/clear-data', {
      method: 'POST',
      body: JSON.stringify({ confirm })
    });
  }
}

const apiClient = new ApiClient();

if (typeof window !== 'undefined') {
  window.apiClient = apiClient;
}
