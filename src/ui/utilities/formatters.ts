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
      for (const mode in tokenData[collection]) {
        if (selectedModes.includes(mode)) {
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
  
  // If it's a flat structure, create one file per collection-mode pair
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

/**
 * Downloads a single JSON file
 */
export function downloadJson(data: any, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Downloads multiple files
 */
export function downloadMultipleFiles(
  files: { name: string, data: any }[],
  validationContent: HTMLElement,
  referenceValidationResults: HTMLElement
): void {
  // If only one file, download it directly
  if (files.length === 1) {
    downloadJson(files[0].data, files[0].name);
    return;
  }
  
  // Create a temporary link for each file
  const fileLinks = document.createElement('div');
  fileLinks.style.display = 'none';
  document.body.appendChild(fileLinks);
  
  let html = '<p>Multiple files are ready for download:</p><ul>';
  
  files.forEach((file, index) => {
    const jsonStr = JSON.stringify(file.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.textContent = `Download ${file.name}`;
    a.id = `download-link-${index}`;
    a.className = 'download-link';
    
    fileLinks.appendChild(a);
    
    html += `<li><a href="#" onclick="document.getElementById('download-link-${index}').click(); return false;">${file.name}</a></li>`;
  });
  
  html += '</ul>';
  
  // Show download links in validation panel
  validationContent.innerHTML = html;
  referenceValidationResults.style.display = 'block';
  
  // Auto-click the first download link
  const firstLink = fileLinks.querySelector('.download-link');
  if (firstLink) {
    (firstLink as HTMLAnchorElement).click();
  }
}