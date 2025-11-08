// 认证守卫 - 在需要登录的页面加载此脚本
(function() {
  const currentPage = window.location.pathname;
  const loginPage = '/index.html';
  
  // 如果当前在登录页，不需要检查
  if (currentPage === loginPage || currentPage === '/' || currentPage === '') {
    return;
  }

  // 检查是否有 token
  const hasToken = apiClient && apiClient.isAuthenticated();
  
  if (!hasToken) {
    // 保存当前页面，以便登录后跳转回来
    try {
      localStorage.setItem('redirectAfterLogin', currentPage);
    } catch (error) {
      console.warn('无法保存跳转信息', error);
    }
    
    window.location.href = loginPage;
  }
})();
