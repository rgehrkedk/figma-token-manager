/**
 * updateVariablesHandler.ts
 * 
 * Handler for updating Figma variables from JSON data
 * Add this to the plugin code
 */

/**
 * Updates Figma variables based on JSON data
 * Creates variables if they don't exist and updates existing ones
 * @param jsonData The JSON data containing variable updates
 */
export async function handleUpdateVariables(jsonData: any): Promise<{success: boolean, error?: string, warnings?: string[], created?: number, updated?: number, collections?: number, modes?: number, renamed?: number}> {
  try {
    console.log("Starting variable update process");
    
    // Validate the provided JSON data
    if (!jsonData || typeof jsonData !== 'object') {
      return {
        success: false,
        error: "Invalid JSON data provided"
      };
    }
    
    // Get all collections in the document
    const collections = await figma.variables.getLocalVariableCollections();
    
    // Flag to track if we've processed anything
    let updatedAnyVariables = false;
    let createdCount = 0;
    let updatedCount = 0;
    let collectionsCreated = 0;
    let modesCreated = 0;
    let renamedCount = 0;
    
    // Track reference resolution errors
    const referenceErrors: string[] = [];
    const creationErrors: string[] = [];
    
    // Get collection names and preserve their order
    const collectionNames = Object.keys(jsonData);
    
    // Keep track of the original collection and mode names before any changes
    // This helps us detect renames
    const originalCollectionNames = collections.map(c => c.name.toLowerCase());
    const collectionModeMap = new Map<string, Set<string>>();
    
    // Build a map of existing modes for each collection
    collections.forEach(collection => {
      const modes = new Set<string>();
      collection.modes.forEach(mode => {
        modes.add(mode.name.toLowerCase());
      });
      collectionModeMap.set(collection.name.toLowerCase(), modes);
    });
    
    // Process each collection in the JSON data in order
    for (const collectionName of collectionNames) {
      console.log(`Processing collection: ${collectionName}`);
      
      // Find the matching collection in Figma
      let collection = collections.find(c => c.name.toLowerCase() === collectionName.toLowerCase());
      
      // If collection doesn't exist, check if it's a renamed collection
      if (!collection) {
        // Check if we need to rename a collection instead of creating one
        // If there are exactly the same number of collections in JSON as in Figma
        // and this is the first unmatched collection, it's likely a rename
        if (collectionNames.length === collections.length && collectionsCreated === 0) {
          // Find collections in Figma that don't match any collection in JSON
          const unmatchedFigmaCollections = collections.filter(c => 
            !collectionNames.some(jsonCollection => jsonCollection.toLowerCase() === c.name.toLowerCase())
          );
          
          // If there's exactly one unmatched collection, assume it was renamed
          if (unmatchedFigmaCollections.length === 1) {
            const oldCollection = unmatchedFigmaCollections[0];
            console.log(`Renaming collection: ${oldCollection.name} to ${collectionName}`);
            
            try {
              // Rename the collection
              oldCollection.name = collectionName;
              collection = oldCollection;
              renamedCount++;
            } catch (error) {
              console.error(`Error renaming collection ${oldCollection.name} to ${collectionName}:`, error);
              creationErrors.push(`Error renaming collection: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
        
        // If still no collection (not a rename), create it
        if (!collection) {
          console.log(`Creating new collection: ${collectionName}`);
          
          try {
            collection = figma.variables.createVariableCollection(collectionName);
            collectionsCreated++;
            
            // If this is the first collection, refresh the list
            if (collectionsCreated === 1) {
              // Refresh collections list
              collections.push(collection);
            }
          } catch (error) {
            console.error(`Error creating collection ${collectionName}:`, error);
            creationErrors.push(`Error creating collection ${collectionName}: ${error instanceof Error ? error.message : String(error)}`);
            continue;
          }
        }
      }
      
      // Get variables for this collection
      const variables = figma.variables.getLocalVariables().filter(
        v => v.variableCollectionId === collection.id
      );
      
      // Get the JSON data for this collection
      const collectionData = jsonData[collectionName];
      
      // Get mode names and preserve their order
      const modeNames = Object.keys(collectionData);
      
      // Process each mode in the collection in order
      for (const modeName of modeNames) {
        console.log(`Processing mode: ${modeName}`);
        
        // Find the matching mode in the collection
        let mode = collection.modes.find(m => m.name.toLowerCase() === modeName.toLowerCase());
        
        // If mode doesn't exist, check if it's a renamed mode
        if (!mode) {
          // Get the existing modes in this collection
          const existingModes = collection.modes;
          
          // Check if we need to rename a mode instead of creating one
          // If there are exactly the same number of modes in JSON as in Figma
          // and this is the first unmatched mode, it's likely a rename
          if (modeNames.length === existingModes.length && modesCreated === 0) {
            // Find modes in Figma that don't match any mode in JSON
            const unmatchedFigmaModes = existingModes.filter(m => 
              !modeNames.some(jsonMode => jsonMode.toLowerCase() === m.name.toLowerCase())
            );
            
            // If there's exactly one unmatched mode, assume it was renamed
            if (unmatchedFigmaModes.length === 1) {
              const oldMode = unmatchedFigmaModes[0];
              console.log(`Renaming mode: ${oldMode.name} to ${modeName}`);
              
              try {
                // Rename the mode
                collection.renameMode(oldMode.modeId, modeName);
                mode = collection.modes.find(m => m.modeId === oldMode.modeId);
                renamedCount++;
              } catch (error) {
                console.error(`Error renaming mode ${oldMode.name} to ${modeName}:`, error);
                creationErrors.push(`Error renaming mode: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
          }
          
          // If still no mode (not a rename), create it
          if (!mode) {
            console.log(`Creating new mode: ${modeName} in collection ${collectionName}`);
            
            try {
              // Add the mode to the collection
              const modeId = collection.addMode(modeName);
              modesCreated++;
              
              // Use the new mode
              mode = collection.modes.find(m => m.modeId === modeId);
              
              if (!mode) {
                throw new Error(`Failed to find newly created mode: ${modeName}`);
              }
            } catch (error) {
              console.error(`Error creating mode ${modeName} in collection ${collectionName}:`, error);
              creationErrors.push(`Error creating mode ${modeName}: ${error instanceof Error ? error.message : String(error)}`);
              continue;
            }
          }
        }
        
        // Get the JSON data for this mode
        const modeData = collectionData[modeName];
        
        // Process variables in this mode
        const updateResult = await updateVariablesInMode(
          variables, 
          modeData, 
          mode.modeId, 
          `${collectionName}.${modeName}`,
          collection.id  // Pass the collection ID for variable creation
        );
        
        updatedAnyVariables = updatedAnyVariables || updateResult.updated;
        updatedCount += updateResult.updatedCount || 0;
        createdCount += updateResult.createdCount || 0;
        
        // Collect reference errors
        if (updateResult.referenceErrors && updateResult.referenceErrors.length > 0) {
          referenceErrors.push(...updateResult.referenceErrors);
        }
      }
    }
    
    // Handle completion status
    if (!updatedAnyVariables && collectionsCreated === 0 && modesCreated === 0 && renamedCount === 0) {
      console.log("No variables, collections, or modes were updated, created, or renamed - possibly empty input");
      return { 
        success: true,
        error: "No variables, collections, or modes were updated, created, or renamed. The filter might be too restrictive or data is empty."
      };
    }
    
    // Combine all warnings
    const allWarnings = [...referenceErrors, ...creationErrors];
    
    // Handle warnings (still a success but with warnings)
    if (allWarnings.length > 0) {
      console.warn(`Operation completed with ${allWarnings.length} warnings`);
      
      // Group identical errors
      const uniqueWarnings = Array.from(new Set(allWarnings));
      
      // Return success but include warnings
      return { 
        success: true,
        warnings: uniqueWarnings,
        error: `Variables updated with ${uniqueWarnings.length} warning(s).`,
        created: createdCount,
        updated: updatedCount,
        collections: collectionsCreated,
        modes: modesCreated,
        renamed: renamedCount
      };
    }
    
    // Build a success message
    const successParts = [];
    if (createdCount > 0) successParts.push(`created ${createdCount} variables`);
    if (updatedCount > 0) successParts.push(`updated ${updatedCount} variables`);
    if (collectionsCreated > 0) successParts.push(`created ${collectionsCreated} collections`);
    if (modesCreated > 0) successParts.push(`created ${modesCreated} modes`);
    if (renamedCount > 0) successParts.push(`renamed ${renamedCount} collections/modes`);
    
    const successMessage = successParts.join(', ');
    console.log(`Variable update completed successfully: ${successMessage}`);
    
    return { 
      success: true,
      created: createdCount,
      updated: updatedCount,
      collections: collectionsCreated,
      modes: modesCreated,
      renamed: renamedCount
    };
  } catch (error) {
    console.error("Error updating variables:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error updating variables"
    };
  }
}

/**
 * Updates variables within a specific mode
 * @param variables Array of Figma variables
 * @param modeData JSON data for the mode
 * @param modeId The mode ID
 * @param path The current path (for nested objects)
 * @param currentPath The current JSON path for nested objects
 * @returns Object with information about update status
 */
async function updateVariablesInMode(
  variables: Variable[],
  modeData: any,
  modeId: string,
  path: string,
  currentPath: string = '',
  collectionId?: string
): Promise<{ updated: boolean, updatedCount: number, createdCount: number, referenceErrors?: string[] }> {
  let updated = false;
  let updatedCount = 0;
  let createdCount = 0;
  const referenceErrors: string[] = [];
  
  // Get all keys and sort them to maintain a consistent order
  // Sort tokens to ensure that referenced tokens are processed first
  const keys = Object.keys(modeData).sort((a, b) => {
    // Helper function to check if a key is a reference token
    const isReference = (key: string) => {
      const val = modeData[key];
      return val && 
             typeof val === 'object' && 
             val.$value !== undefined && 
             typeof val.$value === 'string' &&
             val.$value.startsWith('{') && 
             val.$value.endsWith('}');
    };
    
    // Handle nested paths - tokens with fewer nesting levels go first
    const aDepth = a.split('/').length;
    const bDepth = b.split('/').length;
    
    if (aDepth !== bDepth) return aDepth - bDepth;
    
    // If one is a reference and the other isn't, non-reference goes first
    const aIsRef = isReference(a);
    const bIsRef = isReference(b);
    
    if (aIsRef !== bIsRef) return aIsRef ? 1 : -1;
    
    // Default to alphabetical order
    return a.localeCompare(b);
  });
  
  // Process each property in the mode data
  for (const key of keys) {
    const value = modeData[key];
    const newPath = currentPath ? `${currentPath}/${key}` : key;
    
    // If this is a token object with $value and $type
    if (value && typeof value === 'object' && value.$value !== undefined) {
      // Find the matching variable
      const variableName = newPath;
      let variable = variables.find(v => v.name === variableName);
      
      try {
        // Check if this is a reference value
        const isReference = typeof value.$value === 'string' && 
                           value.$value.startsWith('{') && 
                           value.$value.endsWith('}');
        
        // Convert the value if needed
        const processedValue = processValueForFigma(value.$value, value.$type);
        
        // Handle null values from unresolved references
        if (processedValue === null && isReference) {
          console.warn(`Could not resolve reference for variable ${variableName}: ${value.$value}`);
          referenceErrors.push(`Could not resolve reference for ${variableName}: ${value.$value}`);
          // Skip setting the value if reference can't be resolved
          continue;
        }
        
        // If variable doesn't exist, create it
        if (!variable) {
          // Map DTCG type to Figma variable type
          const figmaType = mapDTCGTypeToFigmaType(value.$type);
          if (!figmaType) {
            console.error(`Invalid variable type: ${value.$type}`);
            referenceErrors.push(`Invalid variable type: ${value.$type}`);
            continue;
          }
          
          // Determine which collection ID to use
          let targetCollectionId: string;
          
          if (collectionId) {
            // Use the provided collection ID 
            targetCollectionId = collectionId;
          } else {
            // Extract the collection name from the path
            const extractedCollectionName = path.split('.')[0]; 
            
            // Find the collection by name
            const collections = figma.variables.getLocalVariableCollections();
            const collection = collections.find(c => c.name.toLowerCase() === extractedCollectionName.toLowerCase());
            
            if (!collection) {
              console.error(`Collection not found: ${extractedCollectionName}`);
              referenceErrors.push(`Collection not found: ${extractedCollectionName}`);
              continue;
            }
            
            targetCollectionId = collection.id;
          }
          
          // Create the variable
          console.log(`Creating new variable: ${variableName} of type ${figmaType}`);
          variable = figma.variables.createVariable(variableName, targetCollectionId, figmaType);
          
          // Add to the variables array so we can find it later
          variables.push(variable);
          
          // Increment creation counter (this is a new variable)
          createdCount++;
        }
        
        // Update the variable value for this mode
        await variable.setValueForMode(modeId, processedValue);
        
        if (isReference) {
          console.log(`${variable ? 'Updated' : 'Created'} variable with reference: ${variableName} → ${value.$value}`);
        } else {
          console.log(`${variable ? 'Updated' : 'Created'} variable: ${variableName}`);
        }
        
        updated = true;
        updatedCount++;
      } catch (error) {
        console.error(`Error updating/creating variable ${variableName}:`, error);
        referenceErrors.push(`Error with ${variableName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } 
    // If this is a nested object (not a token)
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively process nested objects
      const nestedResult = await updateVariablesInMode(variables, value, modeId, path, newPath, collectionId);
      updated = updated || nestedResult.updated;
      updatedCount += nestedResult.updatedCount;
      createdCount += nestedResult.createdCount;
      
      // Collect any reference errors from nested calls
      if (nestedResult.referenceErrors && nestedResult.referenceErrors.length > 0) {
        referenceErrors.push(...nestedResult.referenceErrors);
      }
    }
  }
  
  return { updated, updatedCount, createdCount, referenceErrors };
}

/**
 * Process a value for use in Figma
 * @param value The value to process
 * @param type The DTCG type of the value
 */
function processValueForFigma(value: any, type: string): any {
  switch (type) {
    case 'color':
      // Handle a color reference (string in {reference} format)
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return resolveReferenceToFigmaAlias(value);
      }
      return parseColorValue(value);
    
    case 'number':
      // Handle a number reference
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return resolveReferenceToFigmaAlias(value);
      }
      return typeof value === 'string' ? parseFloat(value) : value;
    
    case 'boolean':
      // Handle a boolean reference
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return resolveReferenceToFigmaAlias(value);
      }
      return Boolean(value);
    
    // Handle references to other variables
    case 'reference':
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return resolveReferenceToFigmaAlias(value);
      }
      return value;
    
    // Return other types as is, but still handle references
    default:
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return resolveReferenceToFigmaAlias(value);
      }
      return value;
  }
}

/**
 * Parse a color value to the format Figma expects
 * @param color The color value to parse
 */
function parseColorValue(color: string | object | null): any {
  // If it's null or undefined, return a default color
  if (color === null || color === undefined) {
    return { r: 0, g: 0, b: 0, a: 1 }; // Default black
  }
  
  // If it's already a Figma color object, return it
  if (typeof color === 'object' && color !== null && 'r' in color) {
    return color;
  }
  
  // If it's a hex color
  if (typeof color === 'string' && color.startsWith('#')) {
    return hexToRGBA(color);
  }
  
  // If it's an RGB/RGBA color
  if (typeof color === 'string' && (color.startsWith('rgb(') || color.startsWith('rgba('))) {
    return rgbStringToRGBA(color);
  }
  
  // If it's an HSL/HSLA color
  if (typeof color === 'string' && (color.startsWith('hsl(') || color.startsWith('hsla('))) {
    return hslStringToRGBA(color);
  }
  
  console.warn(`Unrecognized color format: ${color}`);
  // Return default color for other formats or invalid values
  return { r: 0, g: 0, b: 0, a: 1 }; // Default black
}

/**
 * Convert hex color to RGBA object
 * @param hex The hex color string
 */
function hexToRGBA(hex: string): { r: number, g: number, b: number, a: number } {
  try {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle shorthand hex (3 digits)
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // Handle shorthand hex with alpha (4 digits)
    if (hex.length === 4) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    
    // Handle hex with alpha (8 digits)
    let alpha = 1;
    if (hex.length === 8) {
      alpha = parseInt(hex.slice(6, 8), 16) / 255;
      hex = hex.substring(0, 6);
    }
    
    // Parse RGB values
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    
    // Validate the conversion produced valid numbers
    if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(alpha)) {
      console.warn(`Invalid hex color values in: #${hex}`);
      return { r: 0, g: 0, b: 0, a: 1 }; // Default black
    }
    
    return { r, g, b, a: alpha };
  } catch (error) {
    console.error(`Error parsing hex color: #${hex}`, error);
    return { r: 0, g: 0, b: 0, a: 1 }; // Default black on error
  }
}

/**
 * Convert RGB/RGBA string to RGBA object
 * @param rgb The RGB/RGBA color string
 */
function rgbStringToRGBA(rgb: string): { r: number, g: number, b: number, a: number } {
  try {
    // Try comma-separated format: rgb(R, G, B) or rgba(R, G, B, A)
    let match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d*\.?\d+))?\s*\)/);
    
    // If that fails, try modern format without commas: rgb(R G B / A)
    if (!match) {
      match = rgb.match(/rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*(\d*\.?\d+))?\s*\)/);
    }
    
    // If none of those match, try full flexible pattern
    if (!match) {
      match = rgb.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)(?:\s*[/, ]\s*(\d*\.?\d+))?\s*\)/);
    }
    
    if (!match) {
      console.warn(`Failed to parse RGB color: ${rgb}`);
      return { r: 0, g: 0, b: 0, a: 1 }; // Default black
    }
    
    const r = parseInt(match[1], 10) / 255;
    const g = parseInt(match[2], 10) / 255;
    const b = parseInt(match[3], 10) / 255;
    const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
    
    return { r, g, b, a };
  } catch (error) {
    console.error(`Error parsing RGB color: ${rgb}`, error);
    return { r: 0, g: 0, b: 0, a: 1 }; // Default black on error
  }
}

