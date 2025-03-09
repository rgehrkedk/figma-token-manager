import './styles.css';

import './styles.css';

// Import using path aliases
import { 
  formatJson, 
  filterTokens, 
  flattenTokens, 
  getSeparateFiles 
} from '@utilities/formatters';

import {
  downloadJson,
  downloadMultipleFiles
} from '@utilities/export';

import {
  buildCollectionList,
  toggleAllCollections
} from '@components/collections';

import {
  buildModesList,
  toggleAllModes
} from '@components/modes';

import {
  validateReferences,
  showValidationResults
} from '@components/validation';

// Store the extracted tokens and UI state
let tokenData: any = null;
let selectedCollections: string[] = [];
let selectedModes: string[] = [];
let allModes: string[] = [];
let areAllCollectionsSelected = true;
let areAllModesSelected = true;
let referenceProblems: any[] = [];

// Get DOM elements
const outputEl = document.getElementById('output') as HTMLPreElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement;
const validateBtn = document.getElementById('validate-btn') as HTMLButtonElement;
const collectionListEl = document.getElementById('collection-list') as HTMLDivElement;
const modeListEl = document.getElementById('mode-list') as HTMLDivElement;
const toggleAllCollectionsBtn = document.getElementById('toggle-all-collections') as HTMLSpanElement;
const toggleAllModesBtn = document.getElementById('toggle-all-modes') as HTMLSpanElement;
const validateReferencesCheckbox = document.getElementById('validate-references') as HTMLInputElement;
const flatStructureCheckbox = document.getElementById('flat-structure') as HTMLInputElement;
const separateFilesCheckbox = document.getElementById('separate-files') as HTMLInputElement;
const formatDTCGRadio = document.getElementById('format-dtcg') as HTMLInputElement;
const formatLegacyRadio = document.getElementById('format-legacy') as HTMLInputElement;
const referenceValidationResults = document.getElementById('reference-validation-results') as HTMLDivElement;
const validationContent = document.getElementById('validation-content') as HTMLDivElement;

// Function to update preview based on selections
function updatePreview() {
  const filteredData = filterTokens(
    tokenData, 
    selectedCollections, 
    selectedModes, 
    flatStructureCheckbox.checked
  );
  
  outputEl.textContent = formatJson(filteredData);
  downloadBtn.disabled = Object.keys(filteredData).length === 0;
  
  // Validate references if enabled
  if (validateReferencesCheckbox.checked) {
    referenceProblems = validateReferences(filteredData);
    if (referenceProblems.length > 0) {
      statusEl.textContent = `Found ${referenceProblems.length} reference problems. Click "Validate References" for details.`;
      statusEl.className = "warning";
    }
  }
}

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
  console.log("UI loaded and initialized");
  statusEl.textContent = "Extracting tokens...";
  statusEl.className = "info";
  
  // Format option changes
  formatDTCGRadio.addEventListener('change', updatePreview);
  formatLegacyRadio.addEventListener('change', updatePreview);
  validateReferencesCheckbox.addEventListener('change', updatePreview);
  flatStructureCheckbox.addEventListener('change', updatePreview);
  separateFilesCheckbox.addEventListener('change', updatePreview);
  
  // Toggle all collections button
  toggleAllCollectionsBtn.addEventListener('click', () => {
    const result = toggleAllCollections(
      areAllCollectionsSelected,
      collectionListEl,
      tokenData
    );
    
    areAllCollectionsSelected = result.areAllSelected;
    selectedCollections = result.selectedCollections;
    toggleAllCollectionsBtn.textContent = areAllCollectionsSelected ? 'Deselect All' : 'Select All';
    
    updatePreview();
  });
  
  // Toggle all modes button
  toggleAllModesBtn.addEventListener('click', () => {
    const result = toggleAllModes(
      areAllModesSelected,
      modeListEl,
      allModes
    );
    
    areAllModesSelected = result.areAllSelected;
    selectedModes = result.selectedModes;
    toggleAllModesBtn.textContent = areAllModesSelected ? 'Deselect All' : 'Select All';
    
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
    
    collectionListEl.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        Loading collections...
      </div>
    `;
    
    modeListEl.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        Loading modes...
      </div>
    `;
    
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
      
      statusEl.textContent = "Files ready for download. Click the links above to download each file.";
      statusEl.className = "success";
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
      
      statusEl.textContent = "Tokens downloaded successfully!";
      statusEl.className = "success";
    }
  });
});

// Handle messages from the plugin
window.onmessage = (event) => {
  console.log("UI received message:", event.data);
  
  if (event.data.pluginMessage) {
    const msg = event.data.pluginMessage;
    
    if (msg.type === 'tokens-data') {
      console.log("UI received tokens data");
      tokenData = msg.data;
      
      // Initialize collections
      const result = buildCollectionList(tokenData, collectionListEl, updatePreview);
      selectedCollections = result.selectedCollections;
      areAllCollectionsSelected = result.areAllCollectionsSelected;
      
      // Initialize modes
      const modesResult = buildModesList(tokenData, modeListEl, updatePreview);
      selectedModes = modesResult.selectedModes;
      allModes = modesResult.allModes;
      areAllModesSelected = modesResult.areAllModesSelected;
      
      // Set toggle buttons text
      toggleAllCollectionsBtn.textContent = areAllCollectionsSelected ? 'Deselect All' : 'Select All';
      toggleAllModesBtn.textContent = areAllModesSelected ? 'Deselect All' : 'Select All';
      
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