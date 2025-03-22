/**
 * Figma Token Manager
 * Main UI entry point - Updated with responsive layout improvements
 */

import './styles/index.css';

// Initialize resize functionality
function initResizeHandle() {
  const resizeHandle = document.getElementById('resize-handle');
  if (!resizeHandle) return;

  let isResizing = false;

  function startResize(e: PointerEvent) {
    isResizing = true;
    document.body.style.userSelect = 'none';
    resizeHandle.setPointerCapture(e.pointerId);
  }

  function stopResize() {
    isResizing = false;
    document.body.style.userSelect = '';
    resizeHandle.releasePointerCapture(0);
  }

  function resize(e: PointerEvent) {
    if (!isResizing) return;
    
    // Calculate new size (min 400x300)
    const size = {
      w: Math.max(400, Math.floor(e.clientX + 16)),
      h: Math.max(300, Math.floor(e.clientY + 16))
    };
    
    // Send resize message to plugin
    parent.postMessage({ 
      pluginMessage: { 
        type: 'resize', 
        size 
      }
    }, '*');
  }

  // Add event listeners
  resizeHandle.addEventListener('pointerdown', startResize);
  resizeHandle.addEventListener('pointermove', resize);
  resizeHandle.addEventListener('pointerup', stopResize);
  resizeHandle.addEventListener('pointercancel', stopResize);
}

// Import components
import { setupHeader } from './components/header';
import { setupSidebarPanel, SidebarInterface, SidebarCallbacks } from './components/sidebarPanel';
import { TokenData } from './reference/ReferenceResolver';
import { createTokenGrid } from './components/TokenGrid';
import { setupTokenDetailsPanel } from './components/tokenDetailsPanel';
import { CollectionSelector } from './components/collectionSelector';
import { updateJsonViewer, setupJsonEditorPanel, getJsonFromViewer } from './components/jsonViewIntegration';
import { updateFigmaVariables } from './utilities/updateFigmaVariables'; // Import update handler
import { showExportDialog, ExportOptions } from './components/exportDialog'; // Import export dialog

// Import reference handling utilities
import { processTokensWithReferences, extractTokenList } from './reference/ReferenceResolver';

// Import token filtering utilities
import { 
  filterTokensByActiveCollection,
  createReferenceResolverMap,
  extractDisplayTokens
} from './utilities/tokenFilter';

// Import map adapter for type compatibility
import { convertToArrayMap } from './utilities/mapAdapter';

// Import color format handlers
import { setupColorFormatHandlers } from './color-handlers';

