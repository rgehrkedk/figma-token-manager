/**
 * Figma Token Manager
 * Main UI entry point - Properly separated UI and functionality
 * Updated to include token category navigation
 */

import './styles/index.css';

// Import components
import { setupHeader } from './components/header';
import { setupSidebarPanel, SidebarInterface, SidebarCallbacks } from './components/sidebarPanel';
import { TokenData } from './reference/ReferenceResolver';
import { createTokenGrid } from './components/TokenGrid'; // This now includes category navigation
import { setupTokenDetailsPanel } from './components/tokenDetailsPanel';
import { CollectionSelector } from './components/collectionSelector';

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
  
  // Setup color format handlers
  setupColorFormatHandlers();
  
  // 1. Setup header with view toggle
  const headerInterface = setupHeader('header-container', (view) => {
    // Handle view change
    activeView = view;
    updateActiveView();
  });
  
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
   */
  function updateJsonView(): void {
    if (!sidebarInterface) return;
    
    const jsonContent = document.getElementById('json-content');
    if (jsonContent && tokenData) {
      const state = sidebarInterface.getState();
      
      // Filter data based on selected collection and mode
      const filteredData = filterTokensByActiveCollection(
        tokenData,
        state.activeCollection,
        state.selectedModes
      );
      
      // Convert to formatted JSON
      jsonContent.textContent = JSON.stringify(filteredData, null, 2);
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
    
    // Update token grid with filtered tokens - this now includes category organization
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
   * Export tokens
   */
  function exportTokens(): void {
    if (!sidebarInterface) return;
    
    const state = sidebarInterface.getState();
    
    // Get export options from state
    const exportFormat = state.exportFormat;
    const separateFiles = state.separateFiles;
    const flatStructure = state.flatStructure;
    
    // Send message to plugin to export tokens
    parent.postMessage({ 
      pluginMessage: { 
        type: 'export-tokens',
        options: {
          format: exportFormat,
          separateFiles,
          flatStructure
        }
      } 
    }, '*');
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