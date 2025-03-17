/**
 * prismLoader.ts
 * 
 * Dynamically loads Prism.js library for syntax highlighting
 * and handles initialization of syntax highlighting for JSON
 */

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