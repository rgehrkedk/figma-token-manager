/**
 * jsonViewIntegration.ts
 * 
 * Integrates the JSON viewer/editor with the rest of the plugin
 */

import { updateFigmaVariables } from '../utilities/updateFigmaVariables';
import { JsonEditor } from '../utilities/jsonEditor';

// Track the JSON editor instance
let jsonEditor: JsonEditor | null = null;

/**
 * Set up the JSON editor panel
 * @param containerId The ID of the container element
 * @param initialData The initial JSON data to display
 */
export function setupJsonEditorPanel(containerId: string, initialData: any): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`JSON editor container not found: ${containerId}`);
    return;
  }
  
  try {
    // Clear the container first
    container.innerHTML = '';
    
    // Create the toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'json-editor-toolbar';
    
    // Create save button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save to Figma';
    saveButton.className = 'json-editor-save';
    saveButton.addEventListener('click', () => {
      if (jsonEditor) {
        const currentJson = jsonEditor.getJson();
        saveJsonToFigma(currentJson);
      }
    });
    
    // Create format button
    const formatButton = document.createElement('button');
    formatButton.textContent = 'Format';
    formatButton.className = 'json-editor-format';
    formatButton.addEventListener('click', () => {
      if (jsonEditor) jsonEditor.format();
    });
    
    // Create message area
    const messageArea = document.createElement('div');
    messageArea.className = 'json-editor-message';
    
    // Add buttons to toolbar
    toolbar.appendChild(saveButton);
    toolbar.appendChild(formatButton);
    
    // Create the editor container
    const editorContainer = document.createElement('div');
    editorContainer.className = 'json-editor-container';
    
    // Add elements to main container
    container.appendChild(toolbar);
    container.appendChild(messageArea);
    container.appendChild(editorContainer);
    
    // Create the JSON editor
    jsonEditor = new JsonEditor(editorContainer, initialData);
  } catch (error) {
    console.error('Error setting up JSON editor panel:', error);
    
    // Show a fallback message
    if (container) {
      container.innerHTML = '<div class="error-message">Error initializing JSON editor. Please try reloading the plugin.</div>';
    }
  }
  
  // Display helpful intro message
  jsonEditor.showMessage(
    'This editor allows you to edit, add, and delete Figma variables. Click the "?" button for help.',
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
    // Create a deep copy of the JSON to avoid modifying the original
    const jsonCopy = JSON.parse(JSON.stringify(json));
    
    // Check if the JSON is empty or has no meaningful content
    const isEmpty = Object.keys(jsonCopy).length === 0 || 
                   !Object.values(jsonCopy).some(val => typeof val === 'object' && Object.keys(val).length > 0);
    
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
    await updateFigmaVariables(jsonCopy);
    
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

/**
 * Update the JSON viewer with new data
 * @param data The JSON data to display
 */
export function updateJsonViewer(data: any): void {
  if (jsonEditor) {
    jsonEditor.updateJson(data);
  } else {
    console.warn('Cannot update JSON viewer: editor not initialized');
  }
}

/**
 * Get the current JSON from the viewer
 * @returns The current JSON data
 */
export function getJsonFromViewer(): any {
  if (jsonEditor) {
    return jsonEditor.getJson();
  }
  return null;
}

// Export for use in other modules
export { saveJsonToFigma };