/**
 * JsonEditor.ts
 * 
 * A component for editing JSON with validation and save functionality
 */

interface JsonEditorOptions {
    containerId: string;
    initialJson: any;
    onSave: (updatedJson: any) => void;
  }
  
  interface JsonEditorInterface {
    setJson: (json: any) => void;
    getJson: () => any;
    isValid: () => boolean;
  }
  
  /**
   * Creates a JSON editor component with validation
   */
  export function createJsonEditor(options: JsonEditorOptions): JsonEditorInterface {
    const { containerId, initialJson, onSave } = options;
    
    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`JSON Editor: Container with ID "${containerId}" not found`);
      return createEmptyInterface();
    }
    
    // State
    let currentJson = initialJson;
    let isJsonValid = true;
    
    // Create elements
    container.innerHTML = `
      <div class="json-editor-container">
        <div class="json-editor-header">
          <div class="json-status">
            <span class="status-indicator valid">Valid JSON</span>
          </div>
          <div class="json-editor-actions">
            <button class="json-validate-btn">Validate</button>
            <button class="json-save-btn" disabled>Save to Figma</button>
          </div>
        </div>
        <div class="json-editor-body">
          <textarea id="json-editor-textarea" class="json-editor-textarea" spellcheck="false"></textarea>
        </div>
        <div class="json-editor-footer">
          <div class="json-editor-message"></div>
        </div>
      </div>
    `;
    
    // Get elements
    const textarea = container.querySelector('#json-editor-textarea') as HTMLTextAreaElement;
    const validateBtn = container.querySelector('.json-validate-btn') as HTMLButtonElement;
    const saveBtn = container.querySelector('.json-save-btn') as HTMLButtonElement;
    const statusIndicator = container.querySelector('.status-indicator') as HTMLSpanElement;
    const messageArea = container.querySelector('.json-editor-message') as HTMLDivElement;
    
    // Initialize with formatted JSON
    setJsonContent(initialJson);
    
    // Add event listeners
    textarea.addEventListener('input', handleTextareaChange);
    validateBtn.addEventListener('click', validateJson);
    saveBtn.addEventListener('click', saveJson);
    
    /**
     * Format and set the JSON content in the textarea
     */
    function setJsonContent(json: any): void {
      try {
        const formattedJson = JSON.stringify(json, null, 2);
        textarea.value = formattedJson;
        isJsonValid = true;
        updateUI();
      } catch (error) {
        console.error('Error formatting JSON:', error);
        messageArea.textContent = `Error formatting JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
        isJsonValid = false;
        updateUI();
      }
    }
    
    /**
     * Handle changes to the textarea content
     */
    function handleTextareaChange(): void {
      // Mark as not validated
      statusIndicator.textContent = 'Not validated';
      statusIndicator.className = 'status-indicator pending';
      saveBtn.disabled = true;
    }
    
    /**
     * Validate the current JSON content
     */
    function validateJson(): void {
      const content = textarea.value;
      
      try {
        // Parse the JSON to validate it
        const parsed = JSON.parse(content);
        
        // If we got here, the JSON is valid
        isJsonValid = true;
        currentJson = parsed;
        
        // Update UI
        statusIndicator.textContent = 'Valid JSON';
        statusIndicator.className = 'status-indicator valid';
        saveBtn.disabled = false;
        messageArea.textContent = '';
      } catch (error) {
        // Invalid JSON
        isJsonValid = false;
        
        // Update UI
        statusIndicator.textContent = 'Invalid JSON';
        statusIndicator.className = 'status-indicator invalid';
        saveBtn.disabled = true;
        messageArea.textContent = `Error: ${error instanceof Error ? error.message : 'Invalid JSON format'}`;
      }
    }
    
    /**
     * Save the JSON back to Figma
     */
    function saveJson(): void {
      if (!isJsonValid) {
        messageArea.textContent = 'Cannot save invalid JSON. Please validate first.';
        return;
      }
      
      // Call the onSave callback with the current JSON
      try {
        onSave(currentJson);
        messageArea.textContent = 'JSON saved successfully. Updating Figma variables...';
        messageArea.className = 'json-editor-message success';
      } catch (error) {
        messageArea.textContent = `Error saving JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
        messageArea.className = 'json-editor-message error';
      }
    }
    
    /**
     * Update the UI state
     */
    function updateUI(): void {
      saveBtn.disabled = !isJsonValid;
      
      if (isJsonValid) {
        statusIndicator.textContent = 'Valid JSON';
        statusIndicator.className = 'status-indicator valid';
      } else {
        statusIndicator.textContent = 'Invalid JSON';
        statusIndicator.className = 'status-indicator invalid';
      }
    }
    
    /**
     * Public interface
     */
    return {
      setJson: (json: any) => {
        setJsonContent(json);
      },
      getJson: () => {
        return currentJson;
      },
      isValid: () => {
        return isJsonValid;
      }
    };
  }
  
  /**
   * Create an empty interface for when the container isn't found
   */
  function createEmptyInterface(): JsonEditorInterface {
    return {
      setJson: () => {},
      getJson: () => ({}),
      isValid: () => false
    };
  }