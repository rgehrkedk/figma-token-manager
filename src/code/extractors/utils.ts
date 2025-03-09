/**
 * Utility functions for variable extraction
 */

/**
 * Returns a flattened representation of nested tokens
 */
export function flattenTokens(tokens: any, prefix: string = ''): Record<string, any> {
    const result: Record<string, any> = {};
    
    function processObject(obj: any, currentPath: string) {
      if (obj === null || typeof obj !== 'object') {
        result[currentPath] = obj;
        return;
      }
      
      // Special case for DTCG tokens
      if (obj.$value !== undefined && obj.$type !== undefined) {
        result[currentPath] = {...obj};
        return;
      }
      
      // Process nested objects
      for (const key in obj) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        processObject(obj[key], newPath);
      }
    }
    
    processObject(tokens, prefix);
    return result;
  }
  
  /**
   * Groups tokens by collection and mode
   */
  export function groupTokensByCollection(flatTokens: Record<string, any>): any {
    const result: any = {};
    
    for (const fullPath in flatTokens) {
      const parts = fullPath.split('.');
      if (parts.length < 2) continue;
      
      const [collection, mode, ...rest] = parts;
      const path = rest.join('.');
      const value = flatTokens[fullPath];
      
      // Initialize collection and mode if they don't exist
      if (!result[collection]) {
        result[collection] = {};
      }
      
      if (!result[collection][mode]) {
        result[collection][mode] = {};
      }
      
      // Set value at path
      let current = result[collection][mode];
      for (let i = 0; i < rest.length - 1; i++) {
        const part = rest[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      
      const lastPart = rest[rest.length - 1];
      current[lastPart] = value;
    }
    
    return result;
  }