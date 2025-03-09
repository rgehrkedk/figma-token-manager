// Enhanced version with DTCG format compliance and improved reference handling

// Map Figma variable types to DTCG token types
function mapToDTCGType(figmaType: string, value: any): string {
  switch (figmaType) {
    case 'COLOR':
      return 'color';
    case 'FLOAT':
      // Heuristic - if the value ends with px, rem, em, etc., it's likely a dimension
      if (typeof value === 'number') {
        return 'number';
      } else if (typeof value === 'string' && 
                (value.endsWith('px') || value.endsWith('rem') || 
                 value.endsWith('em') || value.endsWith('%'))) {
        return 'dimension';
      }
      return 'number';
    case 'STRING':
      return 'string';
    case 'BOOLEAN':
      return 'boolean';
    default:
      // For unknown types, try to infer from value
      if (typeof value === 'number') {
        return 'number';
      } else if (typeof value === 'string') {
        // Try to detect if it's a dimension or color
        if (value.startsWith('#') || value.startsWith('rgb')) {
          return 'color';
        } else if (value.match(/\d+(\.\d+)?(px|rem|em|%)/)) {
          return 'dimension';
        } else if (value.startsWith('{') && value.endsWith('}')) {
          return 'reference'; // Specifically mark references
        }
        return 'string';
      } else if (typeof value === 'boolean') {
        return 'boolean';
      }
      return 'string'; // Default fallback
  }
}

// Helper to create a proper DTCG token object
function createDTCGToken(value: any, type: string, description: string = ''): any {
  const token: any = {
    $value: value,
    $type: type
  };
  
  if (description) {
    token.$description = description;
  }
  
  return token;
}

// Create a global variable to track reference paths for better validation
const globalReferencePaths = new Map<string, string>();

// Helper function to resolve variable references with path validation
function resolveVariableReference(reference: any, variables: Variable[], variableLookup: Map<string, string>): any {
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
        
        // Also add to global reference paths
        globalReferencePaths.set(reference.id, referencePath);
      }
      
      return `{${referencePath}}`;
    }
  }

  return reference;
}

