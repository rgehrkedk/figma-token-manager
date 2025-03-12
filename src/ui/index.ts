import './styles/index.css';

// Import utilities
import { 
  formatJson, 
  filterTokens, 
  getSeparateFiles,
  downloadJson, 
  downloadMultipleFiles 
} from './utilities/formatters';
import { createModesMap } from './utilities/helpers';

// Import existing components
import { 
  buildCollectionModesList,
  toggleAllCollectionsAndModes
} from './components/collectionModes';

import {
  setupPreviewTabs,
  setActiveTab
} from './components/previewTabs';

import {
  validateReferences,
  showValidationResults
} from './components/validation';

// Import enhanced components
import {
  showEnhancedVisualTokenPreview
} from './components/tokenPreview';

// Import reference diagnoser components
import {
  analyzeReferenceIssues,
  analyzeReferenceIssuesWithMap,
  setupReferenceDiagnosisListeners,
  getReferenceDiagnoserStyles
} from './components/referenceDiagnoser';

// Import color handlers
import { setupColorFormatHandlers } from './color-handlers';

// Import NEW components that need to be integrated
import { 
  setupPreviewToggle 
} from './components/previewToggle';

import {
  setupSegmentedToggle
} from './components/segmentedToggle';

import {
  updateStatus,
  StatusType,
  showExtractionStatus,
  showExtractionSuccess,
  showDownloadSuccess
} from './components/statusIndicator';

import {
  renderCollectionList,
  showCollectionLoading,
  showCollectionError
} from './components/collectionList';

import {
  prettifyJson,
  updateJsonPreview,
  toggleJsonPreview
} from './components/jsonPreview';

import {
  setupVisualTokenPreview
} from './components/visualTokenPreview';

// Import color transforms
import { ColorFormat } from '../code/formatters/colorTransforms';

// Store the extracted tokens and UI state
let tokenData: any = null;
let originalTokenData: any = null; // Preserve original data before transformations
let selectedCollections: string[] = [];
let selectedModes: Map<string, string[]> = new Map();
let allCollections: string[] = [];
let areAllSelected: boolean = true;
let referenceProblems: any[] = [];
let currentColorFormat: ColorFormat = 'hex'; // Default color format
let previewToggleInterface: { 
  setMode: (mode: 'json' | 'visual') => void; 
  getCurrentMode: () => 'json' | 'visual' 
};
let visualTokenPreviewInterface: {
  update: (data: any) => void;
  clear: () => void;
};
let referenceDiagnosticsData = { resolved: 0, unresolved: 0 };

// Get DOM elements
const outputEl = document.getElementById('output') as HTMLPreElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement;
const validateBtn = document.getElementById('validate-btn') as HTMLButtonElement;
const collectionModesListEl = document.getElementById('collection-modes-list') as HTMLDivElement;
const toggleAllBtn = document.getElementById('toggle-all-collections') as HTMLSpanElement;
const validateReferencesCheckbox = document.getElementById('validate-references') as HTMLInputElement;
const flatStructureCheckbox = document.getElementById('flat-structure') as HTMLInputElement;
const separateFilesCheckbox = document.getElementById('separate-files') as HTMLInputElement;
const formatDTCGRadio = document.getElementById('format-dtcg') as HTMLInputElement;
const formatLegacyRadio = document.getElementById('format-legacy') as HTMLInputElement;
const referenceValidationResults = document.getElementById('reference-validation-results') as HTMLDivElement;
const validationContent = document.getElementById('validation-content') as HTMLDivElement;
const previewTabsContainer = document.getElementById('preview-tabs') as HTMLDivElement;
const previewContentContainer = document.querySelector('.preview-content') as HTMLDivElement;
const visualPreviewContainer = document.getElementById('visual-preview-container') as HTMLDivElement;
const previewModeToggleContainer = document.getElementById('preview-mode-toggle') as HTMLDivElement;
const previewContentJsonContainer = document.querySelector('.preview-content-json') as HTMLElement;

