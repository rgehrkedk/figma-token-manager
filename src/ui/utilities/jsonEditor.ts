/**
 * jsonEditor.ts
 * 
 * A class-based implementation of JSON editing functionality
 * Provides a unified interface for the JSON editor component
 */

import { formatJson } from './formatters';

/**
 * JsonEditor class for handling JSON editing functionality
 */
export class JsonEditor {
  private container: HTMLElement;
  private editorElement: HTMLTextAreaElement | null = null;
  private highlightElement: HTMLElement | null = null;
  private messageArea: HTMLElement | null = null;
  private jsonData: any;
  private isValid: boolean = true;
  private gutterElement: HTMLElement | null = null;

  /**
   * Constructor for the JsonEditor class
   * @param container The HTML element to render the editor in
   * @param initialJson The initial JSON data to display
   */
  constructor(container: HTMLElement, initialJson: any = {}) {
    this.container = container;
    this.jsonData = initialJson;
    this.initialize();
  }

  /**
   * Initialize the JSON editor
   */
  private initialize(): void {
    // Clear the container
    this.container.innerHTML = '';
    
    // Create the editor layout
    this.createEditorLayout();
    
    // Set the initial content
    this.updateContent();
    
    // Validate initial content
    this.validate();
  }

  /**
   * Create the editor layout
   */
  private createEditorLayout(): void {
    // Create header with controls
    const header = document.createElement('div');
    header.className = 'json-editor-header';
    
    // Add validation status indicator
    const statusContainer = document.createElement('div');
    statusContainer.className = 'json-status';
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'status-indicator pending';
    statusIndicator.textContent = 'Validating...';
    statusContainer.appendChild(statusIndicator);
    
    // Add action buttons
    const actions = document.createElement('div');
    actions.className = 'json-editor-actions';
    
    // Format button
    const formatBtn = document.createElement('button');
    formatBtn.className = 'json-format-btn';
    formatBtn.textContent = 'Format';
    formatBtn.title = 'Format JSON (Ctrl+Shift+F)';
    formatBtn.addEventListener('click', () => this.format());
    actions.appendChild(formatBtn);
    
    // Validate button
    const validateBtn = document.createElement('button');
    validateBtn.className = 'json-validate-btn';
    validateBtn.textContent = 'Validate';
    validateBtn.title = 'Validate JSON (Ctrl+Enter)';
    validateBtn.addEventListener('click', () => this.validate());
    actions.appendChild(validateBtn);
    
    // Help button
    const helpBtn = document.createElement('button');
    helpBtn.className = 'json-help-btn';
    helpBtn.textContent = '?';
    helpBtn.title = 'Show help';
    helpBtn.addEventListener('click', () => this.showHelp());
    actions.appendChild(helpBtn);
    
    header.appendChild(statusContainer);
    header.appendChild(actions);
    this.container.appendChild(header);
    
    // Create the editor container with gutter for line numbers
    const editorContainer = document.createElement('div');
    editorContainer.className = 'json-editor-content';
    
    // Create line numbers gutter
    const formattedJsonStr = formatJson(this.jsonData);
    const lineCount = this.countLines(formattedJsonStr);
    this.gutterElement = this.createLineNumbersGutter(lineCount);
    editorContainer.appendChild(this.gutterElement);
    editorContainer.classList.add('with-line-numbers');
    
    // Create the editor (textarea)
    this.editorElement = document.createElement('textarea');
    this.editorElement.className = 'json-editor-textarea';
    this.editorElement.spellcheck = false;
    
    // Add event listeners
    this.editorElement.addEventListener('input', this.handleEditorInput.bind(this));
    this.editorElement.addEventListener('blur', this.handleEditorBlur.bind(this));
    this.editorElement.addEventListener('scroll', this.syncScroll.bind(this));
    
    // Add keyboard shortcuts
    this.editorElement.addEventListener('keydown', (e) => {
      // Format JSON (Ctrl+Shift+F)
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.format();
      }
      
      // Validate JSON (Ctrl+Enter)
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.validate();
      }
      
      // Tab key for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.editorElement!.selectionStart;
        const end = this.editorElement!.selectionEnd;
        
        // Insert tab character (2 spaces)
        const newText = this.editorElement!.value.substring(0, start) + '  ' + this.editorElement!.value.substring(end);
        this.editorElement!.value = newText;
        
        // Move cursor position
        this.editorElement!.selectionStart = this.editorElement!.selectionEnd = start + 2;
        
        // Update
        this.handleEditorInput();
      }
    });
    
    // Create syntax highlighting layer
    this.highlightElement = document.createElement('div');
    this.highlightElement.className = 'syntax-highlight-layer';
    this.highlightElement.setAttribute('aria-hidden', 'true');
    
    // Add elements to the container
    editorContainer.appendChild(this.editorElement);
    editorContainer.appendChild(this.highlightElement);
    
    // Create a body section to contain the editor
    const body = document.createElement('div');
    body.className = 'json-editor-body';
    body.appendChild(editorContainer);
    this.container.appendChild(body);
    
    // Create message area for showing status messages
    this.messageArea = document.createElement('div');
    this.messageArea.className = 'json-editor-message';
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = 'json-editor-footer';
    footer.appendChild(this.messageArea);
    this.container.appendChild(footer);
    
    // Add help panel (hidden by default)
    const helpPanel = document.createElement('div');
    helpPanel.className = 'json-editor-help';
    helpPanel.style.display = 'none';
    helpPanel.innerHTML = `
      <h4>JSON Editor Help</h4>
      <p>This editor allows you to edit and add Figma variables.</p>
      <ul>
        <li><strong>Collection:</strong> Top-level object keys represent collections</li>
        <li><strong>Mode:</strong> Second-level object keys represent modes</li>
        <li><strong>Variables:</strong> Nested paths represent variables</li>
        <li><strong>For tokens:</strong> Use <code>{"$value": "#fff", "$type": "color"}</code></li>
        <li><strong>References:</strong> Use <code>{"$value": "{path/to/variable}", "$type": "color"}</code></li>
      </ul>
      <p>Keyboard shortcuts:</p>
      <ul>
        <li><strong>Ctrl+Shift+F:</strong> Format JSON</li>
        <li><strong>Ctrl+Enter:</strong> Validate JSON</li>
        <li><strong>Tab:</strong> Insert 2 spaces</li>
      </ul>
      <button class="json-help-close-btn">Close</button>
    `;
    
    const closeHelpBtn = helpPanel.querySelector('.json-help-close-btn');
    if (closeHelpBtn) {
      closeHelpBtn.addEventListener('click', () => {
        helpPanel.style.display = 'none';
      });
    }
    
    this.container.appendChild(helpPanel);
  }
  
  /**
   * Show the help panel
   */
  private showHelp(): void {
    const helpPanel = this.container.querySelector('.json-editor-help') as HTMLElement;
    if (helpPanel) {
      helpPanel.style.display = 'block';
    }
  }

  /**
   * Count lines in a text string
   */
  private countLines(text: string): number {
    return text.split('\n').length;
  }

  /**
   * Create line numbers gutter element
   */
  private createLineNumbersGutter(lineCount: number): HTMLElement {
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

  /**
   * Format JSON with syntax highlighting
   */
  private formatWithHighlighting(code: string): string {
    // Replace with regex-based highlighting
    return code
      // Strings (including keys)
      .replace(/"([^"\\]|\\.)*"/g, (match) => {
        // Check if it's likely a key (followed by colon)
        if (/"([^"\\]|\\.)*"\s*:/.test(match)) {
          return `<span class="token property">${match}</span>`;
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

  /**
   * Update the editor content
   */
  private updateContent(): void {
    if (!this.editorElement) return;
    
    try {
      // Format JSON to string with proper indentation
      const formattedJsonStr = formatJson(this.jsonData);
      
      // Set content in the textarea
      this.editorElement.value = formattedJsonStr;
      
      // Update line numbers
      if (this.gutterElement) {
        const lineCount = this.countLines(formattedJsonStr);
        this.gutterElement.innerHTML = '';
        for (let i = 0; i < lineCount; i++) {
          const lineNumber = document.createElement('div');
          lineNumber.className = 'line-number';
          lineNumber.textContent = String(i + 1);
          this.gutterElement.appendChild(lineNumber);
        }
      }
      
      // Update syntax highlighting
      if (this.highlightElement) {
        this.highlightElement.innerHTML = this.formatWithHighlighting(formattedJsonStr);
        this.syncScroll();
      }
      
      // Update state
      this.isValid = true;
    } catch (error) {
      console.error('Error formatting JSON:', error);
      
      // Show error
      if (this.editorElement) {
        this.editorElement.value = error instanceof Error ? error.message : String(error);
        this.editorElement.classList.add('json-error');
        this.isValid = false;
      }
    }
  }

  /**
   * Handle input in the editor
   */
  private handleEditorInput(): void {
    if (!this.editorElement) return;
    
    // Get current content
    const content = this.editorElement.value;
    
    // Try to parse JSON to validate
    try {
      const parsedJson = JSON.parse(content);
      this.jsonData = parsedJson;
      this.isValid = true;
      
      // Update syntax highlighting
      if (this.highlightElement) {
        this.highlightElement.innerHTML = this.formatWithHighlighting(content);
      }
      
      // Update line numbers
      if (this.gutterElement) {
        const lineCount = this.countLines(content);
        const currentLines = this.gutterElement.childElementCount;
        
        if (lineCount > currentLines) {
          // Add more line numbers
          for (let i = currentLines; i < lineCount; i++) {
            const lineNumber = document.createElement('div');
            lineNumber.className = 'line-number';
            lineNumber.textContent = String(i + 1);
            this.gutterElement.appendChild(lineNumber);
          }
        } else if (lineCount < currentLines) {
          // Remove excess line numbers
          for (let i = currentLines; i > lineCount; i--) {
            this.gutterElement.removeChild(this.gutterElement.lastChild as Node);
          }
        }
      }
    } catch (error) {
      // Invalid JSON, but we don't show error while typing
      this.isValid = false;
    }
    
    // Keep highlight layer in sync with textarea
    this.syncScroll();
  }

  /**
   * Handle editor blur event
   */
  private handleEditorBlur(): void {
    if (!this.editorElement) return;
    
    // Get current content
    const content = this.editorElement.value;
    
    // Try to parse JSON to validate
    try {
      const parsedJson = JSON.parse(content);
      this.jsonData = parsedJson;
      
      // Remove error class if present
      this.editorElement.classList.remove('json-error');
      this.isValid = true;
    } catch (error) {
      // Show error
      this.editorElement.classList.add('json-error');
      this.isValid = false;
    }
    
    // Keep highlight layer in sync with textarea
    this.syncScroll();
  }

  /**
   * Synchronize scrolling between textarea and highlight layer
   */
  private syncScroll(): void {
    if (!this.editorElement || !this.highlightElement) return;
    
    this.highlightElement.scrollTop = this.editorElement.scrollTop;
    this.highlightElement.scrollLeft = this.editorElement.scrollLeft;
  }

  /**
   * Get the current JSON data
   */
  public getJson(): any {
    return this.jsonData;
  }

  /**
   * Update the JSON data
   */
  public updateJson(json: any): void {
    this.jsonData = json;
    this.updateContent();
  }

  /**
   * Format the JSON
   */
  public format(): void {
    try {
      if (!this.editorElement) return;
      
      // Parse and re-stringify for formatting
      const content = this.editorElement.value;
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      
      // Set the formatted JSON back to the textarea
      this.editorElement.value = formatted;
      this.jsonData = parsed;
      this.isValid = true;
      
      // Update syntax highlighting
      if (this.highlightElement) {
        this.highlightElement.innerHTML = this.formatWithHighlighting(formatted);
        this.syncScroll();
      }
      
      // Update line numbers
      if (this.gutterElement) {
        const lineCount = this.countLines(formatted);
        this.gutterElement.innerHTML = '';
        for (let i = 0; i < lineCount; i++) {
          const lineNumber = document.createElement('div');
          lineNumber.className = 'line-number';
          lineNumber.textContent = String(i + 1);
          this.gutterElement.appendChild(lineNumber);
        }
      }
      
      this.showMessage('JSON formatted successfully', 'success');
    } catch (error) {
      this.isValid = false;
      this.showMessage(`Cannot format: ${error instanceof Error ? error.message : 'Invalid JSON'}`, 'error');
    }
  }

  /**
   * Validate the JSON
   */
  public validate(): void {
    if (!this.editorElement) return;
    
    const content = this.editorElement.value;
    
    try {
      // Parse the JSON to validate it
      const parsed = JSON.parse(content);
      
      // If we got here, the JSON is valid
      this.isValid = true;
      this.jsonData = parsed;
      
      // Update the status indicator
      const statusIndicator = this.container.querySelector('.status-indicator');
      if (statusIndicator) {
        statusIndicator.textContent = 'Valid JSON';
        statusIndicator.className = 'status-indicator valid';
      }
      
      this.showMessage('JSON is valid', 'success');
      
      // Remove error class if present
      this.editorElement.classList.remove('json-error');
    } catch (error) {
      // Invalid JSON
      this.isValid = false;
      
      // Update the status indicator
      const statusIndicator = this.container.querySelector('.status-indicator');
      if (statusIndicator) {
        statusIndicator.textContent = 'Invalid JSON';
        statusIndicator.className = 'status-indicator invalid';
      }
      
      // Show error message with details
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
      this.showMessage(`Error: ${errorMessage}`, 'error');
      
      // Add error class
      this.editorElement.classList.add('json-error');
    }
  }

  /**
   * Show a message in the message area
   */
  public showMessage(
    message: string, 
    type: 'error' | 'success' | 'warning' | 'info' | 'pending' = 'info',
    duration: number = 5000
  ): void {
    if (this.messageArea) {
      this.messageArea.textContent = message;
      this.messageArea.className = `json-editor-message ${type}`;
      
      // Auto-hide success and info messages after duration
      if ((type === 'success' || type === 'info') && duration > 0) {
        setTimeout(() => {
          if (this.messageArea && this.messageArea.textContent === message) {
            this.messageArea.textContent = '';
            this.messageArea.className = 'json-editor-message';
          }
        }, duration);
      }
    } else {
      // Fallback to console if no message area
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }
}