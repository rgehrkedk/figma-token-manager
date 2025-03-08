// Complete version to extract all variable data

// Function to extract all variables from the current document
async function extractVariables(): Promise<any> {
  try {
    console.log("Starting complete variable extraction");
    
    // Get all collections in the document
    const collections = await figma.variables.getLocalVariableCollections();
    console.log("Collections found:", collections.length);
    
    // Create a result structure
    const result: { [key: string]: any } = {};
    
    // Process each collection
    for (const collection of collections) {
      const collectionName = collection.name.toLowerCase();
      console.log("Processing collection:", collectionName);
      
      // Initialize collection in result
      result[collectionName] = {};
      
      // Get variables for this collection
      const variables = figma.variables.getLocalVariables().filter(
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
          
          // Get the value based on variable type
          let value: any = null;
          
          if (variable.resolvedType === 'COLOR') {
            // Handle color values
            try {
              const rgba = valueForMode as RGBA;
              if (rgba && typeof rgba.r === 'number') {
                // Convert RGBA to hex
                const r = Math.round(rgba.r * 255);
                const g = Math.round(rgba.g * 255);
                const b = Math.round(rgba.b * 255);
                value = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                
                // Add alpha if not fully opaque
                if (rgba.a !== 1) {
                  const a = Math.round(rgba.a * 255);
                  value += a.toString(16).padStart(2, '0');
                }
              } else {
                // Might be a reference to another variable
                value = String(valueForMode);
              }
            } catch (e) {
              value = String(valueForMode);
            }
          } else {
            // For other types, convert to appropriate format
            if (typeof valueForMode === 'object' && valueForMode !== null) {
              // If it's an object but not a simple value, stringify
              value = JSON.stringify(valueForMode);
            } else {
              // Otherwise use the value directly
              value = valueForMode;
            }
          }
          
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
          
          // Set the value at the last path part
          const lastPart = path[path.length - 1];
          current[lastPart] = value;
        }
      }
    }
    
    console.log("Complete extraction finished");
    return result;
  } catch (error) {
    console.error("Error in extractVariables:", error);
    throw error;
  }
}

// Show UI with larger size to see more info
figma.showUI(__html__, { width: 600, height: 600 });
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
        const tokens = await extractVariables();
        console.log("Extracted complete tokens, sending to UI");
        figma.ui.postMessage({
          type: 'tokens-data',
          data: tokens
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
      const tokens = await extractVariables();
      console.log("Extracted tokens on demand, sending to UI");
      figma.ui.postMessage({
        type: 'tokens-data',
        data: tokens
      });
    } catch (error: unknown) {
      console.error("Error extracting tokens:", error);
      figma.ui.postMessage({
        type: 'error',
        message: `Error extracting tokens: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};