// Add reference diagnoser styles
const styleElement = document.createElement('style');
styleElement.textContent = getReferenceDiagnoserStyles();
document.head.appendChild(styleElement);

/**
 * Helper function to get data for a specific tab
 */
function getCurrentTabData(tabId: string): any {
  // If it's the combined tab, return all selected data
  if (tabId === 'combined') {
    return filterTokens(
      tokenData, 
      selectedCollections, 
      selectedModes, // Use the Map directly
      flatStructureCheckbox.checked
    );
  }
  
  // Otherwise, extract the collection and mode from the tab ID
  const [collection, mode] = tabId.split('-');
  if (collection && mode && tokenData[collection] && tokenData[collection][mode]) {
    return { [collection]: { [mode]: tokenData[collection][mode] } };
  }
  
  return {};
}

/**
 * Converts a Map<string, string[]> to a flat string array of all modes
 */
function flattenModesMap(modesMap: Map<string, string[]>): string[] {
  return Array.from(modesMap.values()).flat();
}

/**
 * Updates the token preview based on current selections and formats
 */
function updatePreview(): void {
  if (!tokenData) return;
  
  // Generate filtered data based on selections
  const filteredData = filterTokens(
    tokenData, 
    selectedCollections, 
    selectedModes, 
    flatStructureCheckbox.checked
  );
  
  // Update the main output display using the jsonPreview component
  updateJsonPreview(outputEl, filteredData);
  
  // Define a function to update the visual preview for a specific tab's data
  const updateVisualPreview = (tabData: any) => {
    // Update the visual preview with the integrated component
    if (visualTokenPreviewInterface) {
      visualTokenPreviewInterface.update(tabData);
    } else {
      // Fallback to the legacy implementation
      // Remove any existing preview before creating a new one
      const existingPreview = visualPreviewContainer.querySelector('.token-preview-wrapper');
      if (existingPreview) {
        existingPreview.remove();
      }
      
      // Create new visual preview with reference resolution diagnostics
      showEnhancedVisualTokenPreview(
        tabData, 
        visualPreviewContainer, 
        currentColorFormat,
        (numResolved, numUnresolved) => {
          // Store diagnostics data for possible use
          referenceDiagnosticsData = {
            resolved: numResolved,
            unresolved: numUnresolved
          };
          
          // Update status with reference information
          if (numUnresolved > 0) {
            updateStatus(
              statusEl, 
              `Found ${numResolved} resolved and ${numUnresolved} unresolved references. Click "Reference Diagnoser" for details.`,
              StatusType.WARNING
            );
          } else if (numResolved > 0) {
            updateStatus(
              statusEl, 
              `All ${numResolved} references resolved successfully.`,
              StatusType.SUCCESS
            );
          }
        }
      );
    }
  };
  
  // Update the tabbed preview with the function to update visual preview
  setupPreviewTabs(
    tokenData,
    selectedCollections,
    selectedModes,
    flatStructureCheckbox.checked,
    separateFilesCheckbox.checked,
    previewTabsContainer,
    previewContentContainer,
    updateVisualPreview // Pass the update function
  );
  
  // Also update the visual preview for the current tab's data
  const currentTabId = document.querySelector('.tab-button.active')?.getAttribute('data-tab') || 'combined';
  const currentTabData = currentTabId === 'combined' ? filteredData : getCurrentTabData(currentTabId);
  updateVisualPreview(currentTabData);

  // Enable/disable download button based on selection
  downloadBtn.disabled = Object.keys(filteredData).length === 0;
  
  // Validate references if enabled
  if (validateReferencesCheckbox.checked) {
    // First get all modes as a flattened array for compatibility with validateReferences
    const allModes = flattenModesMap(selectedModes);
    referenceProblems = validateReferences(filteredData);
    if (referenceProblems.length > 0) {
      updateStatus(
        statusEl,
        `Found ${referenceProblems.length} reference problems. Click "Validate References" for details.`,
        StatusType.WARNING
      );
    } else {
      updateStatus(
        statusEl,
        "All references are valid.",
        StatusType.SUCCESS
      );
    }
  }
}

