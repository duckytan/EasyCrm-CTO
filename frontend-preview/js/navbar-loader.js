document.addEventListener('DOMContentLoaded', function() {
  const placeholder = document.getElementById('navbar-container');
  if (!placeholder) {
    return;
  }

  fetch('components/navbar.html')
    .then(function(response) {
      if (!response.ok) {
        throw new Error('导航栏加载失败');
      }
      return response.text();
    })
    .then(function(html) {
      const appShell = placeholder.closest('.app-shell');
      if (!appShell) {
        placeholder.remove();
        return;
      }

      const template = document.createElement('template');
      template.innerHTML = html.trim();
      const navElement = template.content.firstElementChild;

      if (!navElement) {
        placeholder.remove();
        return;
      }

      const bodyElement = document.body || document.querySelector('body');
      const dataPage = bodyElement ? bodyElement.getAttribute('data-page') : null;
      const currentKey = (dataPage || (window.location.pathname.split('/').pop() || '')).replace('.html', '');

      navElement.querySelectorAll('a[data-page]').forEach(function(link) {
        if (link.dataset.page === currentKey) {
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });

      appShell.insertBefore(navElement, appShell.firstChild);
      placeholder.remove();
    })
    .catch(function(error) {
      console.error('加载导航栏时出错:', error);
    });
});
