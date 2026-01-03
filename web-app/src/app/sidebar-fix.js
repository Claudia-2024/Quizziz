// sidebar-fix.js
document.addEventListener('DOMContentLoaded', function() {
  // Watch for sidebar collapse/expand
  setInterval(function() {
    const sidebar = document.querySelector('.sidebar');
    const mainWrapper = document.querySelector('.main-content-wrapper');
    const navbar = document.querySelector('.main-navbar');
    
    if (sidebar && mainWrapper && navbar) {
      const isCollapsed = sidebar.classList.contains('collapsed');
      
      // Apply styles directly
      if (isCollapsed) {
        mainWrapper.style.marginLeft = '80px';
        mainWrapper.style.width = 'calc(100vw - 80px)';
        mainWrapper.style.transition = 'all 0.3s ease';
        
        navbar.style.left = '80px';
        navbar.style.width = 'calc(100vw - 80px)';
        navbar.style.transition = 'all 0.3s ease';
      } else {
        mainWrapper.style.marginLeft = '280px';
        mainWrapper.style.width = 'calc(100vw - 280px)';
        mainWrapper.style.transition = 'all 0.3s ease';
        
        navbar.style.left = '280px';
        navbar.style.width = 'calc(100vw - 280px)';
        navbar.style.transition = 'all 0.3s ease';
      }
    }
  }, 100); // Check every 100ms
});