/**
 * Ensure the Combined tab exists and has the proper event handler
 */
function ensureCombinedTabExists() {
  const combinedTabExists = previewTabsContainer.querySelector('.tab-button[data-tab="combined"]');
  if (!combinedTabExists) {
    const combinedTab = document.createElement('button');
    combinedTab.className = 'tab-button active';
    combinedTab.dataset.tab = 'combined';
    combinedTab.textContent = 'Combined';
    combinedTab.addEventListener('click', (e) => {
      e.preventDefault();
      setActiveTab('combined', previewTabsContainer, previewContentContainer);
      
      // Also update visual preview
      if (previewToggleInterface && previewToggleInterface.getCurrentMode() === 'visual') {
        const currentTabData = getCurrentTabData('combined');
        updateVisualPreview(currentTabData);
      }
    });
    previewTabsContainer.appendChild(combinedTab);
  }
  
  // Make sure the combined tab content element exists
  const combinedContentExists = document.getElementById('tab-combined');
  if (!combinedContentExists) {
    const combinedContent = document.createElement('div');
    combinedContent.className = 'tab-content';
    combinedContent.id = 'tab-combined';
    combinedContent.style.display = 'block';
    
    if (!outputEl.parentNode) {
      combinedContent.appendChild(outputEl);
    } else {
      const outputClone = outputEl.cloneNode(true);
      combinedContent.appendChild(outputClone);
    }
    
    previewContentContainer.appendChild(combinedContent);
  }
}

/**
 * Helper function to update visual preview
 */
function updateVisualPreview(data: any): void {
  if (visualTokenPreviewInterface) {
    visualTokenPreviewInterface.update(data);
  } else {
    // Fallback to legacy implementation
    const existingPreview = visualPreviewContainer.querySelector('.token-preview-wrapper');
    if (existingPreview) {
      existingPreview.remove();
    }
    
    showEnhancedVisualTokenPreview(data, visualPreviewContainer, currentColorFormat);
  }
}

