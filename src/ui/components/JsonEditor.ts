/**
 * JsonEditor.ts
 * 
 * Enhanced component for editing JSON with validation, save functionality,
 * and support for Figma variables, collections, and modes
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
  showMessage: (message: string, type: 'error' | 'success' | 'warning' | 'info') => void;
}

/**
 * Creates an enhanced JSON editor component with validation and variable management
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
  
  // Create elements with enhanced UI
  container.innerHTML = `
    <div class="json-editor-container">
      <div class="json-editor-header">
        <div class="json-status">
          <span class="status-indicator valid">Valid JSON</span>
        </div>
        <div class="json-editor-actions">
          <button class="json-help-btn" title="Show help">?</button>
          <button class="json-format-btn" title="Format JSON">Format</button>
          <button class="json-validate-btn">Validate</button>
          <button class="json-save-btn" disabled>Save to Figma</button>
        </div>
      </div>
      <div class="json-editor-body">
        <div class="json-editor-wrapper">
          <div class="line-numbers"></div>
          <textarea id="json-editor-textarea" class="json-editor-textarea" spellcheck="false"></textarea>
        </div>
      </div>
      <div class="json-editor-footer">
        <div class="json-editor-message"></div>
      </div>
      <div class="json-editor-help" style="display:none">
        <h4>JSON Editor Help</h4>
        <p>This editor allows you to edit and add variables, collections, and modes.</p>
        <ul>
          <li><strong>Collection:</strong> Top-level object keys represent collections (e.g., "Colors", "Spacing")</li>
          <li><strong>Mode:</strong> Second-level object keys represent modes (e.g., "Light", "Dark")</li>
          <li><strong>Variables:</strong> Nested paths represent variables. Use dot or slash notation.</li>
          <li><strong>Structure:</strong> For DTCG format, use <code>{"$value": "#fff", "$type": "color", "$description": "Optional"}</code></li>
          <li><strong>References:</strong> Reference other variables using <code>{"$value": "{path/to/variable}", "$type": "color"}</code></li>
        </ul>
        <p><strong>Name changes:</strong> To rename a variable, collection, group or mode, modify its key directly in the JSON editor.</p>
        <p><strong>IMPORTANT:</strong> For safety, automatic variable deletion has been disabled. To delete a variable, you must remove it manually in Figma after saving your changes.</p>
        <p>All changes will apply when you click "Save to Figma".</p>
        <button class="json-help-close-btn">Close</button>
      </div>
    </div>
  `;
  
  // Add CSS styles for help popup and line numbers
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .json-editor-help {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      max-width: 500px;
      width: 90%;
    }
    .json-editor-help h4 {
      margin-top: 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .json-editor-help ul {
      padding-left: 20px;
    }
    .json-editor-help code {
      background: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.9em;
    }
    .json-editor-help button {
      margin-top: 12px;
    }
    .json-help-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      padding: 0;
      font-weight: bold;
      margin-right: 8px;
    }
    .json-editor-wrapper {
      display: flex;
      width: 100%;
      height: 100%;
      position: relative;
    }
    .line-numbers {
      width: 40px;
      padding: 8px 0 8px 8px;
      background-color: #f5f5f5;
      border-right: 1px solid #ddd;
      color: #999;
      font-family: monospace;
      font-size: 13px;
      text-align: right;
      user-select: none;
      overflow: hidden;
    }
    .json-editor-textarea {
      flex: 1;
      margin-left: 0;
      padding-left: 8px;
      font-family: monospace;
      line-height: 1.5;
      tab-size: 2;
      font-size: 13px;
      resize: none;
      border: none;
      outline: none;
    }
  `;
  document.head.appendChild(styleEl);
  
  // Get elements
  const textarea = container.querySelector('#json-editor-textarea') as HTMLTextAreaElement;
  const validateBtn = container.querySelector('.json-validate-btn') as HTMLButtonElement;
  const formatBtn = container.querySelector('.json-format-btn') as HTMLButtonElement;
  const saveBtn = container.querySelector('.json-save-btn') as HTMLButtonElement;
  const helpBtn = container.querySelector('.json-help-btn') as HTMLButtonElement;
  const helpPanel = container.querySelector('.json-editor-help') as HTMLDivElement;
  const helpCloseBtn = container.querySelector('.json-help-close-btn') as HTMLButtonElement;
  const statusIndicator = container.querySelector('.status-indicator') as HTMLSpanElement;
  const messageArea = container.querySelector('.json-editor-message') as HTMLDivElement;
  const lineNumbersContainer = container.querySelector('.line-numbers') as HTMLDivElement;
  
  // Initialize with formatted JSON
  setJsonContent(initialJson);
  
  // Initialize line numbers
  updateLineNumbers();
  
  // Add event listeners
  textarea.addEventListener('input', handleTextareaChange);
  textarea.addEventListener('scroll', syncScroll);
  textarea.addEventListener('input', updateLineNumbers);
  textarea.addEventListener('keydown', handleTabKey);
  validateBtn.addEventListener('click', validateJson);
  formatBtn.addEventListener('click', formatJson);
  saveBtn.addEventListener('click', saveJson);
  helpBtn.addEventListener('click', () => helpPanel.style.display = 'block');
  helpCloseBtn.addEventListener('click', () => helpPanel.style.display = 'none');
  
  // Function to update line numbers
  function updateLineNumbers() {
    const lines = textarea.value.split('\n');
    const lineCount = lines.length;
    let lineNumbersHTML = '';
    
    for (let i = 1; i <= lineCount; i++) {
      lineNumbersHTML += `<div>${i}</div>`;
    }
    
    lineNumbersContainer.innerHTML = lineNumbersHTML;
    syncScroll();
  }
  
  // Function to sync scroll between textarea and line numbers
  function syncScroll() {
    lineNumbersContainer.scrollTop = textarea.scrollTop;
  }
  
  // Handle tab key for indentation
  function handleTabKey(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert tab character (2 spaces)
      const newText = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.value = newText;
      
      // Move cursor position
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      
      // Update line numbers and trigger change event
      updateLineNumbers();
      handleTextareaChange();
    }
  }
  
  // Enable keyboard shortcuts
  textarea.addEventListener('keydown', (e) => {
    // Format JSON (Ctrl+Shift+F)
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      formatJson();
    }
    
    // Validate JSON (Ctrl+Enter)
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      validateJson();
    }
    
    // Save JSON (Ctrl+S)
    if (e.ctrlKey && e.key === 'S') {
      e.preventDefault();
      if (isJsonValid) {
        saveJson();
      } else {
        validateJson();
      }
    }
  });
  
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
      messageArea.className = 'json-editor-message error';
      isJsonValid = false;
      updateUI();
    }
  }
  
  /**
   * Format the current JSON with proper indentation
   */
  function formatJson(): void {
    try {
      // Parse and re-stringify for formatting
      const content = textarea.value;
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      
      // Set the formatted JSON back to the textarea
      textarea.value = formatted;
      currentJson = parsed;
      isJsonValid = true;
      
      // Update UI
      statusIndicator.textContent = 'Valid JSON (Formatted)';
      statusIndicator.className = 'status-indicator valid';
      saveBtn.disabled = false;
      messageArea.textContent = 'JSON formatted successfully';
      messageArea.className = 'json-editor-message success';
    } catch (error) {
      // Invalid JSON
      isJsonValid = false;
      
      // Update UI
      statusIndicator.textContent = 'Invalid JSON';
      statusIndicator.className = 'status-indicator invalid';
      saveBtn.disabled = true;
      messageArea.textContent = `Cannot format: ${error instanceof Error ? error.message : 'Invalid JSON'}`;
      messageArea.className = 'json-editor-message error';
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
      
      // Validate for minimal required structure
      let structureValid = true;
      let structureError = '';
      
      // Verify structure: should be an object with collections
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        structureValid = false;
        structureError = 'JSON must be an object with collections as top-level keys';
      } else {
        // Check if any collection exists
        if (Object.keys(parsed).length === 0) {
          structureValid = false;
          structureError = 'At least one collection must be defined';
        } else {
          // For each collection, verify it has at least one mode
          for (const collection in parsed) {
            const collectionData = parsed[collection];
            
            if (typeof collectionData !== 'object' || Array.isArray(collectionData) || collectionData === null) {
              structureValid = false;
              structureError = `Collection "${collection}" must be an object with modes as keys`;
              break;
            }
            
            if (Object.keys(collectionData).length === 0) {
              structureValid = false;
              structureError = `Collection "${collection}" must have at least one mode`;
              break;
            }
          }
        }
      }
      
      // Update UI based on validation
      if (structureValid) {
        statusIndicator.textContent = 'Valid JSON';
        statusIndicator.className = 'status-indicator valid';
        saveBtn.disabled = false;
        messageArea.textContent = '';
        messageArea.className = 'json-editor-message';
      } else {
        statusIndicator.textContent = 'Valid JSON (Structure Issues)';
        statusIndicator.className = 'status-indicator warning';
        saveBtn.disabled = true;
        messageArea.textContent = `Warning: ${structureError}`;
        messageArea.className = 'json-editor-message warning';
      }
    } catch (error) {
      // Invalid JSON
      isJsonValid = false;
      
      // Update UI
      statusIndicator.textContent = 'Invalid JSON';
      statusIndicator.className = 'status-indicator invalid';
      saveBtn.disabled = true;
      messageArea.textContent = `Error: ${error instanceof Error ? error.message : 'Invalid JSON format'}`;
      messageArea.className = 'json-editor-message error';
    }
  }
  
  /**
   * Save the JSON back to Figma
   */
  function saveJson(): void {
    if (!isJsonValid) {
      messageArea.textContent = 'Cannot save invalid JSON. Please validate first.';
      messageArea.className = 'json-editor-message error';
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
   * Show a message in the message area
   */
  function showMessage(message: string, type: 'error' | 'success' | 'warning' | 'info'): void {
    messageArea.textContent = message;
    messageArea.className = `json-editor-message ${type}`;
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
    },
    showMessage: (message: string, type: 'error' | 'success' | 'warning' | 'info') => {
      showMessage(message, type);
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
    isValid: () => false,
    showMessage: () => {}
  };
}