/**
 * Utilities for formatting and transforming tokens
 */

/**
 * Prettifies JSON for display
 */
export function formatJson(json: any): string {
    return JSON.stringify(json, null, 2);
  }
  
  /**
   * Filters tokens based on selected collections and modes
   */
  export function filterTokens(
    tokenData: any, 
    selectedCollections: string[], 
    selectedModes: string[],
    flatStructure: boolean
  ): any {
    if (!tokenData || selectedCollections.length === 0 || selectedModes.length === 0) {
      return {};
    }
    
    const result: any = {};
    
    // Process each selected collection
    for (const collection of selectedCollections) {
      if (tokenData[collection]) {
        result[collection] = {};
        
        // Only include selected modes for this collection
        for (const mode of selectedModes) {
          if (tokenData[collection][mode]) {
            result[collection][mode] = tokenData[collection][mode];
          }
        }
        
        // Remove collection if it has no modes after filtering
        if (Object.keys(result[collection]).length === 0) {
          delete result[collection];
        }
      }
    }
    
    // If flat structure is requested, flatten the tokens
    if (flatStructure) {
      return flattenTokens(result);
    }
    
    return result;
  }
  
  /**
   * Flattens nested token structure
   */
  export function flattenTokens(tokens: any): any {
    const flatResult: any = {};
    
    function processCollection(collection: string, mode: string, path: string, obj: any) {
      for (const key in obj) {
        const newPath = path ? `${path}.${key}` : key;
        const value = obj[key];
        
        // If DTCG format and it has a $value field
        if (value && typeof value === 'object' && '$value' in value) {
          // Create the flattened key
          const flatKey = `${collection}.${mode}.${newPath}`;
          flatResult[flatKey] = {...value}; // Clone to avoid modifying original
        } 
        // If it's a nested object but not a token, recurse
        else if (value && typeof value === 'object' && !('$value' in value)) {
          processCollection(collection, mode, newPath, value);
        } 
        // For legacy format (direct values)
        else if (value !== undefined && value !== null && typeof value !== 'object') {
          const flatKey = `${collection}.${mode}.${newPath}`;
          flatResult[flatKey] = value;
        }
      }
    }
    
    // Process each collection and mode
    for (const collection in tokens) {
      for (const mode in tokens[collection]) {
        processCollection(collection, mode, '', tokens[collection][mode]);
      }
    }
    
    return flatResult;
  }
  
  /**
   * Gets individual files for separate export
   */
  export function getSeparateFiles(
    tokenData: any,
    selectedCollections: string[],
    selectedModes: string[],
    flatStructure: boolean
  ): { name: string, data: any }[] {
    const filteredData = filterTokens(tokenData, selectedCollections, selectedModes, flatStructure);
    const files: { name: string, data: any }[] = [];
    
    // If it's a flat structure, create one file per collection
    if (flatStructure) {
      // In a flat structure, group by collection and mode prefixes
      const prefixes = new Set<string>();
      for (const key in filteredData) {
        const parts = key.split('.');
        if (parts.length >= 2) {
          prefixes.add(`${parts[0]}.${parts[1]}`);
        }
      }
      
      for (const prefix of prefixes) {
        const [collection, mode] = prefix.split('.');
        const fileData: any = {};
        
        for (const key in filteredData) {
          if (key.startsWith(prefix)) {
            // Remove the prefix for cleaner structure
            const newKey = key.substring(prefix.length + 1);
            fileData[newKey] = filteredData[key];
          }
        }
        
        if (Object.keys(fileData).length > 0) {
          files.push({
            name: `${collection}-${mode}.json`,
            data: fileData
          });
        }
      }
    } else {
      // For nested structure, create one file per collection/mode
      for (const collection in filteredData) {
        for (const mode in filteredData[collection]) {
          files.push({
            name: `${collection}-${mode}.json`,
            data: { [collection]: { [mode]: filteredData[collection][mode] } }
          });
        }
      }
    }
    
    // Also add a combined file
    files.push({
      name: 'design-tokens-all.json',
      data: filteredData
    });
    
    return files;
  }