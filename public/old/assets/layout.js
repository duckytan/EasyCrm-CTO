(function () {
  window.layoutState = function () {
    return {
      darkMode: localStorage.getItem('ai-crm-theme') === 'dark',
      sidebarOpen: window.innerWidth >= 1024,
      isMobile: window.innerWidth < 1024,
      init() {
        document.documentElement.classList.toggle('dark', this.darkMode);
        this.isMobile = window.innerWidth < 1024;
        
        window.addEventListener('resize', () => {
          const wasMobile = this.isMobile;
          this.isMobile = window.innerWidth < 1024;
          
          if (window.innerWidth >= 1024) {
            this.sidebarOpen = true;
          } else if (!wasMobile && this.isMobile) {
            this.sidebarOpen = false;
          }
        });
      },
      toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
      },
      closeSidebar() {
        if (this.isMobile) {
          this.sidebarOpen = false;
        }
      },
      toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.documentElement.classList.toggle('dark', this.darkMode);
        localStorage.setItem('ai-crm-theme', this.darkMode ? 'dark' : 'light');
      }
    };
  };
})();
