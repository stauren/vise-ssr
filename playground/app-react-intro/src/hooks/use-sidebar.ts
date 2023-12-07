const className = 'sidebar-open';
export default function useSidebar() {
  let isOpen = false;
  function toggleSidebar() {
    const sidebarIsOpen = isOpen;
    isOpen = !sidebarIsOpen;
    const el = document.getElementsByClassName('theme-container')[0];
    if (el.classList) {
      el.classList[sidebarIsOpen ? 'remove' : 'add'](className);
    } else {
      el.className = el.className
        .replace(new RegExp(`\b${className}\b`, 'g'), '');
      if (sidebarIsOpen) {
        el.className += ` ${className}`;
      }
    }
  }

  return {
    toggleSidebar,
  };
}
