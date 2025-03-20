/**
 * syntaxHighlighter.ts
 * 
 * Provides syntax highlighting for code (primarily JSON) in two modes:
 * 1. Inline mode - for embedded highlighting without external dependencies
 * 2. Prism.js loader - for full syntax highlighting with external library
 * 
 * This combined module handles both approaches depending on requirements.
 */

// Simplified utility functions for JSON highlighting (inline mode)
/**
 * Count the number of lines in a string
 */
export function countLines(text: string): number {
  return text.split('\n').length;
}

/**
 * Creates a gutter element with line numbers
 */
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

/**
 * Basic inline JSON syntax highlighting with spans
 */
export function highlightJSON(code: string): string {
  // Replace with simple regex-based highlighting
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
 * Format and highlight JSON
 */
export function formatJSONWithHighlighting(json: any): string {
  try {
    // Format the JSON
    const formattedJSON = typeof json === 'string' 
      ? json 
      : JSON.stringify(json, null, 2);
    
    // Apply syntax highlighting
    const highlightedCode = highlightJSON(formattedJSON);
    
    // Return the highlighted code
    return highlightedCode;
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return String(error);
  }
}

// ===== Prism.js Loader for full syntax highlighting =====

// Import types for better TypeScript support
export interface PrismOptions {
  plugins?: string[];
  theme?: string;
  languages?: string[];
  lineNumbers?: boolean;
}

// Store Prism instance once loaded
let prismInstance: any = null;

/**
 * Dynamically load Prism.js library
 */
export function loadPrism(options: PrismOptions = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    // If already loaded, return the instance
    if (prismInstance) {
      resolve(prismInstance);
      return;
    }

    // Default options
    const defaultOptions: PrismOptions = {
      theme: 'prism',
      languages: ['json'],
      lineNumbers: true,
      plugins: ['line-numbers', 'normalize-whitespace']
    };

    // Merge with user options
    const finalOptions = { ...defaultOptions, ...options };

    // Create script elements for Prism core and plugins
    const prismCore = document.createElement('script');
    prismCore.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/prism.min.js';
    prismCore.async = true;

    // Create style elements for Prism theme and plugins
    const prismTheme = document.createElement('link');
    prismTheme.rel = 'stylesheet';
    prismTheme.href = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/themes/prism.min.css`;

    // Add line numbers CSS if enabled
    let lineNumbersStyle: HTMLLinkElement | null = null;
    if (finalOptions.lineNumbers) {
      lineNumbersStyle = document.createElement('link');
      lineNumbersStyle.rel = 'stylesheet';
      lineNumbersStyle.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/plugins/line-numbers/prism-line-numbers.min.css';
    }

    // Handle core script load event
    prismCore.onload = () => {
      // Load language support
      finalOptions.languages?.forEach(lang => {
        if (lang !== 'javascript' && lang !== 'js') { // These are included in core
          const script = document.createElement('script');
          script.src = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/components/prism-${lang}.min.js`;
          document.head.appendChild(script);
        }
      });

      // Load plugins
      finalOptions.plugins?.forEach(plugin => {
        const script = document.createElement('script');
        script.src = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/plugins/${plugin}/prism-${plugin}.min.js`;
        document.head.appendChild(script);
      });

      // Wait a small amount of time for plugins to load
      setTimeout(() => {
        prismInstance = (window as any).Prism;
        if (prismInstance) {
          resolve(prismInstance);
        } else {
          reject(new Error('Failed to load Prism.js'));
        }
      }, 200);
    };

    prismCore.onerror = () => {
      reject(new Error('Failed to load Prism.js core'));
    };

    // Add elements to the document
    document.head.appendChild(prismTheme);
    if (lineNumbersStyle) {
      document.head.appendChild(lineNumbersStyle);
    }
    document.head.appendChild(prismCore);
  });
}

/**
 * Apply syntax highlighting to a code element
 */
export function highlightElement(element: HTMLElement, language: string = 'json'): void {
  if (!prismInstance) {
    console.warn('Prism not loaded yet, queuing highlight');
    loadPrism().then(prism => {
      // Force line numbers class if needed
      if (element.parentElement && !element.parentElement.classList.contains('line-numbers')) {
        element.parentElement.classList.add('line-numbers');
      }
      prism.highlightElement(element);
    });
    return;
  }

  // Force line numbers class if needed
  if (element.parentElement && !element.parentElement.classList.contains('line-numbers')) {
    element.parentElement.classList.add('line-numbers');
  }
  
  // Set language class if not already set
  if (!element.classList.contains(`language-${language}`)) {
    element.classList.add(`language-${language}`);
  }
  
  // Highlight the element
  prismInstance.highlightElement(element);
}

/**
 * Highlight all code elements on the page
 */
export function highlightAll(): void {
  loadPrism().then(prism => {
    prism.highlightAll();
  });
}

/**
 * Initialize Prism for the application
 */
export async function initPrism(): Promise<void> {
  try {
    await loadPrism();
    console.log('Prism loaded successfully');
  } catch (error) {
    console.error('Failed to initialize Prism:', error);
  }
}