/**
 * updateVariablesHandler.ts
 * 
 * Handler for updating Figma variables from JSON data
 * Add this to the plugin code
 */

/**
 * Updates Figma variables based on JSON data
 * Only updates variables explicitly defined in the JSON data
 * @param jsonData The JSON data containing variable updates
 */
export async function handleUpdateVariables(jsonData: any): Promise<{success: boolean, error?: string, warnings?: string[]}> {
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
    
    // Track reference resolution errors
    const referenceErrors: string[] = [];
    
    // Process each collection in the JSON data
    for (const collectionName in jsonData) {
      console.log(`Processing collection: ${collectionName}`);
      
      // Find the matching collection in Figma
      const collection = collections.find(c => c.name.toLowerCase() === collectionName.toLowerCase());
      
      if (!collection) {
        console.warn(`Collection not found: ${collectionName}`);
        continue;
      }
      
      // Get variables for this collection
      const variables = figma.variables.getLocalVariables().filter(
        v => v.variableCollectionId === collection.id
      );
      
      // Get the JSON data for this collection
      const collectionData = jsonData[collectionName];
      
      // Process each mode in the collection
      for (const modeName in collectionData) {
        console.log(`Processing mode: ${modeName}`);
        
        // Find the matching mode in the collection
        const mode = collection.modes.find(m => m.name.toLowerCase() === modeName.toLowerCase());
        
        if (!mode) {
          console.warn(`Mode not found: ${modeName} in collection ${collectionName}`);
          continue;
        }
        
        // Get the JSON data for this mode
        const modeData = collectionData[modeName];
        
        // Process variables in this mode
        const updateResult = await updateVariablesInMode(variables, modeData, mode.modeId, `${collectionName}.${modeName}`);
        updatedAnyVariables = updatedAnyVariables || updateResult.updated;
        
        // Collect reference errors
        if (updateResult.referenceErrors && updateResult.referenceErrors.length > 0) {
          referenceErrors.push(...updateResult.referenceErrors);
        }
      }
    }
    
    // Handle completion status
    if (!updatedAnyVariables) {
      console.log("No variables were updated - possibly empty input");
      return { 
        success: true,
        error: "No variables were updated. The filter might be too restrictive or data is empty."
      };
    }
    
    // Handle reference errors (still a success but with warnings)
    if (referenceErrors.length > 0) {
      console.warn(`Updated variables with ${referenceErrors.length} reference warnings`);
      
      // Group identical errors
      const uniqueErrors = Array.from(new Set(referenceErrors));
      
      // Return success but include warnings
      return { 
        success: true,
        warnings: uniqueErrors,
        error: `Variables updated with ${uniqueErrors.length} reference warning(s). Some references couldn't be resolved.`
      };
    }
    
    console.log("Variable update completed successfully");
    return { success: true };
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
  currentPath: string = ''
): Promise<{ updated: boolean, updatedCount: number, referenceErrors?: string[] }> {
  let updated = false;
  let updatedCount = 0;
  const referenceErrors: string[] = [];
  
  // Process each property in the mode data
  for (const key in modeData) {
    const value = modeData[key];
    const newPath = currentPath ? `${currentPath}/${key}` : key;
    
    // If this is a token object with $value and $type
    if (value && typeof value === 'object' && value.$value !== undefined) {
      // Find the matching variable
      const variableName = newPath;
      const variable = variables.find(v => v.name === variableName);
      
      if (variable) {
        // Update the variable value
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
          
          // Update the variable value for this mode
          await variable.setValueForMode(modeId, processedValue);
          
          if (isReference) {
            console.log(`Updated variable with reference: ${variableName} → ${value.$value}`);
          } else {
            console.log(`Updated variable: ${variableName}`);
          }
          
          updated = true;
          updatedCount++;
        } catch (error) {
          console.error(`Error updating variable ${variableName}:`, error);
          referenceErrors.push(`Error updating ${variableName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        console.warn(`Variable not found: ${variableName}`);
      }
    } 
    // If this is a nested object (not a token)
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively process nested objects
      const nestedResult = await updateVariablesInMode(variables, value, modeId, path, newPath);
      updated = updated || nestedResult.updated;
      updatedCount += nestedResult.updatedCount;
      
      // Collect any reference errors from nested calls
      if (nestedResult.referenceErrors && nestedResult.referenceErrors.length > 0) {
        referenceErrors.push(...nestedResult.referenceErrors);
      }
    }
  }
  
  return { updated, updatedCount, referenceErrors };
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