import './styles.css';
import './styles-color-preview.css';
import './tab-styles.css'; // Add tab style import

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

import {
  extractColorTokens,
  generateColorPreviewPanel,
  setupColorPreviewInteractions
} from './components/colorPreview';

// Import color transforms
import { 
  formatAllColors,
  ColorFormat
} from '../code/formatters/colorTransforms';

// Store the extracted tokens and UI state
let tokenData: any = null;
let originalTokenData: any = null; // Preserve original data before transformations
let selectedCollections: string[] = [];
let selectedModes: Map<string, string[]> = new Map();
let allCollections: string[] = [];
let areAllSelected: boolean = true;
let referenceProblems: any[] = [];
let currentColorFormat: ColorFormat = 'hex'; // Default color format
let colorPreviewEnabled: boolean = false; // Track if color preview is enabled

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
const previewColorsCheckbox = document.getElementById('preview-colors') as HTMLInputElement;

// Color format options
const colorHexRadio = document.getElementById('color-hex') as HTMLInputElement;
const colorRgbRadio = document.getElementById('color-rgb') as HTMLInputElement;
const colorRgbaRadio = document.getElementById('color-rgba') as HTMLInputElement;
const colorHslRadio = document.getElementById('color-hsl') as HTMLInputElement;
const colorHslaRadio = document.getElementById('color-hsla') as HTMLInputElement;

// Create a color preview container
const colorPreviewContainer = document.createElement('div');
colorPreviewContainer.id = 'color-preview-container';

/**
 * Updates the token preview based on current selections and formats
 */
function updatePreview(): void {
  if (!tokenData || !originalTokenData) return;
  
  // Start with original data to avoid compounding transformations
  let processedTokenData = JSON.parse(JSON.stringify(originalTokenData));
  
  // Apply color transformations if needed
  processedTokenData = formatAllColors(processedTokenData, currentColorFormat);
  
  // Update the working copy of tokenData
  tokenData = processedTokenData;
  
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
  
  // Update the tabbed preview with our fixed function
  setupPreviewTabs(
    tokenData,
    selectedCollections,
    selectedModes,
    flatStructureCheckbox.checked,
    separateFilesCheckbox.checked,
    previewTabsContainer,
    previewContentContainer
  );
  
  // Handle color preview if enabled
  if (colorPreviewEnabled) {
    showColorPreview(filteredData);
  } else {
    // Remove color preview if present
    const existingPreview = document.querySelector('.color-preview-container');
    if (existingPreview) {
      existingPreview.remove();
    }
  }
  
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
 * Shows color preview panel
 */
function showColorPreview(filteredData: any): void {
  // Extract color tokens
  const colorTokens = extractColorTokens(filteredData);
  
  // Remove existing preview if present
  const existingPreview = document.querySelector('.color-preview-container');
  if (existingPreview) {
    existingPreview.remove();
  }
  
  // Generate and add preview panel
  const previewHtml = generateColorPreviewPanel(colorTokens, currentColorFormat);
  const previewContainer = document.createElement('div');
  previewContainer.className = 'color-preview-wrapper';
  previewContainer.innerHTML = previewHtml;
  
  // Add after the main preview
  previewContentContainer.parentNode?.insertBefore(
    previewContainer, 
    previewContentContainer.nextSibling
  );
  
  // Setup interactive features
  setupColorPreviewInteractions(
    previewContainer, 
    currentColorFormat, 
    (format: ColorFormat) => {
      currentColorFormat = format;
      
      // Update radio buttons
      updateColorFormatRadios();
      
      // Update the preview
      updatePreview();
    }
  );
}

/**
 * Updates color format radio buttons based on current selection
 */
function updateColorFormatRadios(): void {
  colorHexRadio.checked = currentColorFormat === 'hex';
  colorRgbRadio.checked = currentColorFormat === 'rgb';
  colorRgbaRadio.checked = currentColorFormat === 'rgba';
  colorHslRadio.checked = currentColorFormat === 'hsl';
  colorHslaRadio.checked = currentColorFormat === 'hsla';
}

/**
 * Initialize the UI
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("UI loaded and initialized");
  statusEl.textContent = "Extracting tokens...";
  statusEl.className = "info";
  
  // Ensure the "Combined" tab button exists and has the proper attributes
  const combinedTabExists = previewTabsContainer.querySelector('.tab-button[data-tab="combined"]');
  if (!combinedTabExists) {
    const combinedTab = document.createElement('button');
    combinedTab.className = 'tab-button active';
    combinedTab.dataset.tab = 'combined';
    combinedTab.textContent = 'Combined';
    combinedTab.addEventListener('click', (e) => {
      e.preventDefault();
      setActiveTab('combined', previewTabsContainer, previewContentContainer);
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
  
  // Add event listeners for format options
  formatDTCGRadio.addEventListener('change', updatePreview);
  formatLegacyRadio.addEventListener('change', updatePreview);
  validateReferencesCheckbox.addEventListener('change', updatePreview);
  flatStructureCheckbox.addEventListener('change', updatePreview);
  
  // Tab preview update when separate files option changes
  separateFilesCheckbox.addEventListener('change', () => {
    updatePreview();
  });
  
  // Color format listeners
  colorHexRadio.addEventListener('change', () => {
    if (colorHexRadio.checked) {
      currentColorFormat = 'hex';
      updatePreview();
    }
  });
  
  colorRgbRadio.addEventListener('change', () => {
    if (colorRgbRadio.checked) {
      currentColorFormat = 'rgb';
      updatePreview();
    }
  });
  
  colorRgbaRadio.addEventListener('change', () => {
    if (colorRgbaRadio.checked) {
      currentColorFormat = 'rgba';
      updatePreview();
    }
  });
  
  colorHslRadio.addEventListener('change', () => {
    if (colorHslRadio.checked) {
      currentColorFormat = 'hsl';
      updatePreview();
    }
  });
  
  colorHslaRadio.addEventListener('change', () => {
    if (colorHslaRadio.checked) {
      currentColorFormat = 'hsla';
      updatePreview();
    }
  });
  
  // Color preview toggle
  previewColorsCheckbox.addEventListener('change', () => {
    colorPreviewEnabled = previewColorsCheckbox.checked;
    updatePreview();
  });
  
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
  
  // Validate references button
  validateBtn.addEventListener('click', () => {
    showValidationResults(referenceProblems, validationContent, referenceValidationResults);
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