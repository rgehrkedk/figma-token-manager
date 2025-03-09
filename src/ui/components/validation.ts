/**
 * Component for handling reference validation
 */

interface ReferenceError {
    path: string;
    reference: string;
    message: string;
  }
  
  /**
   * Validates references in token set
   */
  export function validateReferences(tokens: any): ReferenceError[] {
    const problems: ReferenceError[] = [];
    const references = new Map();
    
    // First pass: collect all token paths
    function collectPaths(obj: any, path = '') {
      if (!obj || typeof obj !== 'object') return;
      
      // Skip non-objects
      if (Array.isArray(obj)) return;
      
      // Check if this is a DTCG token
      if (obj.$value !== undefined) {
        references.set(path, obj.$value);
        return;
      }
      
      // Process nested objects
      for (const key in obj) {
        const newPath = path ? `${path}/${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null) {
          collectPaths(value, newPath);
        } else {
          // For legacy format with direct values
          references.set(newPath, value);
        }
      }
    }
    
    // Second pass: validate references
    function checkReferences(obj: any, path = '') {
      if (!obj || typeof obj !== 'object') return;
      
      // Skip non-objects and arrays
      if (Array.isArray(obj)) return;
      
      // If it's a DTCG token with a reference value
      if (obj.$value && typeof obj.$value === 'string' && 
          obj.$value.startsWith('{') && obj.$value.endsWith('}')) {
        
        const refPath = obj.$value.substring(1, obj.$value.length - 1);
        
        // Check if reference exists in our tokens
        let found = false;
        for (const [tokenPath, tokenValue] of references.entries()) {
          if (tokenPath === refPath || tokenPath.endsWith(`/${refPath}`)) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          problems.push({
            path: path,
            reference: refPath,
            message: `Reference '${refPath}' not found in tokens`
          });
        }
      }
      
      // Process nested objects
      for (const key in obj) {
        const newPath = path ? `${path}/${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null) {
          checkReferences(value, newPath);
        } 
        // For legacy format, check string references
        else if (typeof value === 'string' && 
                 value.startsWith('{') && value.endsWith('}')) {
          
          const refPath = value.substring(1, value.length - 1);
          
          // Check if reference exists in our tokens
          let found = false;
          for (const [tokenPath, tokenValue] of references.entries()) {
            if (tokenPath === refPath || tokenPath.endsWith(`/${refPath}`)) {
              found = true;
              break;
            }
          }
          
          if (!found) {
            problems.push({
              path: newPath,
              reference: refPath,
              message: `Reference '${refPath}' not found in tokens`
            });
          }
        }
      }
    }
    
    // Execute the validation
    for (const collection in tokens) {
      for (const mode in tokens[collection]) {
        collectPaths(tokens[collection][mode], `${collection}/${mode}`);
      }
    }
    
    for (const collection in tokens) {
      for (const mode in tokens[collection]) {
        checkReferences(tokens[collection][mode], `${collection}/${mode}`);
      }
    }
    
    return problems;
  }
  
  /**
   * Shows validation results in the UI
   */
  export function showValidationResults(
    referenceProblems: ReferenceError[],
    validationContent: HTMLElement,
    referenceValidationResults: HTMLElement
  ) {
    if (referenceProblems.length === 0) {
      validationContent.innerHTML = `<div class="success">All references are valid! Your tokens are ready to use with Style Dictionary.</div>`;
    } else {
      let html = `<div class="warning">Found ${referenceProblems.length} reference problems:</div><ul>`;
      
      for (const problem of referenceProblems) {
        html += `<li class="reference-problem">
                  Token at <strong>${problem.path}</strong> 
                  references <strong>${problem.reference}</strong> which cannot be resolved
                 </li>`;
      }
      
      html += '</ul>';
      
      html += `<div class="validation-tools">
                <p>Recommendations:</p>
                <ul>
                  <li>Try using the "Flat Structure" option for easier reference resolution</li>
                  <li>Check that all referenced tokens exist in the exported collections/modes</li>
                  <li>Consider simplifying your token structure for better compatibility</li>
                </ul>
              </div>`;
      
      validationContent.innerHTML = html;
    }
    
    referenceValidationResults.style.display = 'block';
  }