/**
 * Main UI Integration
 * Integrates the new token display components with the existing UI
 */

import { setupTokenDisplayManager } from './components/TokenDisplayManager';
// Make sure all dependencies are properly imported
import './components/ModeToggle';
import './components/SectionNavigation';
import './components/HierarchicalTokens';

/**
 * Initializes the enhanced token display UI
 */
export function initializeEnhancedUI(tokenData: any, filterOptions?: any): void {
  // Get the main panel container where tokens should be displayed
  const mainPanelContent = document.getElementById('token-content-container');
  if (!mainPanelContent) {
    console.error('Main panel content container not found');
    return;
  }
  
  // Clear existing content
  const oldVisualView = mainPanelContent.querySelector('.visual-view');
  if (oldVisualView) {
    oldVisualView.innerHTML = '';
  }
  
  // Create token display manager
  const tokenManager = setupTokenDisplayManager({
    containerId: 'token-grid-container',
    tokenData,
    onTokenClick: (path, value, type) => {
      console.log('Token clicked:', path, value, type);
      // This should integrate with existing token details panel
      showTokenDetails(path, value, type);
    }
  });
  
  // Apply filters if provided
  if (filterOptions) {
    tokenManager.filterTokens(filterOptions);
  }
  
  // Expose the token manager to the global scope for future updates
  (window as any).tokenDisplayManager = tokenManager;
}

/**
 * Shows token details in the details panel
 * This should be adapted to work with the existing token details panel
 */
function showTokenDetails(path: string, value: any, type: string): void {
    // Get the token details from the data and convert to the expected format
    const tokenData = {
      id: path,
      name: path.split('.').pop() || '',
      path: path,
      value: value,
      type: type,
      reference: typeof value === 'string' && value.startsWith('{') && value.endsWith('}')
    };
    
    // Call the existing token details display function or global function
    if (typeof (window as any).showTokenDetails === 'function') {
      (window as any).showTokenDetails(tokenData);
    } else {
      // Create a global function to pass through showTokenDetails
      // This makes the function available to be called from outside
      (window as any).showTokenDetails = (token: any) => {
        console.log('Global showTokenDetails called with token:', token);
        
        // Find the detailsPanelInterface in the window scope
        if ((window as any).detailsPanelInterface && 
            typeof (window as any).detailsPanelInterface.show === 'function') {
          (window as any).detailsPanelInterface.show(token);
        } else {
          console.error('detailsPanelInterface not found');
          
          // Try to find the details panel container directly
          const detailsPanel = document.getElementById('details-panel-container');
          if (detailsPanel) {
            // Show the details panel
            detailsPanel.style.display = 'block';
            detailsPanel.classList.add('visible');
            document.querySelector('.plugin-container')?.classList.add('show-details');
            
            // Display some basic information
            detailsPanel.innerHTML = `
              <div class="token-details-panel">
                <div class="token-details-header">
                  <h2>Token Details</h2>
                  <button type="button" class="close-button">×</button>
                </div>
                <div class="token-details-content">
                  <div><strong>Path:</strong> ${token.path}</div>
                  <div><strong>Type:</strong> ${token.type}</div>
                  <div><strong>Value:</strong> ${token.value}</div>
                </div>
              </div>
            `;
            
            // Add close button event listener
            const closeButton = detailsPanel.querySelector('.close-button');
            if (closeButton) {
              closeButton.addEventListener('click', () => {
                detailsPanel.style.display = 'none';
                detailsPanel.classList.remove('visible');
                document.querySelector('.plugin-container')?.classList.remove('show-details');
              });
            }
          }
        }
      };
      
      // Now call it
      (window as any).showTokenDetails(tokenData);
    }
  }

/**
 * Updates the token display with new data
 * Can be called when token data changes
 */
export function updateTokenDisplay(tokenData: any, filterOptions?: any): void {
  if ((window as any).tokenDisplayManager) {
    // Update the tokens
    (window as any).tokenDisplayManager.updateTokens(tokenData);
    
    // Apply filters if provided
    if (filterOptions) {
      (window as any).tokenDisplayManager.filterTokens(filterOptions);
    }
  } else {
    // Initialize if not already done
    initializeEnhancedUI(tokenData, filterOptions);
  }
}