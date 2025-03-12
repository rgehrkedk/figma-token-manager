/**
 * Utility functions for formatting token data
 */

/**
 * Format JSON with indentation
 */
export function formatJson(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return JSON.stringify({
      error: 'Error formatting JSON',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Filters tokens based on selected collections and modes
 */
export function filterTokens(
  tokenData: any, 
  selectedCollections: string[], 
  selectedModes: Map<string, string[]>,
  flatStructure: boolean
): any {
  if (!tokenData || selectedCollections.length === 0) {
    return {};
  }
  
  const result: any = {};
  
  // Process each selected collection
  for (const collection of selectedCollections) {
    if (tokenData[collection]) {
      result[collection] = {};
      
      // Get the modes selected for this specific collection
      const modesForCollection = selectedModes.get(collection) || [];
      
      // Only include selected modes for this collection
      for (const mode in tokenData[collection]) {
        if (modesForCollection.includes(mode)) {
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
 * Flatten the token structure for easier processing
 */
export function flattenTokens(tokenData: any): { [key: string]: any } {
  const flatTokens: { [key: string]: any } = {};
  
  function recurse(obj: any, currentPath: string) {
    if (!obj || typeof obj !== 'object') return;
    
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      // Fixed: Check if value is an object with a $value property
      if (value && typeof value === 'object' && !('$value' in value)) {
        recurse(value, newPath);
      } else {
        flatTokens[newPath] = value;
      }
    });
  }
  
  recurse(tokenData, '');
  return flatTokens;
}

/**
 * Gets individual files for separate export
 */
export function getSeparateFiles(
  tokenData: any,
  selectedCollections: string[],
  selectedModes: Map<string, string[]>,
  flatStructure: boolean
): { name: string, data: any }[] {
  const filteredData = filterTokens(tokenData, selectedCollections, selectedModes, flatStructure);
  const files: { name: string, data: any }[] = [];
  
  // If it's a flat structure, create one file per collection-mode pair
  if (flatStructure) {
    // In a flat structure, group by collection and mode prefixes
    // ...existing code...
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

/**
 * Get a short display version of a token path
 */
export function getShortTokenPath(path: string): string {
  const parts = path.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : path;
}

/**
 * Format a token value for display based on type
 */
export function formatTokenValue(value: any, type: string): string {
  if (value === null || value === undefined) return 'undefined';
  
  // Handle DTCG format
  if (typeof value === 'object' && value.$value !== undefined) {
    value = value.$value;
  }
  
  // Format based on type
  switch (type) {
    case 'color':
      return typeof value === 'string' ? value : JSON.stringify(value);
    case 'dimension':
      return typeof value === 'string' ? value : `${value}px`;
    case 'duration':
      return typeof value === 'string' ? value : `${value}ms`;
    case 'fontWeight':
      return String(value);
    default:
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
}

/**
 * Format tokens for CSS variables
 */
export function formatAsCssVariables(tokens: any): string {
  const flatTokens = flattenTokens(tokens);
  let css = ":root {\n";
  
  Object.entries(flatTokens).forEach(([path, value]) => {
    const variableName = path.replace(/\./g, '-');
    let formattedValue;
    
    if (value && typeof value === 'object') {
      if (value.$value !== undefined) {
        formattedValue = value.$value;
      } else {
        formattedValue = JSON.stringify(value);
      }
    } else {
      formattedValue = value;
    }
    
    css += `  --${variableName}: ${formattedValue};\n`;
  });
  
  css += "}\n";
  return css;
}

/**
 * Format tokens for SCSS variables
 */
export function formatAsScssVariables(tokens: any): string {
  const flatTokens = flattenTokens(tokens);
  let scss = "";
  
  Object.entries(flatTokens).forEach(([path, value]) => {
    const variableName = path.replace(/\./g, '-');
    let formattedValue;
    
    if (value && typeof value === 'object') {
      if (value.$value !== undefined) {
        formattedValue = value.$value;
      } else {
        formattedValue = JSON.stringify(value);
      }
    } else {
      formattedValue = value;
    }
    
    scss += `$${variableName}: ${formattedValue};\n`;
  });
  
  return scss;
}