import './styles.css';
import './tab-styles.css';
import './token-preview.css';
import './segmented-toggle.css';
import '../panel-layout.css'; // Import new panel layout styles

// Import utilities
import { 
  formatJson, 
  filterTokens, 
  getSeparateFiles,
  downloadJson, 
  downloadMultipleFiles 
} from './utilities/formatters';

// Import components
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

import {
  analyzeReferenceIssues,
  setupReferenceDiagnosisListeners,
  getReferenceDiagnoserStyles
} from './components/referenceDiagnoser';

import { setupColorFormatHandlers } from './color-handlers';
import { setupPreviewToggle } from './components/previewToggle';

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
let previewToggleInterface: { setMode: (mode: 'json' | 'visual') => void; getCurrentMode: () => 'json' | 'visual' };
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
    const flattenedSelectedModes: string[] = [];
    selectedModes.forEach((modes, collection) => {
      modes.forEach(mode => {
        flattenedSelectedModes.push(mode);
      });
    });
    
    return filterTokens(
      tokenData, 
      selectedCollections, 
      flattenedSelectedModes, 
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
 * Updates the token preview based on current selections and formats
 */
function updatePreview(): void {
  if (!tokenData) return;
  
  // Convert Map to array for compatibility with existing functions
  const flattenedSelectedModes: string[] = [];
  selectedModes.forEach((modes, collection) => {
    modes.forEach(mode => {
      flattenedSelectedModes.push(mode);
    });
  });

  // Generate filtered data based on selections
  const filteredData = filterTokens(
    tokenData, 
    selectedCollections, 
    flattenedSelectedModes, 
    flatStructureCheckbox.checked
  );
  
  // Update the main output display
  outputEl.textContent = formatJson(filteredData);
  
  // Define a function to update the visual preview for a specific tab's data
  const updateVisualPreview = (tabData: any) => {
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
          statusEl.textContent = `Found ${numResolved} resolved and ${numUnresolved} unresolved references. Click "Reference Diagnoser" for details.`;
          statusEl.className = "warning";
        } else if (numResolved > 0) {
          statusEl.textContent = `All ${numResolved} references resolved successfully.`;
          statusEl.className = "success";
        }
      }
    );
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
    referenceProblems = validateReferences(filteredData);
    if (referenceProblems.length > 0) {
      statusEl.textContent = `Found ${referenceProblems.length} reference problems. Click "Validate References" for details.`;
      statusEl.className = "warning";
    } else {
      statusEl.textContent = "All references are valid.";
      statusEl.className = "success";
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
      if (previewToggleInterface.getCurrentMode() === 'visual') {
        const currentTabData = getCurrentTabData('combined');
        const existingPreview = visualPreviewContainer.querySelector('.token-preview-wrapper');
        if (existingPreview) {
          existingPreview.remove();
        }
        showEnhancedVisualTokenPreview(currentTabData, visualPreviewContainer, currentColorFormat);
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
      // If outputEl doesn't have a parent, it might not be in the DOM yet
      combinedContent.appendChild(outputEl);
    } else {
      // Clone the output element to avoid moving it
      const outputClone = outputEl.cloneNode(true);
      combinedContent.appendChild(outputClone);
    }
    
    previewContentContainer.appendChild(combinedContent);
  }
}

/**
 * Initialize the UI
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("UI loaded and initialized");
  statusEl.textContent = "Extracting tokens...";
  statusEl.className = "info";
  
  // Setup color format handlers
  setupColorFormatHandlers();
  
  // Setup preview toggle
  previewToggleInterface = setupPreviewToggle();

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
          Array.from(selectedModes.values()).flat(), 
          flatStructureCheckbox.checked
        ) : 
        getCurrentTabData(currentTabId);
      
      // Add reference diagnosis section
      const diagnosisElement = document.createElement('div');
      diagnosisElement.id = 'reference-diagnosis-container';
      validationContent.appendChild(diagnosisElement);
      
      // Analyze and display reference issues
      const diagnosis = analyzeReferenceIssues(currentTabData, diagnosisElement);
      
      // Setup listeners for the diagnosis UI components
      setupReferenceDiagnosisListeners(diagnosisElement, currentTabData, (fixedTokenData) => {
        // Apply fixes to the main token data
        // This is a simplified approach - in a real app, you'd need to merge
        // the fixed tokens back into the complete structure
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
        statusEl.textContent = "References fixed successfully!";
        statusEl.className = "success";
        
        // Re-analyze to show progress
        analyzeReferenceIssues(
          filterTokens(
            tokenData, 
            selectedCollections, 
            Array.from(selectedModes.values()).flat(), 
            flatStructureCheckbox.checked
          ), 
          diagnosisElement
        );
      });
    }
  });
  
  // Extract button handler
  extractBtn.addEventListener('click', () => {
    referenceValidationResults.style.display = 'none';
    outputEl.textContent = "Loading data...";
    statusEl.textContent = "Extracting tokens...";
    statusEl.className = "info";
    
    collectionModesListEl.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        Loading collections and modes...
      </div>
    `;
    
    downloadBtn.disabled = true;
    
    // Request token extraction
    parent.postMessage({ pluginMessage: { type: 'extract-tokens' } }, '*');
  });
  
  // Download button handler
  downloadBtn.addEventListener('click', () => {
    const flattenedSelectedModes: string[] = [];
    selectedModes.forEach((modes, collection) => {
      modes.forEach(mode => {
        flattenedSelectedModes.push(mode);
      });
    });
    
    if (separateFilesCheckbox.checked) {
      // Generate separate files
      const files = getSeparateFiles(
        tokenData, 
        selectedCollections, 
        flattenedSelectedModes, 
        flatStructureCheckbox.checked
      );
      
      downloadMultipleFiles(files, validationContent, referenceValidationResults);
      
      statusEl.textContent = "Files ready for download. Click the links above to download each file.";
      statusEl.className = "success";
    } else {
      // Single file download
      const filteredData = filterTokens(
        tokenData, 
        selectedCollections, 
        flattenedSelectedModes, 
        flatStructureCheckbox.checked
      );
      
      const format = formatDTCGRadio.checked ? 'dtcg' : 'legacy';
      const fileName = `design-tokens-${format}-${new Date().toISOString().split('T')[0]}.json`;
      
      downloadJson(filteredData, fileName);
      
      statusEl.textContent = "Tokens downloaded successfully!";
      statusEl.className = "success";
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
        Array.from(selectedModes.values()).flat(), 
        flatStructureCheckbox.checked
      ) : 
      getCurrentTabData(currentTabId);
      
    // Analyze and display reference issues
    const diagnosis = analyzeReferenceIssues(currentTabData, diagnosisContainer);
    
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
      statusEl.textContent = "References fixed successfully!";
      statusEl.className = "success";
      
      // Re-analyze to show progress
      analyzeReferenceIssues(
        filterTokens(
          tokenData, 
          selectedCollections, 
          Array.from(selectedModes.values()).flat(), 
          flatStructureCheckbox.checked
        ), 
        diagnosisContainer
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
      
      statusEl.textContent = "Tokens extracted successfully!";
      statusEl.className = "success";
    } else if (msg.type === 'error') {
      console.error("UI received error:", msg.message);
      outputEl.textContent = "Error: " + msg.message;
      statusEl.textContent = msg.message;
      statusEl.className = "error";
    }
  }
};

// Let the plugin know the UI is ready
console.log("UI sending ready message to plugin");
parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');