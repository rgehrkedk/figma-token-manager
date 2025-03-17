/**
 * inlinePrism.ts
 * 
 * Provides a minimal inline version of Prism.js for JSON syntax highlighting
 * This avoids the need to load from a CDN, which may be blocked in Figma
 * Modified to preserve editability
 */

// Simple line numbers implementation with a gutter div
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
  
  // Very basic JSON syntax highlighting with spans
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
   * Count the number of lines in a string
   */
  export function countLines(text: string): number {
    return text.split('\n').length;
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