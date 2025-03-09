import { VariableLookup } from '../types';

/**
 * Resolves variable references with path validation
 */
export function resolveVariableReference(
  reference: any, 
  variables: Variable[], 
  variableLookup: VariableLookup
): any {
  if (!reference || typeof reference !== 'object') {
    return reference;
  }

  // Handle variable alias references
  if ((reference.type === 'VARIABLE_ALIAS' || reference.type === 'VARIABLE_REFERENCE') && reference.id) {
    const referencedVar = variables.find(v => v.id === reference.id);
    if (referencedVar) {
      // Return a reference string format with the full path
      const referencePath = referencedVar.name;
      
      // Cache this reference for later validation
      if (reference.id && referencePath) {
        variableLookup.set(reference.id, referencePath);
      }
      
      return `{${referencePath}}`;
    }
  }

  return reference;
}

/**
 * Validates and fixes all references in the token set
 */
export function validateAndFixReferences(tokens: any, referenceMap: VariableLookup): any {
  const validatedTokens = JSON.parse(JSON.stringify(tokens)); // Deep clone
  
  // Function to recursively check and fix references
  function processTokenObject(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    
    // If it's an array, process each item
    if (Array.isArray(obj)) {
      obj.forEach(item => processTokenObject(item));
      return;
    }
    
    // Process each property in the object
    for (const key in obj) {
      const value = obj[key];
      
      // Skip metadata keys that start with $ except $value
      if (key.startsWith('$') && key !== '$value') continue;
      
      // If this is a token object with $value that's a reference
      if (key === '$value' && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        // Extract the reference path
        const refPath = value.substring(1, value.length - 1);
        
        // Check if this reference path exists in our token set
        if (!pathExistsInTokens(validatedTokens, refPath)) {
          console.warn(`Reference not found: ${refPath}`);
          
          // Try to find an alternative reference from our map
          for (const [id, path] of referenceMap.entries()) {
            if (path.endsWith(refPath) || refPath.endsWith(path)) {
              const newRef = `{${path}}`;
              console.log(`Replacing ${value} with ${newRef}`);
              obj[key] = newRef;
              break;
            }
          }
        }
        
        // Ensure the type is set to 'reference' for DTCG compliance
        if (obj.$type === undefined) {
          obj.$type = 'reference';
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        processTokenObject(value);
      }
    }
  }
  
  // Helper to check if a path exists in the token structure
  function pathExistsInTokens(tokens: any, path: string): boolean {
    const parts = path.split('/');
    let current = tokens;
    
    for (const part of parts) {
      if (!current[part]) {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }
  
  // Start the validation process
  processTokenObject(validatedTokens);
  
  return validatedTokens;
}