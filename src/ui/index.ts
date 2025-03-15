/**
 * Figma Token Manager
 * Main UI entry point - Updated to use new reference display components
 */

import './styles/index.css';

// Import components
import { setupHeader } from './components/header';
import { setupSidebarPanel, SidebarCallbacks } from './components/sidebarPanel';
import { TokenData } from './reference/ReferenceResolver'; // Import TokenData from the correct source
import { createTokenGrid } from './components/TokenGrid';
import { createTokenDetails } from './components/TokenDetails'; // Use the correct function name

// Import reference handling utilities
import { buildTokenMap, processTokensWithReferences, extractTokenList } from './reference/ReferenceResolver'; // New imports

// Import utilities
import { diagnoseReferenceIssues } from '../code/formatters/tokenResolver';
import { setupColorFormatHandlers } from './color-handlers';

// State
let activeView: 'visual' | 'json' = 'visual';
let tokenData: any = null;
let currentTokens: TokenData[] = [];
let currentColorFormat = 'hex';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing UI components');
  
  // Setup color format handlers (radio buttons in settings)
  setupColorFormatHandlers();
  
  // 1. Setup header with view toggle
  const headerInterface = setupHeader('header-container', (view) => {
    // Handle view change
    activeView = view;
    updateActiveView();
  });
  
  // 2. Setup sidebar panel
  const sidebarCallbacks: SidebarCallbacks = {
    onCollectionToggle: (collection, selected) => {
      console.log(`Collection ${collection} ${selected ? 'selected' : 'unselected'}`);
      filterAndDisplayTokens();
    },
    onModeToggle: (collection, mode, selected) => {
      console.log(`Mode ${mode} in collection ${collection} ${selected ? 'selected' : 'unselected'}`);
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
  
  const sidebarInterface = setupSidebarPanel('sidebar-container', [], {}, sidebarCallbacks);
  
  // 3. Setup token grid using new component
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
  
  // 4. Setup token details panel using new component
  const detailsPanelContainer = document.getElementById('details-panel-container');
  console.log('Details panel container:', detailsPanelContainer);
  // In index.ts 

const detailsPanelInterface = {
  show: (token: TokenData) => {
    console.log('detailsPanelInterface.show called:', token);
    if (detailsPanelContainer) {
      console.log('detailsPanelContainer exists');
      // Clear existing content
      detailsPanelContainer.innerHTML = '';
      
      // Create details panel
      const detailsPanel = createTokenDetails({
        token,
        onClose: () => {
          // Hide the details panel
          if (detailsPanelContainer) {
            detailsPanelContainer.innerHTML = '';
            detailsPanelContainer.style.display = 'none';
            // Remove show-details class from container
            document.querySelector('.plugin-container')?.classList.remove('show-details');
          }
        }
      });
      
      // Add panel to container and show it
      detailsPanelContainer.appendChild(detailsPanel);
      detailsPanelContainer.style.display = 'block';
      detailsPanelContainer.classList.add('visible'); // Add visible class
      
      // Add show-details class to container
      document.querySelector('.plugin-container')?.classList.add('show-details');
    } else {
      console.log('detailsPanelContainer is null or undefined');
    }
  }
};

  // 5. Setup grouping select
  const groupingSelect = document.getElementById('grouping-select') as HTMLSelectElement;
  if (groupingSelect) {
    groupingSelect.addEventListener('change', () => {
      console.log('Grouping changed:', groupingSelect.value);
      filterAndDisplayTokens();
    });
  }
  
  /**
   * Updates the active view (visual or JSON)
   */
  function updateActiveView() {
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
  function updateJsonView() {
    const jsonContent = document.getElementById('json-content');
    if (jsonContent && tokenData) {
      const state = sidebarInterface.getState();
      
      // Filter data based on selected collections and modes
      const filteredData: any = {};
      
      for (const collection in tokenData) {
        if (state.selectedCollections.includes(collection)) {
          filteredData[collection] = {};
          
          const modesForCollection = state.selectedModes.get(collection) || [];
          for (const mode in tokenData[collection]) {
            if (modesForCollection.includes(mode)) {
              filteredData[collection][mode] = tokenData[collection][mode];
            }
          }
        }
      }
      
      // Convert to formatted JSON
      jsonContent.textContent = JSON.stringify(filteredData, null, 2);
    }
  }
  
  /**
   * Show token details in the panel
   */
  function showTokenDetails(token: TokenData) {
    console.log('showTokenDetails called:', token);
    detailsPanelInterface.show(token);
  }
  
  /**
   * Filter tokens based on sidebar selection and display them
   */
  function filterAndDisplayTokens() {
    if (!tokenData) return;
    
    const state = sidebarInterface.getState();
    const grouping = (document.getElementById('grouping-select') as HTMLSelectElement)?.value || 'type';
    
    // Get all tokens from the processed data
    let allTokens = extractTokenList(tokenData);
    
    // Filter tokens based on selected collections and modes
    const filteredTokens = allTokens.filter(token => {
      const [collection, mode] = token.path.split('.');
      return state.selectedCollections.includes(collection) &&
             (state.selectedModes.get(collection) || []).includes(mode);
    });
    
    // Update reference warning if needed
    updateReferenceWarning(filteredTokens);
    
    // Sort tokens based on grouping
    if (grouping === 'type') {
      filteredTokens.sort((a, b) => a.type.localeCompare(b.type));
    } else if (grouping === 'collection') {
      filteredTokens.sort((a, b) => a.path.split('.')[0].localeCompare(b.path.split('.')[0]));
    } else if (grouping === 'alphabetical') {
      filteredTokens.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Store current tokens
    currentTokens = filteredTokens;
    
    // Update token grid with filtered tokens
    tokenGridInterface.update(filteredTokens);
    
    // Update JSON view if it's active
    if (activeView === 'json') {
      updateJsonView();
    }
  }
  
  /**
   * Update reference warning based on token data
   */
  function updateReferenceWarning(tokens: TokenData[]) {
    const warningEl = document.getElementById('reference-warning');
    const warningTextEl = document.getElementById('reference-warning-text');
    
    if (!warningEl || !warningTextEl) return;
    
    // Count unresolved references
    const unresolvedCount = tokens.filter(t => t.reference && !t.resolvedValue).length;
    const resolvedCount = tokens.filter(t => t.reference && t.resolvedValue).length;
    
    // Update sidebar reference counts
    sidebarInterface.setReferenceCounts(resolvedCount, unresolvedCount);
    
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
  function applyColorFormat(format: string) {
    // This would send a message to the plugin to transform colors
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
  function requestTokenExtraction() {
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
  function exportTokens() {
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
        // Process and store received token data
        tokenData = message.data;
        
        // Extract collections for sidebar
        const collections = Object.keys(tokenData).map(collectionKey => {
          const modes = Object.keys(tokenData[collectionKey]);
          const tokenCount = countTokensInCollection(tokenData[collectionKey]);
          
          return {
            id: collectionKey,
            name: collectionKey,
            modes,
            count: tokenCount
          };
        });
        
        // Update sidebar with collections
        sidebarInterface.updateCollections(collections);
        
        // Select all collections by default
        sidebarInterface.setState({
          selectedCollections: collections.map(c => c.id),
          expandedCollections: [collections[0]?.id].filter(Boolean),
          selectedModes: new Map(
            collections.map(c => [c.id, c.modes])
          )
        });
        
        // Run diagnostics for reference issues
        const diagnostics = diagnoseReferenceIssues(tokenData);
        
        // Update reference counts in the sidebar
        sidebarInterface.setReferenceCounts(
          diagnostics.resolvedCount, 
          diagnostics.unresolvedCount
        );
        
        // Process tokens with reference information using our new ReferenceResolver
        tokenData = processTokensWithReferences(tokenData);
        
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
  
  /**
   * Count tokens in a collection
   */
  function countTokensInCollection(collection: any): number {
    let count = 0;
    
    function countInObject(obj: any) {
      for (const key in obj) {
        const value = obj[key];
        
        // Count DTCG tokens
        if (value && typeof value === 'object' && value.$value !== undefined) {
          count++;
        } 
        // Recurse into nested objects
        else if (value && typeof value === 'object') {
          countInObject(value);
        }
      }
    }
    
    for (const mode in collection) {
      countInObject(collection[mode]);
    }
    
    return count;
  }
});