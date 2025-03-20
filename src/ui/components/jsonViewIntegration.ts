/**
 * jsonViewIntegration.ts
 * 
 * Integrates the enhanced JSON editor with the main UI
 * Updated to support full variable management functionality
 */

import { createJsonEditor } from './JsonViewer';
import { updateFigmaVariables } from '../utilities/updateFigmaVariables';

// Store the JSON editor instance
let jsonEditor: any = null;

/**
 * Update the JSON editor with new data
 */
export function updateJsonViewer(json: any): void {
  if (jsonEditor) {
    jsonEditor.setJson(json);
  }
}

/**
 * Get the current JSON from the editor
 */
export function getJsonFromViewer(): any {
  if (jsonEditor) {
    return jsonEditor.getJson();
  }
  return null;
}

/**
 * Setup the JSON editor panel with enhanced features
 * Provides full Figma variables editing capability
 */
export function setupJsonEditorPanel(containerId: string, initialJson: any = {}): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return;
  }
  
  // Create JSON editor
  jsonEditor = createJsonEditor({
    containerId,
    initialJson,
    onSave: saveJsonToFigma
  });
  
  // Display helpful intro message
  jsonEditor.showMessage(
    'This editor allows you to edit and add Figma variables. Click the "?" button for help.',
    'info'
  );
}

/**
 * Save the current JSON to Figma variables
 * Enhanced to provide detailed feedback from the server
 */
async function saveJsonToFigma(json: any): Promise<void> {
  if (!jsonEditor) {
    return;
  }
  
  try {
    // Check if the JSON is empty or has no meaningful content
    const isEmpty = Object.keys(json).length === 0 || 
                   !Object.values(json).some(val => typeof val === 'object' && Object.keys(val).length > 0);
    
    if (isEmpty) {
      jsonEditor.showMessage(
        'Cannot save empty JSON data. No variables would be updated.',
        'error'
      );
      return;
    }
    
    // Show saving message
    jsonEditor.showMessage(
      'Saving changes to Figma variables (existing variables outside this view will be preserved)...',
      'pending'
    );
    
    // Update Figma variables
    await updateFigmaVariables(json);
    
    // Show success message
    jsonEditor.showMessage(
      'Variables updated successfully! Refreshing data...',
      'success'
    );
    
    // Request fresh extraction after a delay
    if (window.extractionTimeout) {
      clearTimeout(window.extractionTimeout);
    }
    
    window.extractionTimeout = setTimeout(() => {
      // Request the extraction
      parent.postMessage({ pluginMessage: { type: 'extract-tokens' } }, '*');
      window.extractionTimeout = null;
    }, 1000);
  } catch (error) {
    // Show error message
    jsonEditor.showMessage(
      `Error updating variables: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error'
    );
  }
}

// Handle responses from the plugin
window.addEventListener('message', (event) => {
  const message = event.data.pluginMessage;
  if (!message || !jsonEditor) return;
  
  // Handle variable update results
  if (message.type === 'update-variables-result') {
    if (message.success) {
      // Format the success message with details
      const counts = [];
      if (message.created > 0) counts.push(`created ${message.created} variables`);
      if (message.updated > 0) counts.push(`updated ${message.updated} variables`);
      if (message.collections > 0) counts.push(`created ${message.collections} collections`);
      if (message.modes > 0) counts.push(`created ${message.modes} modes`);
      if (message.renamed > 0) counts.push(`renamed ${message.renamed} items`);
      
      const successDetails = counts.length > 0 
        ? `Success! ${counts.join(', ')}.` 
        : 'Success! No changes needed.';
      
      // Check for warnings
      if (message.warnings && message.warnings.length > 0) {
        jsonEditor.showMessage(
          `${successDetails} With ${message.warnings.length} warning(s).`,
          'warning'
        );
      } else {
        jsonEditor.showMessage(successDetails, 'success');
      }
    } else {
      // Show error message
      jsonEditor.showMessage(
        `Error: ${message.error || 'Unknown error updating variables'}`,
        'error'
      );
    }
  }
});