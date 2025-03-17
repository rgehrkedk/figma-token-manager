/**
 * jsonViewIntegration.ts
 * 
 * Integrates the enhanced JSON viewer with the main UI
 * Updated to use the editable implementation with line numbers
 * and improved validation feedback
 */

import { createJsonViewer, JsonViewerInterface } from './JsonViewer';
import { updateFigmaVariables } from '../utilities/updateFigmaVariables';

// Store the JSON viewer instance
let jsonViewer: JsonViewerInterface | null = null;

/**
 * Initialize the JSON viewer in the specified container
 */
export function initJsonViewer(
  containerId: string, 
  initialJson: any = {}, 
  editable: boolean = false
): JsonViewerInterface {
  // Create JSON viewer
  jsonViewer = createJsonViewer({
    containerId,
    initialJson,
    editable,
    lineNumbers: true,
    maxHeight: '650px',
    onChange: handleJsonChange
  });
  
  return jsonViewer;
}

/**
 * Handle changes to the JSON content
 */
function handleJsonChange(jsonContent: string): void {
  try {
    // Parse JSON to validate
    JSON.parse(jsonContent);
    
    // Enable save button if valid
    const saveButton = document.querySelector('.json-save-btn') as HTMLButtonElement;
    if (saveButton) {
      saveButton.disabled = false;
    }
  } catch (error) {
    // Disable save button if invalid
    const saveButton = document.querySelector('.json-save-btn') as HTMLButtonElement;
    if (saveButton) {
      saveButton.disabled = true;
    }
  }
}

/**
 * Update the JSON viewer with new data
 */
export function updateJsonViewer(json: any): void {
  if (jsonViewer) {
    jsonViewer.setJson(json);
  }
}

/**
 * Get the current JSON from the viewer
 */
export function getJsonFromViewer(): any {
  if (jsonViewer) {
    return jsonViewer.getJson();
  }
  return null;
}

/**
 * Setup the JSON editor panel with action buttons
 * Updated to provide visual feedback during validation
 */
export function setupJsonEditorPanel(containerId: string, initialJson: any = {}): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return;
  }
  
  // Create editor panel UI
  container.innerHTML = `
    <div class="json-editor-container">
      <div class="json-editor-header">
        <div class="json-status">
          <span class="status-indicator valid">Valid JSON</span>
        </div>
        <div class="json-editor-actions">
          <button class="json-validate-btn">Validate</button>
          <button class="json-save-btn">Save to Figma</button>
        </div>
      </div>
      <div class="json-viewer-container" id="json-viewer-content"></div>
      <div class="json-editor-footer">
        <div class="json-editor-message success">JSON is valid and ready to be saved.</div>
      </div>
    </div>
  `;
  
  // Initialize JSON viewer
  const jsonViewer = initJsonViewer('json-viewer-content', initialJson, true);
  
  // Add event listeners
  const validateBtn = container.querySelector('.json-validate-btn') as HTMLButtonElement;
  const saveBtn = container.querySelector('.json-save-btn') as HTMLButtonElement;
  const statusIndicator = container.querySelector('.status-indicator') as HTMLElement;
  const messageArea = container.querySelector('.json-editor-message') as HTMLElement;
  const editorContainer = container.querySelector('.json-editor-container') as HTMLElement;
  
  if (validateBtn) {
    validateBtn.addEventListener('click', () => {
      // Add validating class for visual effect
      editorContainer.classList.add('validating');
      validateBtn.disabled = true;
      
      // Use setTimeout to allow the UI to update before validation
      setTimeout(() => {
        const isValid = validateJson(statusIndicator, messageArea);
        
        // Update save button state based on validation
        if (saveBtn) {
          saveBtn.disabled = !isValid;
        }
        
        // Remove validating class
        editorContainer.classList.remove('validating');
        validateBtn.disabled = false;
      }, 300);
    });
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveJsonToFigma(messageArea);
    });
  }
  
  // Set initial state - validate on load
  setTimeout(() => {
    if (validateBtn) {
      validateBtn.click();
    }
  }, 500);
}

/**
 * Validate the current JSON
 * Updated to properly show success messages
 */
function validateJson(
  statusIndicator: HTMLElement | null, 
  messageArea: HTMLElement | null
): boolean {
  if (!jsonViewer) {
    if (messageArea) {
      messageArea.textContent = 'JSON viewer not initialized';
      messageArea.className = 'json-editor-message error';
    }
    return false;
  }
  
  const json = jsonViewer.getJson();
  let isValid = false;
  
  try {
    // Attempt to stringify and re-parse the JSON to validate it
    // This ensures even complex nested objects are properly validated
    JSON.parse(JSON.stringify(json));
    isValid = true;
  } catch (error) {
    isValid = false;
  }
  
  // Update status indicator
  if (statusIndicator) {
    if (isValid) {
      statusIndicator.textContent = 'Valid JSON';
      statusIndicator.className = 'status-indicator valid';
    } else {
      statusIndicator.textContent = 'Invalid JSON';
      statusIndicator.className = 'status-indicator invalid';
    }
  }
  
  // Update message area
  if (messageArea) {
    if (isValid) {
      messageArea.textContent = 'JSON validation successful. The JSON is valid and can be saved.';
      messageArea.className = 'json-editor-message success';
    } else {
      messageArea.textContent = 'The JSON contains syntax errors that need to be fixed before saving.';
      messageArea.className = 'json-editor-message error';
    }
  }
  
  return isValid;
}

/**
 * Save the current JSON to Figma variables
 */
async function saveJsonToFigma(messageArea: HTMLElement | null): Promise<void> {
  if (!jsonViewer) {
    if (messageArea) {
      messageArea.textContent = 'JSON viewer not initialized';
      messageArea.className = 'json-editor-message error';
    }
    return;
  }
  
  const json = jsonViewer.getJson();
  const isValid = validateJson(
    document.querySelector('.status-indicator') as HTMLElement, 
    messageArea
  );
  
  if (!isValid) {
    if (messageArea) {
      messageArea.textContent = 'Cannot save invalid JSON. Please validate first.';
      messageArea.className = 'json-editor-message error';
    }
    return;
  }
  
  try {
    // Check if the JSON is empty or has no meaningful content
    const isEmpty = Object.keys(json).length === 0 || 
                   !Object.values(json).some(val => typeof val === 'object' && Object.keys(val).length > 0);
    
    if (isEmpty) {
      if (messageArea) {
        messageArea.textContent = 'Cannot save empty JSON data. No variables would be updated.';
        messageArea.className = 'json-editor-message error';
      }
      return;
    }
    
    // Show saving message with clear explanation that only filtered variables will be updated
    if (messageArea) {
      messageArea.textContent = 'Saving changes to filtered Figma variables (non-filtered variables will be preserved)...';
      messageArea.className = 'json-editor-message pending';
    }
    
    // Update Figma variables
    await updateFigmaVariables(json);
    
    // Show success message
    if (messageArea) {
      messageArea.textContent = 'Filtered variables updated successfully!';
      messageArea.className = 'json-editor-message success';
    }
    
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
    if (messageArea) {
      messageArea.textContent = `Error updating variables: ${error instanceof Error ? error.message : 'Unknown error'}`;
      messageArea.className = 'json-editor-message error';
    }
  }
}