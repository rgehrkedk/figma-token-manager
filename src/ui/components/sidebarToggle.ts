/**
 * SidebarToggle component
 * Handles toggling the sidebar visibility
 */

export function createSidebarToggle(): {
  element: HTMLElement;
  toggleSidebar: () => void;
} {
  // Create toggle button element
  const button = document.createElement('button');
  button.className = 'sidebar-toggle';
  button.title = 'Toggle Sidebar';
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  // State variable for sidebar visibility
  let isSidebarVisible = window.innerWidth > 960;

  // Toggle function
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-container');
    if (!sidebar) return;
    
    isSidebarVisible = !isSidebarVisible;
    
    if (isSidebarVisible) {
      sidebar.classList.add('visible');
    } else {
      sidebar.classList.remove('visible');
    }
  }

  // Add event listener to the button
  button.addEventListener('click', toggleSidebar);
  
  return {
    element: button,
    toggleSidebar
  };
}