/**
 * Initialize the UI
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("UI loaded and initialized");
  updateStatus(statusEl, "Extracting tokens...", StatusType.INFO);
  
  // Setup color format handlers
  setupColorFormatHandlers();
  
  // Setup preview toggle using the dedicated component
  previewToggleInterface = setupPreviewToggle();

  // Setup visual token preview using the component
  visualTokenPreviewInterface = setupVisualTokenPreview({
    containerId: 'visual-preview-container',
    onTokenClick: (tokenPath, tokenValue) => {
      console.log(`Token clicked: ${tokenPath}`, tokenValue);
      // You can implement a detail panel to show when a token is clicked
    }
  });

  // Setup segmented toggle for preview mode if not already handled by previewToggle
  if (previewModeToggleContainer && !previewToggleInterface) {
    setupSegmentedToggle({
      containerId: 'preview-mode-toggle',
      options: [
        { id: 'json', label: 'JSON' },
        { id: 'visual', label: 'Visual' }
      ],
      initialSelection: 'json',
      onChange: (selectedId) => {
        if (selectedId === 'json') {
          previewContentJsonContainer.classList.add('active');
          visualPreviewContainer.classList.remove('active');
        } else {
          previewContentJsonContainer.classList.remove('active');
          visualPreviewContainer.classList.add('active');
          
          // Update visual preview with current tab data
          const currentTabId = document.querySelector('.tab-button.active')?.getAttribute('data-tab') || 'combined';
          const currentTabData = getCurrentTabData(currentTabId);
          updateVisualPreview(currentTabData);
        }
      }
    });
  }
  
  // Ensure "Combined" tab exists
  ensureCombinedTabExists();
  
  // Add event listeners for format options
  formatDTCGRadio.addEventListener('change', updatePreview);
  formatLegacyRadio.addEventListener('change', updatePreview);
  validateReferencesCheckbox.addEventListener('change', updatePreview);
  flatStructureCheckbox.addEventListener('change', updatePreview);
  separateFilesCheckbox.addEventListener('change', updatePreview);
  
  // Toggle all collections and modes
  toggleAllBtn.addEventListener('click', () => {
    const result = toggleAllCollectionsAndModes(
      !areAllSelected,
      collectionModesListEl,
      tokenData
    );
    
    selectedCollections = result.selectedCollections;
    selectedModes = result.selectedModes;
    allCollections = result.allCollections;
    areAllSelected = !areAllSelected;
    
    toggleAllBtn.textContent = areAllSelected ? 'Deselect All' : 'Select All';
    
    updatePreview();
  });
  
  // Enhance validate button to add reference diagnostics
  validateBtn.addEventListener('click', () => {
    // First show standard validation results
    showValidationResults(referenceProblems, validationContent, referenceValidationResults);
    
    // Then augment with detailed reference diagnostics
    if (tokenData) {
      // Get the current tab data
      const currentTabId = document.querySelector('.tab-button.active')?.getAttribute('data-tab') || 'combined';
      const currentTabData = currentTabId === 'combined' ? 
        filterTokens(
          tokenData, 
          selectedCollections, 
          selectedModes, 
          flatStructureCheckbox.checked
        ) : 
        getCurrentTabData(currentTabId);
      
      // Add reference diagnosis section
      const diagnosisElement = document.createElement('div');
      diagnosisElement.id = 'reference-diagnosis-container';
      validationContent.appendChild(diagnosisElement);
      
      // Analyze and display reference issues using the improved component function
      const diagnosis = analyzeReferenceIssuesWithMap(currentTabData, diagnosisElement, selectedModes);
      
      // Setup listeners for the diagnosis UI components
      setupReferenceDiagnosisListeners(diagnosisElement, currentTabData, (fixedTokenData) => {
        // Apply fixes to the main token data
        if (currentTabId === 'combined') {
          tokenData = fixedTokenData;
        } else {
          const [collection, mode] = currentTabId.split('-');
          if (collection && mode && fixedTokenData[collection]?.[mode]) {
            tokenData[collection][mode] = fixedTokenData[collection][mode];
          }
        }
        
        // Update the display
        updatePreview();
        
        // Show success message
        updateStatus(statusEl, "References fixed successfully!", StatusType.SUCCESS);
        
        // Re-analyze to show progress
        analyzeReferenceIssuesWithMap(
          currentTabData, 
          diagnosisElement,
          selectedModes
        );
      });
    }
  });
  
  // Extract button handler
  extractBtn.addEventListener('click', () => {
    referenceValidationResults.style.display = 'none';
    outputEl.textContent = "Loading data...";
    
    // Use the statusIndicator component 
    showExtractionStatus(statusEl);
    
    // Use the collectionList component to show loading state
    showCollectionLoading(collectionModesListEl);
    
    downloadBtn.disabled = true;
    
    // Request token extraction
    parent.postMessage({ pluginMessage: { type: 'extract-tokens' } }, '*');
  });
  
  // Download button handler
  downloadBtn.addEventListener('click', () => {
    if (separateFilesCheckbox.checked) {
      // Generate separate files
      const files = getSeparateFiles(
        tokenData, 
        selectedCollections, 
        selectedModes,
        flatStructureCheckbox.checked
      );
      
      downloadMultipleFiles(files, validationContent, referenceValidationResults);
      
      updateStatus(
        statusEl, 
        "Files ready for download. Click the links above to download each file.", 
        StatusType.SUCCESS
      );
    } else {
      // Single file download
      const filteredData = filterTokens(
        tokenData, 
        selectedCollections, 
        selectedModes,
        flatStructureCheckbox.checked
      );
      
      const format = formatDTCGRadio.checked ? 'dtcg' : 'legacy';
      const fileName = `design-tokens-${format}-${new Date().toISOString().split('T')[0]}.json`;
      
      downloadJson(filteredData, fileName);
      
      // Use the statusIndicator component
      showDownloadSuccess(statusEl);
    }
  });
  
  // Add a "Reference Diagnoser" button next to Validate References
  const referenceBtn = document.createElement('button');
  referenceBtn.id = 'diagnose-references-btn';
  referenceBtn.textContent = 'Reference Diagnoser';
  referenceBtn.addEventListener('click', () => {
    // Show validation panel
    referenceValidationResults.style.display = 'block';
    
    // Set content and title
    validationContent.innerHTML = '<h3>Reference Diagnosis</h3>';
    const diagnosisContainer = document.createElement('div');
    diagnosisContainer.id = 'reference-diagnosis-container';
    validationContent.appendChild(diagnosisContainer);
    
    // Get the current tab data
    const currentTabId = document.querySelector('.tab-button.active')?.getAttribute('data-tab') || 'combined';
    const currentTabData = currentTabId === 'combined' ? 
      filterTokens(
        tokenData, 
        selectedCollections, 
        selectedModes, 
        flatStructureCheckbox.checked
      ) : 
      getCurrentTabData(currentTabId);
      
    // Analyze and display reference issues
    const diagnosis = analyzeReferenceIssuesWithMap(currentTabData, diagnosisContainer, selectedModes);
    
    // Setup listeners for fixes
    setupReferenceDiagnosisListeners(diagnosisContainer, currentTabData, (fixedTokenData) => {
      // Apply fixes to the main token data
      if (currentTabId === 'combined') {
        tokenData = fixedTokenData;
      } else {
        const [collection, mode] = currentTabId.split('-');
        if (collection && mode && fixedTokenData[collection]?.[mode]) {
          tokenData[collection][mode] = fixedTokenData[collection][mode];
        }
      }
      
      // Update the display
      updatePreview();
      
      // Show success message
      updateStatus(statusEl, "References fixed successfully!", StatusType.SUCCESS);
      
      // Re-analyze to show progress
      analyzeReferenceIssuesWithMap(
        currentTabData, 
        diagnosisContainer,
        selectedModes
      );
    });
  });
  
  // Add the button after the validate button
  validateBtn.parentNode?.insertBefore(referenceBtn, validateBtn.nextSibling);
});

/**
 * Handle messages from the plugin
 */
