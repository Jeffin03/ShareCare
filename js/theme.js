/**
 * js/theme.js
 * Handles dark mode toggle and persistence.
 */

(function() {
  const theme = localStorage.getItem('sharecare-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);

  window.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.theme-toggle');
    
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('sharecare-theme', newTheme);
        
        // Dispatch event for other components if needed
        window.dispatchEvent(new CustomEvent('themechanged', { detail: newTheme }));
      });
    });

    // Avatar Initials Logic
    const avatarElements = document.querySelectorAll('.user-avatar-container');
    if (avatarElements.length > 0) {
      const userName = localStorage.getItem('sharecare-user-name') || 'User';
      const initials = userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
        
      avatarElements.forEach(el => {
        el.innerHTML = `<div class="user-initials">${initials}</div>`;
      });
    }

    // Portfolio Mode Banner
    if (!document.querySelector('.demo-banner')) {
      const banner = document.createElement('div');
      banner.className = 'demo-banner';
      banner.innerHTML = '<i class="ri-information-line"></i> ARCHIVED PORTFOLIO: Read-only demo mode enabled. Data persistence and sign-ups are restricted.';
      document.body.prepend(banner);
    }
  });
})();
