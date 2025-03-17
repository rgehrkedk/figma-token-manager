/**
 * updateVariablesHandler.ts
 * 
 * Handler for updating Figma variables from JSON data
 * Add this to the plugin code
 */

/**
 * Updates Figma variables based on JSON data
 * @param jsonData The JSON data containing variable updates
 */
export async function handleUpdateVariables(jsonData: any): Promise<{success: boolean, error?: string}> {
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
        await updateVariablesInMode(variables, modeData, mode.modeId, `${collectionName}.${modeName}`);
      }
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
 */
async function updateVariablesInMode(
  variables: Variable[],
  modeData: any,
  modeId: string,
  path: string,
  currentPath: string = ''
): Promise<void> {
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
          // Convert the value if needed
          const processedValue = processValueForFigma(value.$value, value.$type);
          
          // Update the variable value for this mode
          await variable.setValueForMode(modeId, processedValue);
          console.log(`Updated variable: ${variableName}`);
        } catch (error) {
          console.error(`Error updating variable ${variableName}:`, error);
        }
      } else {
        console.warn(`Variable not found: ${variableName}`);
      }
    } 
    // If this is a nested object (not a token)
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively process nested objects
      await updateVariablesInMode(variables, value, modeId, path, newPath);
    }
  }
}

/**
 * Process a value for use in Figma
 * @param value The value to process
 * @param type The DTCG type of the value
 */
function processValueForFigma(value: any, type: string): any {
  switch (type) {
    case 'color':
      return parseColorValue(value);
    
    case 'number':
      return typeof value === 'string' ? parseFloat(value) : value;
    
    case 'boolean':
      return Boolean(value);
    
    // Handle references to other variables
    case 'reference':
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        // This is a reference but for now we keep it as is
        // Actual variable references need to be handled within Figma's API
        return value;
      }
      return value;
    
    // Return other types as is
    default:
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
  
  // Return default color for other formats or invalid values
  return { r: 0, g: 0, b: 0, a: 1 }; // Default black
}

/**
 * Convert hex color to RGBA object
 * @param hex The hex color string
 */
function hexToRGBA(hex: string): { r: number, g: number, b: number, a: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle shorthand hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Handle hex with alpha
  let alpha = 1;
  if (hex.length === 8) {
    alpha = parseInt(hex.slice(6, 8), 16) / 255;
    hex = hex.substring(0, 6);
  }
  
  // Parse RGB values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  
  return { r, g, b, a: alpha };
}

/**
 * Convert RGB/RGBA string to RGBA object
 * @param rgb The RGB/RGBA color string
 */
function rgbStringToRGBA(rgb: string): { r: number, g: number, b: number, a: number } {
  // Extract values from rgb/rgba string
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
  
  if (!match) {
    return { r: 0, g: 0, b: 0, a: 1 }; // Default black
  }
  
  const r = parseInt(match[1], 10) / 255;
  const g = parseInt(match[2], 10) / 255;
  const b = parseInt(match[3], 10) / 255;
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
  
  return { r, g, b, a };
}