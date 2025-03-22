/**
 * JsonViewer.ts
 * 
 * Enhanced JSON component with both viewing and editing capabilities
 * Includes syntax highlighting, line numbers, and validation
 */
import { formatJson } from '../utilities/formatters';

// Simplified utility functions for JSON highlighting
export function countLines(text: string): number {
  return text.split('\n').length;
}

export function createLineNumbersGutter(lineCount: number): HTMLElement {
  const gutter = document.createElement('div');
  gutter.className = 'line-numbers-gutter';
  
  for (let i = 0; i < lineCount; i++) {
    const lineNumber = document.createElement('div');
    lineNumber.className = 'line-number';
    lineNumber.textContent = String(i + 1);
    gutter.appendChild(lineNumber);
  }
  
  return gutter;
}

// Basic JSON syntax highlighting with spans - adapted for VSCode dark theme
export function formatJSONWithHighlighting(code: string): string {
  // Replace with simple regex-based highlighting
  return code
    // Strings (including keys)
    .replace(/"([^"\\]|\\.)*"/g, (match) => {
      // Check if it's likely a key (followed by colon)
      if (/"([^"\\]|\\.)*"\s*:/.test(match)) {
        return `<span class="token property">${match}</span>`;
      }
      // Check if it's a color hex value
      if (/"#[0-9a-fA-F]+"/i.test(match)) {
        return `<span class="token color-hex">${match}</span>`;
      }
      return `<span class="token string">${match}</span>`;
    })
    // Numbers
    .replace(/\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g, '<span class="token number">$1</span>')
    // Boolean
    .replace(/\b(true|false)\b/g, '<span class="token boolean">$1</span>')
    // Null
    .replace(/\bnull\b/g, '<span class="token null">null</span>')
    // Punctuation
    .replace(/([{}[\]:,])/g, '<span class="token punctuation">$1</span>');
}

// Interface for JSON component options
export interface JsonComponentOptions {
  containerId: string;
  wrapperClass?: string;
  initialJson?: any;
  lineNumbers?: boolean;
  maxHeight?: string;
  editable?: boolean;
  onChange?: (json: string) => void;
  onSave?: (json: any) => void;
  showControls?: boolean;
}

// Interface for JSON component
export interface JsonComponentInterface {
  setJson: (json: any) => void;
  getJson: () => any;
  isValid: () => boolean;
  getElement: () => HTMLElement | null;
  showMessage?: (message: string, type: 'error' | 'success' | 'warning' | 'info') => void;
}

/**
 * Creates a unified JSON component that can function as either a viewer or editor
 */