window.onmessage = (event) => {
  console.log("UI received message:", event.data);
  
  if (event.data.pluginMessage) {
    const msg = event.data.pluginMessage;
    
    if (msg.type === 'tokens-data') {
      console.log("UI received tokens data");
      originalTokenData = JSON.parse(JSON.stringify(msg.data)); // Store original
      tokenData = msg.data;
      
      // Initialize collections and modes with hierarchical UI
      const result = buildCollectionModesList(tokenData, collectionModesListEl, updatePreview);
      selectedCollections = result.selectedCollections;
      selectedModes = result.selectedModes;
      allCollections = result.allCollections;
      areAllSelected = true;
      
      // Set toggle button text
      toggleAllBtn.textContent = areAllSelected ? 'Deselect All' : 'Select All';
      
      // Update the preview
      updatePreview();
      
      // Use statusIndicator component to show success
      showExtractionSuccess(statusEl, Object.keys(tokenData).length);
    } else if (msg.type === 'error') {
      console.error("UI received error:", msg.message);
      outputEl.textContent = "Error: " + msg.message;
      
      // Use statusIndicator component to show error
      updateStatus(statusEl, msg.message, StatusType.ERROR);
      
      // Use collectionList component to show error state
      showCollectionError(collectionModesListEl);
    }
  }
};

// Let the plugin know the UI is ready
console.log("UI sending ready message to plugin");
parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');