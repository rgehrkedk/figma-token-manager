/**
 * Main controller for the token manager UI
 * Orchestrates communication between components
 */

import { setupVisualTokenPreview } from './components/visualTokenPreview';
import { setupSegmentedToggle } from './components/segmentedToggle';
import { setupCollectionModeSelector } from './components/collectionModeSelector';
import { analyzeReferenceIssues, setupReferenceDiagnosisListeners } from './components/referenceDiagnoser';
import { setupPreviewTabs } from './components/previewTabs';

/**
 * Initialize the token manager UI
 */
export function initializeUI() {
  // Global state
  let tokenData: any = null;
  let selectedCollections: string[] = [];
  let selectedModes = new Map<string, string[]>();
  let flatStructure = false;
  let separateFiles = true;
  
  // DOM elements
  const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement;
  const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
  const validateBtn = document.getElementById('validate-btn') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLElement;
  const collectionList = document.getElementById('collection-modes-list') as HTMLElement;
  const toggleAllBtn = document.getElementById('toggle-all-collections') as HTMLElement;
  const formatRadios = document.querySelectorAll('input[name="format"]') as NodeListOf<HTMLInputElement>;
  const colorFormatRadios = document.querySelectorAll('input[name="color-format"]') as NodeListOf<HTMLInputElement>;
  const separateFilesCheckbox = document.getElementById('separate-files') as HTMLInputElement;
  const validateReferencesCheckbox = document.getElementById('validate-references') as HTMLInputElement;
  const flatStructureCheckbox = document.getElementById('flat-structure') as HTMLInputElement;
  const previewTabsContainer = document.getElementById('preview-tabs') as HTMLElement;
  const previewContentContainer = document.querySelector('.preview-content') as HTMLElement;
  const referenceDiagnosisContainer = document.getElementById('validation-content') as HTMLElement;
  const referenceValidationResults = document.getElementById('reference-validation-results') as HTMLElement;
  
  // Set up preview mode toggle
  const previewModeToggle = document.getElementById('preview-mode-toggle') as HTMLElement;
  const previewContentJson = document.querySelector('.preview-content-json') as HTMLElement;
  const previewContentVisual = document.getElementById('visual-preview-container') as HTMLElement;
  
  // Set up the visual token preview component
  const visualTokenPreview = setupVisualTokenPreview({
    containerId: 'visual-preview-container',
    onTokenClick: (path, value) => {
      console.log(`Token clicked: ${path}`, value);
      // Here you could implement showing a token detail panel
    }
  });
  
  // Set up the segmented toggle for preview mode
  const segmentedToggle = setupSegmentedToggle({
    containerId: 'preview-mode-toggle',
    options: [
      { id: 'json', label: 'JSON' },
      { id: 'visual', label: 'Visual' }
    ],
    initialSelection: 'json',
    onChange: (selectedId) => {
      if (selectedId === 'json') {
        previewContentJson.style.display = 'block';
        previewContentVisual.style.display = 'none';
      } else {
        previewContentJson.style.display = 'none';
        previewContentVisual.style.display = 'block';
      }
    }
  });
  
  /**
   * Initialize the UI
   */
  function init() {
    // Initial setup
    showStatus('Ready to extract tokens', 'info');
    
    // Event listeners
    extractBtn.addEventListener('click', handleExtractTokens);
    downloadBtn.addEventListener('click', handleDownloadTokens);
    validateBtn.addEventListener('click', handleValidateReferences);
    toggleAllBtn.addEventListener('click', handleToggleAll);
    separateFilesCheckbox.addEventListener('change', handleSeparateFilesChange);
    validateReferencesCheckbox.addEventListener('change', handleValidateReferencesChange);
    flatStructureCheckbox.addEventListener('change', handleFlatStructureChange);
    
    formatRadios.forEach(radio => {
      radio.addEventListener('change', handleFormatChange);
    });
    
    colorFormatRadios.forEach(radio => {
      radio.addEventListener('change', handleColorFormatChange);
    });
    
    // Send message to the plugin that the UI is ready
    parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');
  }
  
  /**
   * Handle extract tokens button click
   */
  async function handleExtractTokens() {
    showStatus('Extracting tokens...', 'info');
    extractBtn.disabled = true;
    
    try {
      parent.postMessage({ pluginMessage: { type: 'extract-tokens' } }, '*');
    } catch (error) {
      showStatus(`Error: ${error}`, 'error');
      extractBtn.disabled = false;
    }
  }
  
  /**
   * Handle download tokens button click
   */
  function handleDownloadTokens() {
    if (!tokenData) {
      showStatus('No token data to download', 'error');
      return;
    }
    
    try {
      // Create a filtered version of the tokens based on selection
      const filteredTokens = filterTokensBySelection(tokenData, selectedCollections, selectedModes);
      
      // Get the selected format
      const format = getSelectedFormat();
      
      // Format the tokens based on the selected format
      const formattedTokens = formatTokens(filteredTokens, format);
      
      // Download the tokens
      downloadFormattedTokens(formattedTokens, format, separateFiles);
      
      showStatus('Tokens downloaded successfully', 'success');
    } catch (error) {
      showStatus(`Error downloading tokens: ${error}`, 'error');
    }
  }
  
  /**
   * Handle validate references button click
   */
  function handleValidateReferences() {
    if (!tokenData) {
      showStatus('No token data to validate', 'error');
      return;
    }
    
    try {
      // Show the reference validation results
      referenceValidationResults.style.display = 'block';
      
      // Analyze reference issues
      const diagnosis = analyzeReferenceIssues(tokenData, referenceDiagnosisContainer);
      
      // Set up listeners for fix buttons
      setupReferenceDiagnosisListeners(referenceDiagnosisContainer, tokenData, (fixedTokenData) => {
        // Update the token data with fixed references
        tokenData = fixedTokenData;
        
        // Update the preview
        updatePreview();
        
        showStatus('References fixed', 'success');
      });
      
      if (diagnosis.unresolvedReferences.length === 0) {
        showStatus('All references are valid', 'success');
      } else {
        showStatus(`Found ${diagnosis.unresolvedReferences.length} unresolved references`, 'warning');
      }
    } catch (error) {
      showStatus(`Error validating references: ${error}`, 'error');
    }
  }
  
  /**
   * Handle toggle all collections button click
   */
  function handleToggleAll() {
    if (collectionSelector) {
      // Handle the selection toggling entirely through the collection selector
      // Check if all collections are currently selected
      const availableCollections = collectionData.map(c => c.name);
      const allSelected = availableCollections.every(c => 
        collectionSelector.getSelectedCollections().includes(c)
      );
      
      // Call the appropriate method
      if (allSelected) {
        collectionSelector.deselectAll();
      } else {
        collectionSelector.selectAll();
      }
      
      // Update UI state based on the new selection
      updatePreview();
    }
  }
  
  /**
   * Handle separate files checkbox change
   */
  function handleSeparateFilesChange() {
    separateFiles = separateFilesCheckbox.checked;
    updatePreview();
  }
  
  /**
   * Handle validate references checkbox change
   */
  function handleValidateReferencesChange() {
    if (validateReferencesCheckbox.checked) {
      referenceValidationResults.style.display = 'block';
      // Run validation immediately when the checkbox is checked
      handleValidateReferences();
    } else {
      referenceValidationResults.style.display = 'none';
    }
  }
  
  /**
   * Handle flat structure checkbox change
   */
  function handleFlatStructureChange() {
    flatStructure = flatStructureCheckbox.checked;
    updatePreview();
  }
  
  /**
   * Handle format radio change
   */
  function handleFormatChange() {
    updatePreview();
  }
  
  /**
   * Handle color format radio change
   */
  function handleColorFormatChange() {
    const selectedColorFormat = getSelectedColorFormat();
    
    // Send message to the plugin to apply color format
    parent.postMessage({
      pluginMessage: {
        type: 'apply-color-format',
        colorFormat: selectedColorFormat
      }
    }, '*');
  }
  
  /**
   * Get the selected format
   */
  function getSelectedFormat(): string {
    let format = 'dtcg';
    formatRadios.forEach(radio => {
      if (radio.checked) {
        format = radio.value;
      }
    });
    return format;
  }
  
  /**
   * Get the selected color format
   */
  function getSelectedColorFormat(): string {
    let colorFormat = 'hex';
    colorFormatRadios.forEach(radio => {
      if (radio.checked) {
        colorFormat = radio.value;
      }
    });
    return colorFormat;
  }
  
  // Collection data for the collection selector
  let collectionData: { name: string, modes: string[] }[] = [];
  let collectionSelector: any = null;
  
  /**
   * Update the collection selector with token data
   */
  function updateCollectionSelector() {
    if (!tokenData) return;
    
    collectionData = [];
    
    // Extract collections and modes from token data
    Object.entries(tokenData).forEach(([collection, modes]: [string, any]) => {
      const modesArray = Object.keys(modes);
      collectionData.push({
        name: collection,
        modes: modesArray
      });
    });
    
    // Set up the collection selector
    collectionSelector = setupCollectionModeSelector({
      containerId: 'collection-modes-list',
      collections: collectionData,
      initialSelectedCollections: selectedCollections,
      initialSelectedModes: selectedModes,
      onChange: (updatedCollections, updatedModes) => {
        selectedCollections = updatedCollections;
        selectedModes = updatedModes;
        updatePreview();
      }
    });
    
    // If no collections are selected, select all by default
    if (selectedCollections.length === 0 && collectionData.length > 0) {
      collectionSelector.selectAll();
    }
  }
  
  /**
   * Process data received from the plugin
   */
  function processReceivedData(data: any) {
    tokenData = data;
    
    // Update the collection selector
    updateCollectionSelector();
    
    // Enable download and validate buttons
    downloadBtn.disabled = false;
    
    // Update the preview
    updatePreview();
    
    showStatus('Tokens extracted successfully', 'success');
    extractBtn.disabled = false;
  }
  
  /**
   * Update the preview based on current selections
   */
  function updatePreview() {
    if (!tokenData) return;
    
    try {
      // Filter tokens by selection
      const filteredTokens = filterTokensBySelection(tokenData, selectedCollections, selectedModes);
      
      // Update the preview tabs
      setupPreviewTabs(
        filteredTokens,
        selectedCollections,
        selectedModes,
        flatStructure,
        separateFiles,
        previewTabsContainer,
        previewContentContainer,
        (data) => visualTokenPreview.update(data)
      );
      
      // Update the visual preview if that tab is active
      if (segmentedToggle.getSelected() === 'visual') {
        visualTokenPreview.update(filteredTokens);
      }
      
      // If validate references is checked, validate references
      if (validateReferencesCheckbox.checked) {
        handleValidateReferences();
      }
    } catch (error) {
      showStatus(`Error updating preview: ${error}`, 'error');
    }
  }
  
  /**
   * Filter tokens by selected collections and modes
   */
  function filterTokensBySelection(
    tokens: any,
    selectedCollections: string[],
    selectedModes: Map<string, string[]>
  ): any {
    const result: any = {};
    
    selectedCollections.forEach(collection => {
      if (!tokens[collection]) return;
      
      result[collection] = {};
      const modesForCollection = selectedModes.get(collection) || [];
      
      modesForCollection.forEach(mode => {
        if (!tokens[collection][mode]) return;
        
        result[collection][mode] = tokens[collection][mode];
      });
    });
    
    return result;
  }
  
  /**
   * Format tokens based on the selected format
   */
  function formatTokens(tokens: any, format: string): any {
    // For now, just return the tokens as is
    // In a real implementation, you would transform to different formats here
    return tokens;
  }
  
  /**
   * Download formatted tokens
   */
  function downloadFormattedTokens(tokens: any, format: string, separateFiles: boolean) {
    if (separateFiles) {
      // Download each collection/mode as a separate file
      Object.entries(tokens).forEach(([collection, modes]: [string, any]) => {
        Object.entries(modes).forEach(([mode, data]: [string, any]) => {
          const filename = `${collection}-${mode}.json`;
          const json = JSON.stringify(data, null, 2);
          downloadJSON(json, filename);
        });
      });
    } else {
      // Download all tokens as a single file
      const filename = 'tokens.json';
      const json = JSON.stringify(tokens, null, 2);
      downloadJSON(json, filename);
    }
  }
  
  /**
   * Download JSON data as a file
   */
  function downloadJSON(json: string, filename: string) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  /**
   * Show status message
   */
  function showStatus(message: string, type: 'info' | 'success' | 'warning' | 'error') {
    statusEl.textContent = message;
    statusEl.className = type;
  }
  
  // Set up message listener
  window.onmessage = (event) => {
    if (!event.data.pluginMessage) return;
    
    const { type, data, message } = event.data.pluginMessage;
    
    if (type === 'tokens-data') {
      processReceivedData(data);
    } else if (type === 'error') {
      showStatus(`Error: ${message}`, 'error');
      extractBtn.disabled = false;
    }
  };
  
  // Initialize
  init();
}

// Run initialization when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeUI);