// State
let activeView: 'visual' | 'json' = 'visual';
let tokenData: any = null;
let currentTokens: TokenData[] = [];
let currentColorFormat = 'hex';
let sidebarInterface: SidebarInterface | null = null;

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing UI components');
  
  // Initialize resize handle
  initResizeHandle();
  
  // Setup color format handlers
  setupColorFormatHandlers();
  
  // 1. Setup header with view toggle and sidebar toggle
  const headerInterface = setupHeader('header-container', (view) => {
    // Handle view change
    activeView = view;
    updateActiveView();
  });
  
  // Make header interface globally accessible for the sidebar collapse button
  (window as any).headerInterface = headerInterface;
  
  // Initialize responsive sidebar
  function initResponsiveSidebar() {
    const sidebar = document.getElementById('sidebar-container');
    if (!sidebar) return;
    
    // If we're in a small viewport, hide sidebar by default
    if (window.innerWidth <= 960) {
      sidebar.classList.remove('visible');
    } else {
      sidebar.classList.add('visible');
    }
    
    // Respond to window resize events for responsive layout
    window.addEventListener('resize', () => {
      // Hide sidebar on smaller screens
      if (window.innerWidth <= 960) {
        sidebar.classList.remove('visible');
      }
    });
  }
  
  // Initialize responsive behavior
  initResponsiveSidebar();
  
  // 2. Setup sidebar panel with callbacks
  const sidebarCallbacks: SidebarCallbacks = {
    onActiveCollectionChange: (collection) => {
      console.log(`Active collection changed to: ${collection}`);
      filterAndDisplayTokens();
    },
    onModeChange: (collection, mode) => {
      console.log(`Mode changed for ${collection} to ${mode}`);
      filterAndDisplayTokens();
    },
    onSettingsChange: (setting, value) => {
      console.log(`Setting ${setting} changed to ${value}`);
      
      // Handle specific settings
      if (setting === 'colorFormat') {
        currentColorFormat = value;
        applyColorFormat(value);
      }
    },
    onExtract: () => {
      console.log('Extract tokens requested');
      requestTokenExtraction();
    },
    onExport: () => {
      console.log('Export tokens requested');
      exportTokens();
    }
  };
  
  sidebarInterface = setupSidebarPanel('sidebar-container', sidebarCallbacks);
  
  
  // 3. Setup token grid - The updated createTokenGrid now handles category organization
  const tokenGridInterface = createTokenGrid({
    tokens: [],
    onTokenClick: (token) => {
      console.log('TokenGrid onTokenClick called:', token);
      showTokenDetails(token);
    }
  });
  
  // Add the token grid to the container
  const tokenGridContainer = document.getElementById('token-grid-container');
  if (tokenGridContainer) {
    tokenGridContainer.appendChild(tokenGridInterface.element);
  }
  
  // 4. Setup token details panel
  const detailsPanelInterface = setupTokenDetailsPanel('details-panel-container');
  
  /**
   * Updates the active view (visual or JSON)
   */
  function updateActiveView(): void {
    const visualContainer = document.getElementById('token-grid-container');
    const jsonContainer = document.getElementById('json-view-container');
    
    if (visualContainer && jsonContainer) {
      if (activeView === 'visual') {
        visualContainer.style.display = 'block';
        jsonContainer.style.display = 'none';
      } else {
        visualContainer.style.display = 'none';
        jsonContainer.style.display = 'block';
        updateJsonView();
      }
    }
  }
  
  /**
   * Updates the JSON view with current token data
   * Modified to use enhanced JSON viewer with syntax highlighting and line numbers
   */
  function updateJsonView(): void {
    if (!sidebarInterface) return;
    
    const state = sidebarInterface.getState();
    
    // Filter data based on selected collection and mode
    const filteredData = filterTokensByActiveCollection(
      tokenData,
      state.activeCollection,
      state.selectedModes
    );
    
    // Get the container element
    const container = document.getElementById('json-view-container');
    if (!container) return;
    
    // Check if the enhanced viewer is already initialized
    const viewerContent = container.querySelector('#json-viewer-content');
    
    if (!viewerContent) {
      // First time - setup the JSON editor panel with the enhanced viewer
      setupJsonEditorPanel('json-view-container', filteredData);
    } else {
      // Update existing viewer with new data
      updateJsonViewer(filteredData);
    }
  }
  
  /**
   * Save JSON data back to Figma variables with improved feedback loop
   */
  async function saveJsonToFigma(): Promise<void> {
    try {
      // Get JSON from our viewer component
      const updatedJson = getJsonFromViewer();
      
      if (!updatedJson) {
        console.error('No JSON data available to save');
        return;
      }
      
      // Create a deep copy of the JSON to avoid any modifications
      const jsonCopy = JSON.parse(JSON.stringify(updatedJson));
      
      console.log('Saving JSON to Figma variables:', jsonCopy);
      
      // Show saving message
      const messageArea = document.querySelector('.json-editor-message') as HTMLElement;
      if (messageArea) {
        messageArea.textContent = 'Saving changes to Figma variables...';
        messageArea.className = 'json-editor-message pending';
      }
      
      // Send the updated JSON to Figma
      await updateFigmaVariables(jsonCopy);
      
      // Show success message immediately, but don't wait for extraction
      if (messageArea) {
        messageArea.textContent = 'Variables updated successfully!';
        messageArea.className = 'json-editor-message success';
      }
      
      // Clear any existing timeout
      if (window.extractionTimeout) {
        clearTimeout(window.extractionTimeout);
      }
      
      // Add a timeout to ensure we can cancel it if needed
      window.extractionTimeout = setTimeout(() => {
        // Request fresh extraction to refresh data
        console.log('Requesting token extraction after save...');
        
        // Show extracting message
        if (messageArea) {
          messageArea.textContent = 'Refreshing token data...';
          messageArea.className = 'json-editor-message pending';
        }
        
        // Reset the timeout variable
        window.extractionTimeout = null;
        
        // Request the extraction
        requestTokenExtraction();
        
        // Set a failsafe timeout to clear the message if extraction doesn't complete
        setTimeout(() => {
          if (messageArea && messageArea.textContent === 'Refreshing token data...') {
            messageArea.textContent = 'Variables updated successfully!';
            messageArea.className = 'json-editor-message success';
          }
        }, 5000); // 5 second timeout
        
      }, 1000); // Wait 1 second before extraction
    } catch (error) {
      console.error('Error saving JSON to Figma:', error);
      
      // Show error message
      const messageArea = document.querySelector('.json-editor-message') as HTMLElement;
      if (messageArea) {
        messageArea.textContent = `Error updating variables: ${error instanceof Error ? error.message : 'Unknown error'}`;
        messageArea.className = 'json-editor-message error';
      }
    }
  }
  
  /**
   * Show token details in the panel
   */
  function showTokenDetails(token: TokenData): void {
    console.log('showTokenDetails called:', token);
    detailsPanelInterface.show(token);
  }
  
  /**
   * Filter tokens based on active collection and display them
   */
  function filterAndDisplayTokens(): void {
    if (!tokenData || !sidebarInterface) return;
    
    const state = sidebarInterface.getState();
    const activeCollection = state.activeCollection;
    
    // Extract tokens for display
    const { 
      displayTokens, 
      referenceMap,
      unresolvedReferences 
    } = extractDisplayTokens(
      tokenData,
      activeCollection,
      state.selectedModes
    );
    
    // Process tokens with references
    // Convert Map<string, string> to Map<string, string[]> for compatibility
    const modesArrayMap = convertToArrayMap(state.selectedModes);
    
    const resolverData = createReferenceResolverMap(tokenData, state.selectedModes);
    const processedTokenData = processTokensWithReferences(
      resolverData,
      Array.from(state.selectedModes.keys()),
      modesArrayMap // Use the converted map here
    );
    
    // Get all tokens from the active collection
    let allTokens = extractTokenList(processedTokenData);
    
    // Filter tokens to show only the active collection
    if (activeCollection) {
      allTokens = allTokens.filter(token => {
        return token.path.startsWith(`${activeCollection}.`);
      });
    }
    
    // Count resolved references for status display
    const resolvedRefs = allTokens.filter(t => t.reference && t.resolvedValue).length;
    const unresolvedRefs = allTokens.filter(t => t.reference && !t.resolvedValue).length;
    
    // Update reference status in sidebar
    sidebarInterface.setReferenceCounts(resolvedRefs, unresolvedRefs);
    
    // Update reference warning if needed
    updateReferenceWarning(unresolvedRefs);
    
    // Store current tokens
    currentTokens = allTokens;
    
    // Update token grid with filtered tokens
    tokenGridInterface.update(allTokens);
    
    // Update JSON view if it's active
    if (activeView === 'json') {
      updateJsonView();
    }
    
    // Update the main panel title to show the active collection
    updateMainPanelTitle(activeCollection);
  }
  
  /**
   * Update the main panel title to show the active collection and mode
   */
  function updateMainPanelTitle(activeCollection: string | null): void {
    if (!sidebarInterface) return;
    
    const titleEl = document.querySelector('.main-panel-title');
    if (titleEl && activeCollection) {
      const state = sidebarInterface.getState();
      const selectedMode = state.selectedModes.get(activeCollection);
      titleEl.textContent = `${activeCollection}/${selectedMode}`;
    } else if (titleEl) {
      titleEl.textContent = 'Design Tokens';
    }
  }
  
  /**
   * Update reference warning based on token data
   */
  function updateReferenceWarning(unresolvedCount: number): void {
    const warningEl = document.getElementById('reference-warning');
    const warningTextEl = document.getElementById('reference-warning-text');
    
    if (!warningEl || !warningTextEl) return;
    
    if (unresolvedCount > 0) {
      warningEl.style.display = 'flex';
      warningTextEl.textContent = `${unresolvedCount} unresolved references found`;
    } else {
      warningEl.style.display = 'none';
    }
  }
  
  /**
   * Apply color format to tokens
   */
  function applyColorFormat(format: string): void {
    // Send message to plugin to transform colors
    parent.postMessage({ 
      pluginMessage: { 
        type: 'apply-color-format',
        colorFormat: format
      } 
    }, '*');
  }
  
  /**
   * Request token extraction from Figma
   */
  function requestTokenExtraction(): void {
    // Send message to plugin to extract tokens
    parent.postMessage({ 
      pluginMessage: { 
        type: 'extract-tokens'
      } 
    }, '*');
  }
  
  /**
   * Export tokens - Shows the export dialog
   */
  function exportTokens(): void {
    if (!tokenData || !sidebarInterface) return;
    
    // Show the export dialog
    showExportDialog({
      tokenData,
      onExport: (exportOptions: ExportOptions) => {
        console.log('Export options:', exportOptions);
        
        // Send message to plugin to export tokens
        parent.postMessage({ 
          pluginMessage: { 
            type: 'export-tokens',
            options: exportOptions
          } 
        }, '*');
      },
      onCancel: () => {
        console.log('Export cancelled');
      }
    });
  }
  
  // Notify the plugin that the UI is ready
  parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');
  
  // Listen for messages from the plugin
  window.onmessage = (event) => {
    const message = event.data.pluginMessage;
    if (!message) return;
    
    console.log('Message from plugin:', message.type);
    
    switch (message.type) {
      case 'tokens-data':
        // Store the original token data
        tokenData = message.data;
        
        // Update sidebar with new token data
        if (sidebarInterface) {
          sidebarInterface.updateTokenData(tokenData);
        }
        
        // Filter and display tokens
        filterAndDisplayTokens();
        
        // Update message in JSON editor if we're in a refresh after save operation
        const messageArea = document.querySelector('.json-editor-message') as HTMLElement;
        if (messageArea && messageArea.textContent === 'Refreshing token data...') {
          messageArea.textContent = 'Variables updated and data refreshed successfully!';
          messageArea.className = 'json-editor-message success';
        }
        break;
              
      case 'update-variables-result':
        // Handle update variables result
        if (message.success) {
          console.log('Variables updated successfully');
          
          // Format counts for display
          const createdCount = message.created || 0;
          const updatedCount = message.updated || 0;
          const collectionsCount = message.collections || 0;
          const modesCount = message.modes || 0;
          const renamedCount = message.renamed || 0;
          const deletedCount = message.deleted || 0;
          const totalCount = createdCount + updatedCount;
          
          // Check if there are warnings about reference resolution
          if (message.warnings && Array.isArray(message.warnings) && message.warnings.length > 0) {
            console.log('Reference warnings:', message.warnings);
            
            // Show warning message with details
            const messageArea = document.querySelector('.json-editor-message');
            if (messageArea) {
              // Build warning message with all counts
              const parts = [];
              
              if (totalCount > 0) {
                parts.push(`${totalCount} variables (${createdCount} created, ${updatedCount} updated)`);
              }
              if (collectionsCount > 0) {
                parts.push(`${collectionsCount} collection${collectionsCount > 1 ? 's' : ''}`);
              }
              if (modesCount > 0) {
                parts.push(`${modesCount} mode${modesCount > 1 ? 's' : ''}`);
              }
              
              const changesText = parts.length > 0 ? parts.join(', ') : 'items';
              const warningMessage = `Updated ${changesText} with ${message.warnings.length} warning(s).`;
              messageArea.textContent = warningMessage;
              (messageArea as HTMLElement).className = 'json-editor-message warning';
              
              // Add a details section for warnings (up to 3)
              if (message.warnings.length > 0) {
                const details = document.createElement('div');
                details.className = 'message-details';
                details.innerHTML = message.warnings.slice(0, 3).map(w => `- ${w}`).join('<br>');
                if (message.warnings.length > 3) {
                  details.innerHTML += `<br>- ... and ${message.warnings.length - 3} more`;
                }
                messageArea.appendChild(details);
              }
            }
          }
          // Check if there's an informational message even on success
          else if (message.error) {
            console.log('Information from variable update:', message.error);
            
            // Show informational message if we have the message area
            const messageArea = document.querySelector('.json-editor-message');
            if (messageArea) {
              // This is an informational message, not an error
              messageArea.textContent = `${message.error}`;
              (messageArea as HTMLElement).className = 'json-editor-message info';
            }
          } else {
            // Show success message if we have the message area
            const messageArea = document.querySelector('.json-editor-message');
            if (messageArea) {
              // Build a detailed success message with all counts
              let successMessage = '';
              const changes = [];
              
              // Add variable counts
              if (totalCount > 0) {
                changes.push(`${totalCount} variables (${createdCount} created, ${updatedCount} updated)`);
              }
              
              // Add collection counts
              if (collectionsCount > 0) {
                changes.push(`${collectionsCount} collection${collectionsCount > 1 ? 's' : ''}`);
              }
              
              // Add mode counts
              if (modesCount > 0) {
                changes.push(`${modesCount} mode${modesCount > 1 ? 's' : ''}`);
              }
              
              // Add renamed counts
              if (renamedCount > 0) {
                changes.push(`${renamedCount} item${renamedCount > 1 ? 's' : ''} renamed`);
              }
              
              // No longer showing deletion counts as auto-deletion is disabled
              
              if (changes.length > 0) {
                successMessage = `Successfully updated ${changes.join(', ')}! Other items were preserved.`;
              } else {
                successMessage = 'No changes needed. All items are up to date.';
              }
              
              messageArea.textContent = successMessage;
              (messageArea as HTMLElement).className = 'json-editor-message success';
            }
          }
        } else {
          console.error('Error updating variables:', message.error);
          
          // Show error message if we have the message area
          const messageArea = document.querySelector('.json-editor-message');
          if (messageArea) {
            messageArea.textContent = `Error: ${message.error || 'Unknown error updating variables'}`;
            (messageArea as HTMLElement).className = 'json-editor-message error';
          }
        }
        break;
        
      case 'download-file':
        // Handle file download from plugin
        console.log('Received file for download:', message.fileName);
        
        try {
          // Convert array back to Uint8Array
          const uint8Array = new Uint8Array(message.buffer);
          
          // Create a blob from the data
          const blob = new Blob([uint8Array], { type: 'application/zip' });
          
          // Create a URL for the blob
          const url = URL.createObjectURL(blob);
          
          // Create a link element to trigger the download
          const a = document.createElement('a');
          a.href = url;
          a.download = message.fileName;
          a.style.display = 'none';
          
          // Add link to document, click, and remove
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Clean up the URL object
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          
          // Show a temporary notification
          const notification = document.createElement('div');
          notification.className = 'export-notification';
          notification.textContent = 'Export completed! ZIP file downloaded.';
          notification.style.position = 'fixed';
          notification.style.bottom = '20px';
          notification.style.right = '20px';
          notification.style.backgroundColor = '#4CAF50';
          notification.style.color = 'white';
          notification.style.padding = '10px 20px';
          notification.style.borderRadius = '4px';
          notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          notification.style.zIndex = '1000';
          document.body.appendChild(notification);
          
          // Remove notification after a delay
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 3000);
          
          console.log('File download initiated');
        } catch (error) {
          console.error('Error downloading file:', error);
          alert(`Error downloading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
        
      case 'error':
        // Handle error message
        console.error('Error from plugin:', message.message);
        // Show error message to user
        alert(`Error: ${message.message}`);
        break;
    }
  };
});