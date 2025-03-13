import { formatRGBAToHex, mapToDTCGType, createDTCGToken } from '../formatters/colorUtils';
import { resolveVariableReference, validateAndFixReferences, VariableLookup } from '../formatters/tokenResolver';
import { TokenData } from '../types';

/**
 * Function to properly format values based on their type for DTCG
 */
function formatValueForDTCG(
  value: any, 
  figmaType: string, 
  variables: Variable[], 
  variableLookup: VariableLookup
): any {
  if (value === null || value === undefined) {
    return null;
  }

  // Check if it's a reference and try to resolve it
  if (typeof value === 'object' && (value.type === 'VARIABLE_ALIAS' || value.type === 'VARIABLE_REFERENCE')) {
    return resolveVariableReference(value, variables, variableLookup);
  }

  // Handle RGBA colors
  if (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
    return formatRGBAToHex(value);
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

/**
 * Function to extract all variables in DTCG format
 */
export async function extractDTCGVariables(): Promise<TokenData> {
  try {
    console.log("Starting DTCG-compliant variable extraction");
    
    // Get all collections in the document
    const collections = await figma.variables.getLocalVariableCollections();
    console.log("Collections found:", collections.length);
    
    // Get all variables for reference resolution
    const allVariables = figma.variables.getLocalVariables();
    
    // Create a map to track variable references
    const variableLookup: VariableLookup = new Map<string, string>();
    
    // Create a result structure
    const result: TokenData = {};
    
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
          
          // Get variable path from name (convert to dots instead of slashes)
          const pathParts = variable.name.split('/').filter(part => part.trim().length > 0);
          
          // Use 'base' as default if no path
          const path = pathParts.length > 0 ? pathParts : ['base'];
          
          // Format the value properly based on type
          const formattedValue = formatValueForDTCG(valueForMode, variable.resolvedType, allVariables, variableLookup);
          
          // Determine DTCG type - ensure every token has a type for DTCG compliance
          const dtcgType = mapToDTCGType(variable.resolvedType, formattedValue);
          
          // Create DTCG token object
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
    const validatedResult = validateAndFixReferences(result, variableLookup);
    
    console.log("DTCG-compliant extraction finished");
    return validatedResult;
  } catch (error) {
    console.error("Error in extractDTCGVariables:", error);
    throw error;
  }
}