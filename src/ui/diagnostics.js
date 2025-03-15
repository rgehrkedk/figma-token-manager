/**
 * UI Diagnostics Tool
 * Add this to debug issues with the UI components
 */

// Make global for console access
window.diagnostics = {
    // Check if our UI elements exist
    checkUIElements: function() {
      console.group('UI Elements Check');
      
      // Theme title
      const themeTitle = document.querySelector('.theme-title');
      console.log('Theme title:', themeTitle ? 'Found' : 'Missing');
      
      // Mode toggle
      const modeToggle = document.querySelector('.mode-toggle');
      console.log('Mode toggle:', modeToggle ? 'Found' : 'Missing');
      console.log('Mode buttons:', document.querySelectorAll('.mode-toggle-btn').length);
      
      // Group navigation
      const groupNav = document.querySelector('.group-navigation');
      console.log('Group navigation:', groupNav ? 'Found' : 'Missing');
      console.log('Group links:', document.querySelectorAll('.group-navigation-link').length);
      
      // Token grid
      const tokenGrid = document.getElementById('token-grid-container');
      console.log('Token grid container:', tokenGrid ? 'Found' : 'Missing');
      console.log('Token grid content:', tokenGrid ? tokenGrid.innerHTML.substring(0, 100) + '...' : 'N/A');
      
      console.groupEnd();
      
      return {
        themeTitle: !!themeTitle,
        modeToggle: !!modeToggle,
        groupNav: !!groupNav,
        tokenGrid: !!tokenGrid
      };
    },
    
    // Log information about the token data
    inspectTokenData: function() {
      if (typeof tokenData === 'undefined') {
        console.log('No token data available');
        return;
      }
      
      console.group('Token Data Inspection');
      console.log('Collections:', Object.keys(tokenData));
      
      // Check first collection
      const firstCollection = Object.keys(tokenData)[0];
      if (firstCollection) {
        console.log('Modes in first collection:', Object.keys(tokenData[firstCollection]));
        
        // Check first mode
        const firstMode = Object.keys(tokenData[firstCollection])[0];
        if (firstMode) {
          console.log('Top-level groups in first mode:', 
            Object.keys(tokenData[firstCollection][firstMode]));
        }
      }
      
      console.groupEnd();
    },
    
    // Force the display of UI components
    forceUIDisplay: function() {
      // Create theme header if not exists
      if (!document.querySelector('.theme-title')) {
        const themeHeader = document.createElement('h1');
        themeHeader.className = 'theme-title';
        themeHeader.textContent = 'Theme';
        document.getElementById('token-grid-container').prepend(themeHeader);
      }
      
      // Create mode toggle if not exists
      if (!document.querySelector('.mode-toggle')) {
        const modeToggle = document.createElement('div');
        modeToggle.className = 'mode-toggle';
        modeToggle.innerHTML = `
          <button class="mode-toggle-btn active" data-mode="light">light</button>
          <button class="mode-toggle-btn" data-mode="dark">dark</button>
        `;
        document.getElementById('token-grid-container').appendChild(modeToggle);
        
        // Add click handlers
        modeToggle.querySelectorAll('.mode-toggle-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            modeToggle.querySelectorAll('.mode-toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
          });
        });
      }
      
      // Create group navigation if not exists
      if (!document.querySelector('.group-navigation')) {
        const groupNav = document.createElement('div');
        groupNav.className = 'group-navigation';
        groupNav.innerHTML = `
          <div class="group-navigation-label">Go to group:</div>
          <div class="group-navigation-links">
            <button class="group-navigation-link" data-group="bg">bg</button>
            <button class="group-navigation-link" data-group="fg">fg</button>
            <button class="group-navigation-link" data-group="border">border</button>
            <button class="group-navigation-link" data-group="icons">icons</button>
            <button class="group-navigation-link" data-group="components">components</button>
          </div>
        `;
        document.getElementById('token-grid-container').appendChild(groupNav);
      }
      
      console.log('UI components forced to display');
      return 'UI display forced';
    },
    
    // Run all checks
    runAllChecks: function() {
      this.checkUIElements();
      this.inspectTokenData();
      return 'All diagnostics completed';
    }
  };
  
  // Auto-run diagnostics when script is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Diagnostics script loaded');
    setTimeout(() => {
      window.diagnostics.runAllChecks();
    }, 1000); // Wait a second for everything to initialize
  });