/**
 * Maps DTCG token type to Figma variable type
 * @param dtcgType DTCG token type
 * @returns Figma variable type or null if no mapping exists
 */
function mapDTCGTypeToFigmaType(dtcgType: string): 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' | null {
  switch (dtcgType.toLowerCase()) {
    case 'color':
      return 'COLOR';
    case 'number':
    case 'dimension':
    case 'spacing':
    case 'borderWidth':
    case 'borderRadius':
    case 'fontWeight':
    case 'lineHeight':
    case 'fontSizes':
    case 'size':
    case 'opacity':
      return 'FLOAT';
    case 'string':
    case 'fontFamily':
    case 'fontStyle':
    case 'textCase':
    case 'textDecoration':
    case 'duration':
    case 'letterSpacing':
      return 'STRING';
    case 'boolean':
      return 'BOOLEAN';
    default:
      // For unknown or custom types, make a best guess
      if (dtcgType.includes('color')) {
        return 'COLOR';
      } else if (dtcgType.includes('size') || dtcgType.includes('width') || dtcgType.includes('height')) {
        return 'FLOAT';
      }
      
      // Default to string for unknown types
      console.warn(`Unknown DTCG type "${dtcgType}" - defaulting to STRING`);
      return 'STRING';
  }
}

/**
 * Convert HSL/HSLA string to RGBA object
 * @param hsl The HSL/HSLA color string
 */
