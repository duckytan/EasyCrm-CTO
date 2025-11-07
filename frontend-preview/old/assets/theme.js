(function () {
  const storageKey = 'ai-crm-theme';
  const root = document.documentElement;

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const storedTheme = window.localStorage.getItem(storageKey);
  applyTheme(storedTheme || 'light');

  window.toggleTheme = function () {
    const isDark = root.classList.contains('dark');
    const nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  };

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', () => window.toggleTheme());
    });
  });
})();
