(function () {
  window.layoutState = function () {
    return {
      darkMode: localStorage.getItem('ai-crm-theme') === 'dark',
      sidebarOpen: window.innerWidth >= 1024,
      init() {
        document.documentElement.classList.toggle('dark', this.darkMode);
        window.addEventListener('resize', () => {
          if (window.innerWidth >= 1024) {
            this.sidebarOpen = true;
          }
        });
      },
      toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.documentElement.classList.toggle('dark', this.darkMode);
        localStorage.setItem('ai-crm-theme', this.darkMode ? 'dark' : 'light');
      }
    };
  };
})();