function hslStringToRGBA(hsl: string): { r: number, g: number, b: number, a: number } {
  try {
    // First, try to parse a common format: hsl(H, S%, L%)
    let match = hsl.match(/hsla?\(\s*(\d+)(?:deg)?\s*,\s*(\d+)(?:%)\s*,\s*(\d+)(?:%)\s*(?:,\s*(\d*\.?\d+))?\s*\)/);
    
    // If that fails, try modern format without commas: hsl(H S% L% / A)
    if (!match) {
      match = hsl.match(/hsla?\(\s*(\d+)(?:deg)?\s+(\d+)(?:%)\s+(\d+)(?:%)\s*(?:\/\s*(\d*\.?\d+))?\s*\)/);
    }
    
    // If none of those match, try full flexible pattern
    if (!match) {
      match = hsl.match(/hsla?\(\s*(\d+(?:\.\d+)?)(?:deg|rad|grad|turn)?\s*[, ]\s*(\d+(?:\.\d+)?)%?\s*[, ]\s*(\d+(?:\.\d+)?)%?(?:\s*[/, ]\s*(\d*\.?\d+))?\s*\)/);
    }
    
    if (!match) {
      console.warn(`Failed to parse HSL color: ${hsl}`);
      return { r: 0, g: 0, b: 0, a: 1 }; // Default black
    }
    
    const h = parseFloat(match[1]); // Hue (0-360)
    const s = parseFloat(match[2]) / 100; // Saturation (0-1)
    const l = parseFloat(match[3]) / 100; // Lightness (0-1)
    const a = match[4] !== undefined ? parseFloat(match[4]) : 1; // Alpha (0-1)
    
    // Convert HSL to RGB using a more accurate algorithm
    const hueToRgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    
    if (s === 0) {
      // Achromatic (gray)
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hueToRgb(p, q, (h / 360 + 1/3) % 1);
      g = hueToRgb(p, q, (h / 360) % 1);
      b = hueToRgb(p, q, (h / 360 - 1/3 + 1) % 1);
    }
    
    return { r, g, b, a };
  } catch (error) {
    console.error(`Error parsing HSL color: ${hsl}`, error);
    return { r: 0, g: 0, b: 0, a: 1 }; // Default black on error
  }
}

/**
 * Resolves a reference string in the format {path.to.variable} to a Figma variable alias
 * @param reference The reference string in the format {path.to.variable}
 * @returns A Figma variable alias object or the original value if reference cannot be resolved
 */
function resolveReferenceToFigmaAlias(reference: string): any {
  try {
    // Extract the reference path without curly braces
    const refPath = reference.substring(1, reference.length - 1);
    
    // Normalize path separators - support both dots and slashes
    const normalizedPath = refPath.replace(/\./g, '/');
    
    // Find the variable by name
    const allVariables = figma.variables.getLocalVariables();
    const referencedVariable = allVariables.find(v => v.name === normalizedPath);
    
    if (!referencedVariable) {
      console.warn(`Referenced variable not found: ${normalizedPath}`);
      return null; // Return null for invalid references
    }
    
    // Create a proper Figma variable alias reference
    return {
      type: 'VARIABLE_ALIAS',
      id: referencedVariable.id
    };
  } catch (error) {
    console.error('Error resolving reference to Figma alias:', error);
    return null; // Return null on error
  }
}