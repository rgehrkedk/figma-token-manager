/**
 * JsonViewer.ts
 * 
 * Enhanced JSON viewer component with syntax highlighting and line numbers
 * Using inline implementation to avoid CDN loading issues in Figma
 * Modified to preserve editability while showing line numbers
 */
import { formatJson } from '../utilities/formatters';
import { formatJSONWithHighlighting, countLines, createLineNumbersGutter } from '../utilities/inlinePrism';

export interface JsonViewerOptions {
  containerId: string;
  wrapperClass?: string;
  initialJson?: any;
  lineNumbers?: boolean;
  maxHeight?: string;
  editable?: boolean;
  onChange?: (json: string) => void;
}

export interface JsonViewerInterface {
  setJson: (json: any) => void;
  getJson: () => any;
  isValid: () => boolean;
  getElement: () => HTMLElement | null;
}

/**
 * Creates an enhanced JSON viewer component with syntax highlighting and line numbers
 */
export function createJsonViewer(options: JsonViewerOptions): JsonViewerInterface {
  const {
    containerId,
    wrapperClass = 'json-viewer-wrapper',
    initialJson = {},
    lineNumbers = true,
    maxHeight = '500px',
    editable = false,
    onChange
  } = options;

  // Get container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`JsonViewer: Container with ID "${containerId}" not found`);
    return createEmptyInterface();
  }

  // State
  let currentJson = initialJson;
  let isJsonValid = true;
  let editorElement: HTMLTextAreaElement | null = null;
  let gutterElement: HTMLElement | null = null;
  let highlightElement: HTMLElement | null = null;
  let wrapperElement: HTMLElement | null = null;

  // Create viewer elements
  function createViewerElements(): void {
    // Clear container
    container.innerHTML = '';
    
    // Create wrapper
    wrapperElement = document.createElement('div');
    wrapperElement.className = wrapperClass;
    
    // Set max height if specified
    if (maxHeight) {
      wrapperElement.style.maxHeight = maxHeight;
      wrapperElement.style.overflow = 'auto';
    }
    
    // Create editor container with gutter for line numbers
    const editorContainer = document.createElement('div');
    editorContainer.className = 'json-editor-content';
    
    if (lineNumbers) {
      // Create line numbers gutter
      const formattedJson = formatJson(currentJson);
      const lineCount = countLines(formattedJson);
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
    }
    
    // Create syntax highlighting layer
    highlightElement = document.createElement('div');
    highlightElement.className = 'syntax-highlight-layer';
    highlightElement.setAttribute('aria-hidden', 'true');
    
    // Add elements to the container
    editorContainer.appendChild(editorElement);
    if (editable) {
      // Only add the highlight layer for editable mode
      // For read-only, we'll just use the styled textarea
      editorContainer.appendChild(highlightElement);
    }
    
    wrapperElement.appendChild(editorContainer);
    container.appendChild(wrapperElement);
    
    // Set initial content
    updateContent();
  }

  /**
   * Update the content of the viewer
   */
  function updateContent(): void {
    if (!editorElement) return;
    
    try {
      // Format JSON to string with proper indentation
      const formattedJson = formatJson(currentJson);
      
      // Set content in the textarea
      editorElement.value = formattedJson;
      
      // Update line numbers if needed
      if (lineNumbers && gutterElement) {
        const lineCount = countLines(formattedJson);
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
        highlightElement.innerHTML = formatJSONWithHighlighting(formattedJson);
        syncScroll();
      }
      
      // Update state
      isJsonValid = true;
    } catch (error) {
      console.error('Error formatting JSON:', error);
      
      // Show error
      if (editorElement) {
        editorElement.value = error instanceof Error ? error.message : String(error);
        editorElement.classList.add('json-error');
        isJsonValid = false;
      }
    }
  }

  /**
   * Handle input in editable mode
   */
  function handleEditorInput(event: Event): void {
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
      editorElement.value = formatJson(parsedJson);
      
      // Update syntax highlighting
      if (highlightElement) {
        highlightElement.innerHTML = formatJSONWithHighlighting(editorElement.value);
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
  }

  // Create the viewer
  createViewerElements();

  // Public interface
  return {
    setJson: (json: any) => {
      currentJson = json;
      updateContent();
    },
    getJson: () => currentJson,
    isValid: () => isJsonValid,
    getElement: () => editorElement
  };
}

/**
 * Create empty interface for when the container isn't found
 */
function createEmptyInterface(): JsonViewerInterface {
  return {
    setJson: () => {},
    getJson: () => ({}),
    isValid: () => false,
    getElement: () => null
  };
}