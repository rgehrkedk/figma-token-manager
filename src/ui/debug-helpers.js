/**
 * Debug helpers to fix tab issues
 * You can call these from the browser console if needed
 */

// Make this accessible in the global scope for debugging
window.fixTabs = {
    // Force a specific tab to be active
    activateTab: function(tabId) {
      const tabsContainer = document.getElementById('preview-tabs');
      const contentContainer = document.querySelector('.preview-content');
      
      if (!tabsContainer || !contentContainer) {
        console.error('Could not find tab containers');
        return;
      }
      
      // Get all tab buttons and content
      const tabButtons = tabsContainer.querySelectorAll('.tab-button');
      const tabContents = contentContainer.querySelectorAll('.tab-content');
      
      console.log(`Found ${tabButtons.length} tab buttons and ${tabContents.length} content sections`);
      
      // Remove active class from all buttons
      tabButtons.forEach(button => {
        button.classList.remove('active');
      });
      
      // Hide all content
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
      
      // Activate the selected tab
      const selectedButton = tabsContainer.querySelector(`.tab-button[data-tab="${tabId}"]`);
      if (selectedButton) {
        selectedButton.classList.add('active');
        console.log(`Activated tab button: ${tabId}`);
      } else {
        console.error(`Tab button not found: ${tabId}`);
      }
      
      // Show the selected content
      const selectedContent = document.getElementById(`tab-${tabId}`);
      if (selectedContent) {
        selectedContent.style.display = 'block';
        console.log(`Showing tab content: tab-${tabId}`);
      } else {
        console.error(`Tab content not found: tab-${tabId}`);
      }
    },
    
    // List all available tabs
    listTabs: function() {
      const tabsContainer = document.getElementById('preview-tabs');
      if (!tabsContainer) {
        console.error('Could not find tabs container');
        return;
      }
      
      const tabs = tabsContainer.querySelectorAll('.tab-button');
      console.log('Available tabs:');
      tabs.forEach(tab => {
        const tabId = tab.dataset.tab;
        const isActive = tab.classList.contains('active');
        console.log(`- ${tabId} ${isActive ? '(active)' : ''}`);
      });
    },
    
    // Fix all tab button event listeners
    fixTabListeners: function() {
      const tabsContainer = document.getElementById('preview-tabs');
      const contentContainer = document.querySelector('.preview-content');
      
      if (!tabsContainer || !contentContainer) {
        console.error('Could not find tab containers');
        return;
      }
      
      const tabs = tabsContainer.querySelectorAll('.tab-button');
      tabs.forEach(tab => {
        // Clone the node to remove existing listeners
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        
        // Add new listener
        const tabId = newTab.dataset.tab;
        if (tabId) {
          newTab.addEventListener('click', function(e) {
            e.preventDefault();
            window.fixTabs.activateTab(tabId);
          });
          console.log(`Fixed listener for tab: ${tabId}`);
        }
      });
      
      console.log('All tab listeners have been reset.');
    }
  };
  
  // Add a MutationObserver to detect DOM changes and fix tab issues automatically
  const tabObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.target.id === 'preview-tabs') {
        console.log('Tab container changed, fixing listeners...');
        window.fixTabs.fixTabListeners();
      }
    });
  });
  
  // Start observing once the DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    const tabsContainer = document.getElementById('preview-tabs');
    if (tabsContainer) {
      tabObserver.observe(tabsContainer, { childList: true, subtree: true });
      console.log('Tab observer started');
    }
  });