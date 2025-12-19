import { useEffect } from 'react';

/**
 * Custom hook to sync sidebar state with CSS variable for dynamic layout adjustments
 * Updates --sidebar-width CSS variable and body class when sidebar state changes
 * 
 * @param sidebarOpen - Current state of the sidebar (true = open/250px, false = closed/70px)
 */
export const useSidebarSync = (sidebarOpen: boolean): void => {
  useEffect(() => {
    // Update CSS variable for footer and main content positioning
    document.documentElement.style.setProperty(
      '--sidebar-width',
      sidebarOpen ? '250px' : '70px'
    );
    // Add/remove class for additional styling if needed
    document.body.classList.toggle('sidebar-closed', !sidebarOpen);
  }, [sidebarOpen]);
};