export function createJsonComponent(options: JsonComponentOptions): JsonComponentInterface {
  const {
    containerId,
    wrapperClass = 'json-viewer-wrapper',
    initialJson = {},
    lineNumbers = true,
    maxHeight = '500px',
    editable = false,
    onChange,
    onSave,
    showControls = editable
  } = options;

  // Get container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`JsonComponent: Container with ID "${containerId}" not found`);
    return createEmptyInterface();
  }

  // State
  let currentJson = initialJson;
  let isJsonValid = true;
  let editorElement: HTMLTextAreaElement | null = null;
  let gutterElement: HTMLElement | null = null;
  let highlightElement: HTMLElement | null = null;
  let wrapperElement: HTMLElement | null = null;
  let messageArea: HTMLElement | null = null;
  let statusIndicator: HTMLElement | null = null;

  // Create component elements
  function createComponentElements(): void {
    // Clear container
    container.innerHTML = '';
    
    // Create wrapper with appropriate class
    wrapperElement = document.createElement('div');
    wrapperElement.className = editable ? 'json-editor-container' : wrapperClass;
    
    // Set max height if specified and not in editor mode
    if (maxHeight && !editable) {
      wrapperElement.style.maxHeight = maxHeight;
      wrapperElement.style.overflow = 'auto';
    }
    
    // If in editable mode with controls, create header
    if (editable && showControls) {
      const header = document.createElement('div');
      header.className = 'json-editor-header';
      
      // Status indicator
      const statusContainer = document.createElement('div');
      statusContainer.className = 'json-status';
      statusIndicator = document.createElement('span');
      statusIndicator.className = 'status-indicator valid';
      statusIndicator.textContent = 'Valid JSON';
      statusContainer.appendChild(statusIndicator);
      
      // Action buttons
      const actions = document.createElement('div');
      actions.className = 'json-editor-actions';
      
      // Help button for editor mode
      const helpBtn = document.createElement('button');
      helpBtn.className = 'json-help-btn';
      helpBtn.title = 'Show help';
      helpBtn.textContent = '?';
      helpBtn.addEventListener('click', () => showHelp());
      actions.appendChild(helpBtn);
      
      // Format button
      const formatBtn = document.createElement('button');
      formatBtn.className = 'json-format-btn';
      formatBtn.title = 'Format JSON';
      formatBtn.textContent = 'Format';
      formatBtn.addEventListener('click', handleFormatJson);
      actions.appendChild(formatBtn);
      
      // Validate button
      const validateBtn = document.createElement('button');
      validateBtn.className = 'json-validate-btn';
      validateBtn.textContent = 'Validate';
      validateBtn.addEventListener('click', validateJson);
      actions.appendChild(validateBtn);
      
      // Save button (only if onSave provided)
      if (onSave) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'json-save-btn';
        saveBtn.textContent = 'Save';
        saveBtn.disabled = !isJsonValid;
        saveBtn.addEventListener('click', handleSave);
        actions.appendChild(saveBtn);
      }
      
      header.appendChild(statusContainer);
      header.appendChild(actions);
      wrapperElement.appendChild(header);
    }
    
    // Create editor container with gutter for line numbers
    const editorContainer = document.createElement('div');
    editorContainer.className = 'json-editor-content';
    
    if (lineNumbers) {
      // Create line numbers gutter
      const formattedJsonStr = formatJson(currentJson);
      const lineCount = countLines(formattedJsonStr);
      gutterElement = createLineNumbersGutter(lineCount);
      editorContainer.appendChild(gutterElement);
      editorContainer.classList.add('with-line-numbers');
    }
    
    // Create the editor (textarea)
    editorElement = document.createElement('textarea');
    editorElement.className = 'json-editor-textarea';
    editorElement.spellcheck = false;
    
    if (!editable) {
      editorElement.readOnly = true;
    } else {
      editorElement.addEventListener('input', handleEditorInput);
      editorElement.addEventListener('blur', handleEditorBlur);
      editorElement.addEventListener('scroll', syncScroll);
      
      // Add keyboard shortcuts
      editorElement.addEventListener('keydown', (e) => {
        // Format JSON (Ctrl+Shift+F)
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
          e.preventDefault();
          handleFormatJson();
        }
        
        // Validate JSON (Ctrl+Enter)
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          validateJson();
        }
        
        // Save JSON (Ctrl+S)
        if (e.ctrlKey && e.key === 'S' && onSave) {
          e.preventDefault();
          if (isJsonValid) {
            handleSave();
          } else {
            validateJson();
          }
        }
        
        // Tab key for indentation
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = editorElement!.selectionStart;
          const end = editorElement!.selectionEnd;
          
          // Insert tab character (2 spaces)
          const newText = editorElement!.value.substring(0, start) + '  ' + editorElement!.value.substring(end);
          editorElement!.value = newText;
          
          // Move cursor position
          editorElement!.selectionStart = editorElement!.selectionEnd = start + 2;
          
          // Update
          handleEditorInput();
        }
      });
    }
    
    // Create syntax highlighting layer (only for editable mode)
    if (editable) {
      highlightElement = document.createElement('div');
      highlightElement.className = 'syntax-highlight-layer';
      highlightElement.setAttribute('aria-hidden', 'true');
    }
    
    // Add elements to the container
    editorContainer.appendChild(editorElement);
    if (editable && highlightElement) {
      editorContainer.appendChild(highlightElement);
    }
    
    // Create a body section to contain the editor
    if (editable) {
      const body = document.createElement('div');
      body.className = 'json-editor-body';
      body.appendChild(editorContainer);
      wrapperElement.appendChild(body);
    } else {
      wrapperElement.appendChild(editorContainer);
    }
    
    // Add footer with message area for editable mode
    if (editable && showControls) {
      const footer = document.createElement('div');
      footer.className = 'json-editor-footer';
      
      messageArea = document.createElement('div');
      messageArea.className = 'json-editor-message';
      
      footer.appendChild(messageArea);
      wrapperElement.appendChild(footer);
      
      // Add help panel (hidden by default)
      const helpPanel = document.createElement('div');
      helpPanel.className = 'json-editor-help';
      helpPanel.style.display = 'none';
      helpPanel.innerHTML = `
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
        <p>All changes will apply when you click "Save".</p>
        <button class="json-help-close-btn">Close</button>
      `;
      
      const closeHelpBtn = helpPanel.querySelector('.json-help-close-btn');
      if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', () => {
          helpPanel.style.display = 'none';
        });
      }
      
      wrapperElement.appendChild(helpPanel);
    }
    
    container.appendChild(wrapperElement);
    
    // Set initial content
    updateContent();
  }

  /**
   * Update the content of the component
   */
  function updateContent(): void {
    if (!editorElement) return;
    
    try {
      // Format JSON to string with proper indentation
      const formattedJsonStr = formatJson(currentJson);
      
      // Set content in the textarea
      editorElement.value = formattedJsonStr;
      
      // Update line numbers if needed
      if (lineNumbers && gutterElement) {
        const lineCount = countLines(formattedJsonStr);
        gutterElement.innerHTML = '';
        for (let i = 0; i < lineCount; i++) {
          const lineNumber = document.createElement('div');
          lineNumber.className = 'line-number';
          lineNumber.textContent = String(i + 1);
          gutterElement.appendChild(lineNumber);
        }
      }
      
      // Update syntax highlighting if in editable mode
      if (editable && highlightElement) {
        highlightElement.innerHTML = formatJSONWithHighlighting(formattedJsonStr);
        syncScroll();
      }
      
      // Update state
      isJsonValid = true;
      updateUI();
    } catch (error) {
      console.error('Error formatting JSON:', error);
      
      // Show error
      if (editorElement) {
        editorElement.value = error instanceof Error ? error.message : String(error);
        editorElement.classList.add('json-error');
        isJsonValid = false;
        updateUI();
      }
    }
  }

  /**
   * Format the current JSON
   */
  function handleFormatJson(): void {
    try {
      // Parse and re-stringify for formatting
      const content = editorElement?.value || '';
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      
      // Set the formatted JSON back to the textarea
      if (editorElement) {
        editorElement.value = formatted;
      }
      
      currentJson = parsed;
      isJsonValid = true;
      
      // Update UI
      if (statusIndicator) {
        statusIndicator.textContent = 'Valid JSON (Formatted)';
        statusIndicator.className = 'status-indicator valid';
      }
      
      // Update syntax highlighting
      if (editable && highlightElement) {
        highlightElement.innerHTML = formatJSONWithHighlighting(formatted);
        syncScroll();
      }
      
      // Update line numbers
      if (lineNumbers && gutterElement) {
        const lineCount = countLines(formatted);
        gutterElement.innerHTML = '';
        for (let i = 0; i < lineCount; i++) {
          const lineNumber = document.createElement('div');
          lineNumber.className = 'line-number';
          lineNumber.textContent = String(i + 1);
          gutterElement.appendChild(lineNumber);
        }
      }
      
      updateUI();
      showMessage('JSON formatted successfully', 'success');
    } catch (error) {
      isJsonValid = false;
      showMessage(`Cannot format: ${error instanceof Error ? error.message : 'Invalid JSON'}`, 'error');
      updateUI();
    }
  }

  /**
   * Handle input in editable mode
   */
  function handleEditorInput(): void {
    if (!editorElement) return;
    
    // Get current content
    const content = editorElement.value;
    
    // Try to parse JSON to validate
    try {
      const parsedJson = JSON.parse(content);
      currentJson = parsedJson;
      isJsonValid = true;
      
      // Update syntax highlighting
      if (highlightElement) {
        highlightElement.innerHTML = formatJSONWithHighlighting(content);
      }
      
      // Update line numbers
      if (lineNumbers && gutterElement) {
        const lineCount = countLines(content);
        const currentLines = gutterElement.childElementCount;
        
        if (lineCount > currentLines) {
          // Add more line numbers
          for (let i = currentLines; i < lineCount; i++) {
            const lineNumber = document.createElement('div');
            lineNumber.className = 'line-number';
            lineNumber.textContent = String(i + 1);
            gutterElement.appendChild(lineNumber);
          }
        } else if (lineCount < currentLines) {
          // Remove excess line numbers
          for (let i = currentLines; i > lineCount; i--) {
            gutterElement.removeChild(gutterElement.lastChild as Node);
          }
        }
      }
      
      // Call onChange callback if provided
      if (onChange) {
        onChange(content);
      }
    } catch (error) {
      // Invalid JSON, but we don't show error while typing
      isJsonValid = false;
    }
    
    // Keep highlight layer in sync with textarea
    syncScroll();
    
    // Mark as not validated in UI
    if (statusIndicator) {
      statusIndicator.textContent = 'Not validated';
      statusIndicator.className = 'status-indicator pending';
    }
    
    updateUI();
  }

  /**
   * Synchronize scrolling between textarea and highlight layer
   */
  function syncScroll(): void {
    if (!editorElement || !highlightElement) return;
    
    highlightElement.scrollTop = editorElement.scrollTop;
    highlightElement.scrollLeft = editorElement.scrollLeft;
  }

  /**
   * Handle blur event in editable mode
   */
  function handleEditorBlur(event: FocusEvent): void {
    if (!editorElement) return;
    
    // Get current content
    const content = editorElement.value;
    
    // Try to parse JSON to validate
    try {
      const parsedJson = JSON.parse(content);
      currentJson = parsedJson;
      
      // Format the JSON nicely
      const jsonStr = formatJson(parsedJson);
      editorElement.value = jsonStr;
      
      // Update syntax highlighting
      if (highlightElement) {
        highlightElement.innerHTML = formatJSONWithHighlighting(jsonStr);
      }
      
      // Remove error class if present
      editorElement.classList.remove('json-error');
      isJsonValid = true;
    } catch (error) {
      // Show error
      editorElement.classList.add('json-error');
      isJsonValid = false;
    }
    
    // Keep highlight layer in sync with textarea
    syncScroll();
    updateUI();
  }

  /**
   * Validate the current JSON
   */
  function validateJson(): void {
    if (!editorElement) return;
    
    const content = editorElement.value;
    
    try {
      // Parse the JSON to validate it
      const parsed = JSON.parse(content);
      
      // If we got here, the JSON is valid
      isJsonValid = true;
      currentJson = parsed;
      
      // Update UI
      if (statusIndicator) {
        statusIndicator.textContent = 'Valid JSON';
        statusIndicator.className = 'status-indicator valid';
      }
      
      showMessage('JSON is valid', 'success');
      updateUI();
    } catch (error) {
      // Invalid JSON
      isJsonValid = false;
      
      // Update UI
      if (statusIndicator) {
        statusIndicator.textContent = 'Invalid JSON';
        statusIndicator.className = 'status-indicator invalid';
      }
      
      showMessage(`Error: ${error instanceof Error ? error.message : 'Invalid JSON format'}`, 'error');
      updateUI();
    }
  }

  /**
   * Show the help panel
   */
  function showHelp(): void {
    const helpPanel = wrapperElement?.querySelector('.json-editor-help') as HTMLElement;
    if (helpPanel) {
      helpPanel.style.display = 'block';
    }
  }

  /**
   * Save the JSON
   */
  function handleSave(): void {
    if (!isJsonValid || !onSave) {
      showMessage('Cannot save invalid JSON. Please validate first.', 'error');
      return;
    }
    
    // Call the onSave callback with the current JSON
    try {
      onSave(currentJson);
      showMessage('JSON saved successfully.', 'success');
    } catch (error) {
      showMessage(`Error saving JSON: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }

  /**
   * Update the UI state
   */
  function updateUI(): void {
    // Update save button if it exists
    const saveBtn = wrapperElement?.querySelector('.json-save-btn') as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.disabled = !isJsonValid;
    }
    
    // Update status indicator
    if (statusIndicator) {
      if (isJsonValid) {
        statusIndicator.textContent = 'Valid JSON';
        statusIndicator.className = 'status-indicator valid';
      } else {
        statusIndicator.textContent = 'Invalid JSON';
        statusIndicator.className = 'status-indicator invalid';
      }
    }
  }

  /**
   * Show a message in the message area
   */
  function showMessage(message: string, type: 'error' | 'success' | 'warning' | 'info'): void {
    if (messageArea) {
      messageArea.textContent = message;
      messageArea.className = `json-editor-message ${type}`;
    } else {
      // Fallback to console if no message area
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  // Create the component
  createComponentElements();

  // Public interface
  return {
    setJson: (json: any) => {
      currentJson = json;
      updateContent();
    },
    getJson: () => currentJson,
    isValid: () => isJsonValid,
    getElement: () => editorElement,
    showMessage: (message: string, type: 'error' | 'success' | 'warning' | 'info') => {
      showMessage(message, type);
    }
  };
}

/**
 * Create empty interface for when the container isn't found
 */
function createEmptyInterface(): JsonComponentInterface {
  return {
    setJson: () => {},
    getJson: () => ({}),
    isValid: () => false,
    getElement: () => null,
    showMessage: () => {}
  };
}

/**
 * Legacy methods for backward compatibility
 */
export interface JsonViewerOptions extends JsonComponentOptions {}
export interface JsonViewerInterface extends JsonComponentInterface {}

export function createJsonViewer(options: JsonViewerOptions): JsonViewerInterface {
  // Simply pass through to the unified component with editable=false
  const viewerOptions = {
    ...options,
    editable: false
  };
  return createJsonComponent(viewerOptions);
}

export interface JsonEditorOptions {
  containerId: string;
  initialJson: any;
  onSave: (updatedJson: any) => void;
}

export interface JsonEditorInterface extends JsonComponentInterface {}

export function createJsonEditor(options: JsonEditorOptions): JsonEditorInterface {
  // Convert to unified component options and delegate
  const editorOptions: JsonComponentOptions = {
    containerId: options.containerId,
    initialJson: options.initialJson,
    editable: true,
    onSave: options.onSave,
    showControls: true
  };
  return createJsonComponent(editorOptions);
}