// Function to properly format values based on their type for DTCG
function formatValueForDTCG(value: any, figmaType: string, variables: Variable[], variableLookup: Map<string, string>): any {
  if (value === null || value === undefined) {
    return null;
  }

  // Check if it's a reference and try to resolve it
  if (typeof value === 'object' && (value.type === 'VARIABLE_ALIAS' || value.type === 'VARIABLE_REFERENCE')) {
    return resolveVariableReference(value, variables, variableLookup);
  }

  // Handle RGBA colors
  if (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
    const r = Math.round(value.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(value.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(value.b * 255).toString(16).padStart(2, '0');
    
    if ('a' in value && value.a !== 1) {
      const a = Math.round(value.a * 255).toString(16).padStart(2, '0');
      return `#${r}${g}${b}${a}`;
    }
    
    return `#${r}${g}${b}`;
  }

  // For arrays and other objects, process them more carefully
  if (Array.isArray(value)) {
    return value.map(item => formatValueForDTCG(item, figmaType, variables, variableLookup));
  }

  if (typeof value === 'object' && value !== null) {
    // Handle special case of objects that should not be processed
    if (Object.keys(value).length === 0) {
      return "{}";
    }
    
    // Create a new object with formatted values
    const result: Record<string, any> = {};
    for (const key in value) {
      result[key] = formatValueForDTCG(value[key], figmaType, variables, variableLookup);
    }
    return result;
  }

  // Return primitives as is
  return value;
}

// Enhanced function to validate and fix all references in the token set
function validateAndFixReferences(tokens: any, referenceMap: Map<string, string>): { 
  tokens: any, 
  problems: { path: string, reference: string, message: string }[] 
} {
  const validatedTokens = JSON.parse(JSON.stringify(tokens)); // Deep clone
  const problems: { path: string, reference: string, message: string }[] = [];
  
  // Function to recursively check and fix references
  function processTokenObject(obj: any, path = ''): void {
    if (!obj || typeof obj !== 'object') return;
    
    // If it's an array, process each item
    if (Array.isArray(obj)) {
      obj.forEach(item => processTokenObject(item));
      return;
    }
    
    // Process each property in the object
    for (const key in obj) {
      const value = obj[key];
      const currentPath = path ? `${path}/${key}` : key;
      
      // Skip metadata keys that start with $ except $value
      if (key.startsWith('$') && key !== '$value') continue;
      
      // If this is a token object with $value that's a reference
      if (key === '$value' && typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        // Extract the reference path
        const refPath = value.substring(1, value.length - 1);
        
        // Check if this reference path exists in our token set
        if (!pathExistsInTokens(validatedTokens, refPath)) {
          console.warn(`Reference not found: ${refPath} at ${path}`);
          
          // Try to find an alternative reference from our map
          let fixed = false;
          for (const [id, mapPath] of referenceMap.entries()) {
            if (mapPath.endsWith(refPath) || refPath.endsWith(mapPath)) {
              const newRef = `{${mapPath}}`;
              console.log(`Replacing ${value} with ${newRef}`);
              obj[key] = newRef;
              fixed = true;
              break;
            }
          }
          
          // If we couldn't fix it, add to problems list
          if (!fixed) {
            problems.push({
              path: path,
              reference: refPath,
              message: `Reference '${refPath}' not found in tokens`
            });
          }
        }
        
        // Ensure the type is set to 'reference' for DTCG compliance
        if (obj.$type === undefined) {
          obj.$type = 'reference';
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        processTokenObject(value, currentPath);
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
  
  return { tokens: validatedTokens, problems };
}

// Function to extract all variables in DTCG format
async function extractDTCGVariables(): Promise<{
  tokens: any,
  validationProblems: { path: string, reference: string, message: string }[]
}> {
  try {
    console.log("Starting DTCG-compliant variable extraction");
    
    // Get all collections in the document
    const collections = await figma.variables.getLocalVariableCollections();
    console.log("Collections found:", collections.length);
    
    // Get all variables for reference resolution
    const allVariables = figma.variables.getLocalVariables();
    
    // Create a map to track variable references
    const variableLookup = new Map<string, string>();
    
    // Create a result structure
    const result: { [key: string]: any } = {};
    
    // Process each collection
    for (const collection of collections) {
      const collectionName = collection.name.toLowerCase();
      console.log("Processing collection:", collectionName);
      
      // Initialize collection in result
      result[collectionName] = {};
      
      // Get variables for this collection
      const variables = allVariables.filter(
        v => v.variableCollectionId === collection.id
      );
      
      console.log(`Found ${variables.length} variables in collection ${collectionName}`);
      
      // Process each mode in the collection
      for (const mode of collection.modes) {
        const modeName = mode.name;
        console.log(`Processing mode: ${modeName}`);
        
        // Initialize mode in result
        result[collectionName][modeName] = {};
        
        // Process each variable
        for (const variable of variables) {
          // Get value for this mode
          const valueForMode = variable.valuesByMode[mode.modeId];
          
          // Skip if no value for this mode
          if (valueForMode === undefined) continue;
          
          // Get variable path from name
          const pathParts = variable.name.split('/').filter(part => part.trim().length > 0);
          
          // Use 'base' as default if no path
          const path = pathParts.length > 0 ? pathParts : ['base'];
          
          // Format the value properly based on type
          const formattedValue = formatValueForDTCG(valueForMode, variable.resolvedType, allVariables, variableLookup);
          
          // Determine DTCG type - ensure every token has a type for DTCG compliance
          const dtcgType = mapToDTCGType(variable.resolvedType, formattedValue);
          
          // Create DTCG token object (without $original field)
          const tokenObj = createDTCGToken(formattedValue, dtcgType, '');
          
          // Build the nested structure for this variable
          let current = result[collectionName][modeName];
          
          // Navigate through the path parts except the last one
          for (let i = 0; i < path.length - 1; i++) {
            const part = path[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
          
          // Set the token object at the last path part
          const lastPart = path[path.length - 1];
          current[lastPart] = tokenObj;
        }
      }
    }
    
    // Validate and fix references
    console.log("Validating references...");
    const validationResult = validateAndFixReferences(result, variableLookup);
    
    console.log("DTCG-compliant extraction finished");
    
    // Return both the tokens and any validation problems
    return {
      tokens: validationResult.tokens,
      validationProblems: validationResult.problems
    };
  } catch (error) {
    console.error("Error in extractDTCGVariables:", error);
    throw error;
  }
}

// Show UI with larger size to see more info
figma.showUI(__html__, { width: 600, height: 700 });
console.log("Plugin UI shown");

// Flag to track if we should extract on startup
let shouldExtractOnStartup = true;

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  console.log("Plugin received message from UI:", msg.type);
  
  if (msg.type === 'ui-ready') {
    console.log("UI is ready, sending data");
    if (shouldExtractOnStartup) {
      // Only extract once
      shouldExtractOnStartup = false;
      
      try {
        const result = await extractDTCGVariables();
        console.log("Extracted DTCG-compliant tokens, sending to UI");
        console.log("Validation problems:", result.validationProblems.length);
        
        figma.ui.postMessage({
          type: 'tokens-data',
          data: result.tokens,
          validationProblems: result.validationProblems
        });
      } catch (error: unknown) {
        console.error("Error extracting tokens:", error);
        figma.ui.postMessage({
          type: 'error',
          message: `Error extracting tokens: ${error instanceof Error ? error.message : "Unknown error"}`
        });
      }
    }
  } else if (msg.type === 'extract-tokens') {
    try {
      const result = await extractDTCGVariables();
      console.log("Extracted tokens on demand, sending to UI");
      
      figma.ui.postMessage({
        type: 'tokens-data',
        data: result.tokens,
        validationProblems: result.validationProblems
      });
    } catch (error: unknown) {
      console.error("Error extracting tokens:", error);
      figma.ui.postMessage({
        type: 'error',
        message: `Error extracting tokens: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  } else if (msg.type === 'validate-references') {
    // Handle validation request from UI
    try {
      const result = await extractDTCGVariables();
      
      figma.ui.postMessage({
        type: 'validation-result',
        validationProblems: result.validationProblems
      });
    } catch (error: unknown) {
      console.error("Error validating references:", error);
      figma.ui.postMessage({
        type: 'error',
        message: `Error validating references: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};