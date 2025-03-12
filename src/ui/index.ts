/**
 * Figma Token Manager
 * Main UI entry point
 */

import './styles/index.css';

// Import components
import { setupHeader } from './components/header';
import { setupSidebarPanel, SidebarCallbacks } from './components/sidebarPanel';
import { setupTokenGrid, TokenData } from './components/tokenGrid';
import { setupTokenDetailsPanel } from './components/tokenDetailsPanel';

// State
let activeView: 'visual' | 'json' = 'visual';
let tokenData: any = null;
let currentTokens: TokenData[] = [];

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing UI components');
  
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
  
  // 3. Setup token grid
  const tokenGridInterface = setupTokenGrid('token-grid-container', [], (token) => {
    console.log('Token clicked:', token);
    showTokenDetails(token);
  });
  
  // 4. Setup token details panel
  const detailsPanelInterface = setupTokenDetailsPanel('details-panel-container');
  
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
    detailsPanelInterface.show(token);
  }
  
  /**
   * Filter tokens based on sidebar selection and display them
   */
  function filterAndDisplayTokens() {
    if (!tokenData) return;
    
    const state = sidebarInterface.getState();
    const grouping = (document.getElementById('grouping-select') as HTMLSelectElement)?.value || 'type';
    
    // Filter tokens based on selected collections and modes
    let filteredTokens: TokenData[] = [];
    
    // Process each selected collection
    for (const collection of state.selectedCollections) {
      if (tokenData[collection]) {
        const modesForCollection = state.selectedModes.get(collection) || [];
        
        // Process each selected mode in this collection
        for (const mode of modesForCollection) {
          if (tokenData[collection][mode]) {
            // Extract tokens from this collection/mode
            const tokensInMode = extractTokensFromData(
              tokenData[collection][mode], 
              `${collection}.${mode}`
            );
            
            filteredTokens = [...filteredTokens, ...tokensInMode];
          }
        }
      }
    }
    
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
    
    // Update visual token grid
    tokenGridInterface.update(filteredTokens);
    
    // Update JSON view if it's active
    if (activeView === 'json') {
      updateJsonView();
    }
  }
  
  /**
   * Extract tokens from nested data structure
   */
  function extractTokensFromData(data: any, basePath: string): TokenData[] {
    const tokens: TokenData[] = [];
    
    function processObject(obj: any, path: string, namePath: string) {
      for (const key in obj) {
        const value = obj[key];
        const newPath = path ? `${path}.${key}` : key;
        const newNamePath = namePath ? `${namePath}.${key}` : key;
        
        // Check if it's a DTCG token
        if (value && typeof value === 'object' && value.$value !== undefined) {
          const tokenType = value.$type || 'unknown';
          const isReference = typeof value.$value === 'string' && 
                             value.$value.startsWith('{') && 
                             value.$value.endsWith('}');
          
          tokens.push({
            id: newPath,
            name: newNamePath,
            value: value.$value,
            type: tokenType,
            path: newPath,
            reference: isReference,
            resolvedValue: isReference ? null : undefined
          });
        } 
        // Continue processing nested objects
        else if (value && typeof value === 'object') {
          processObject(value, newPath, newNamePath);
        }
      }
    }
    
    processObject(data, basePath, '');
    return tokens;
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