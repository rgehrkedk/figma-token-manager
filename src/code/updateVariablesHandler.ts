/**
 * updateVariablesHandler.ts
 * 
 * Enhanced handler for updating Figma variables from JSON data
 * Supports creating, updating, and renaming variables, groups, modes, and collections
 */

/**
 * Updates Figma variables based on JSON data
 * Creates variables if they don't exist and updates existing ones
 * @param jsonData The JSON data containing variable updates
 */
export async function handleUpdateVariables(jsonData: any): Promise<{success: boolean, error?: string, warnings?: string[], created?: number, updated?: number, collections?: number, modes?: number, renamed?: number, deleted?: number}> {
  try {
    console.log("Starting variable update process");
    
    // Validate the provided JSON data
    if (!jsonData || typeof jsonData !== 'object') {
      return {
        success: false,
        error: "Invalid JSON data provided"
      };
    }
    
    // Create deep copy of the JSON to avoid modifying the original
    const jsonDataCopy = JSON.parse(JSON.stringify(jsonData));
    
    // Get all collections in the document
    const collections = await figma.variables.getLocalVariableCollections();
    
    // Get all variables in the document
    const allVariables = figma.variables.getLocalVariables();
    
    // Tracking metrics
    let createdCount = 0;
    let updatedCount = 0;
    let collectionsCreated = 0;
    let modesCreated = 0;
    let renamedCount = 0;
    let deletedCount = 0;
    
    // Track warnings and errors
    const warnings: string[] = [];
    
    // Build a comprehensive map of all existing variables
    // This will be used for quick lookups during the update process
    const variableMap = new Map<string, Variable>();
    
    // Map variable IDs to names for reference resolution
    const variableIdToNameMap = new Map<string, string>();
    
    // Create variable maps for quick lookup
    allVariables.forEach(variable => {
      variableMap.set(variable.name.toLowerCase(), variable);
      variableIdToNameMap.set(variable.id, variable.name);
    });
    
    // Create a map of collection name to collection ID
    const collectionNameToIdMap = new Map<string, string>();
    collections.forEach(collection => {
      collectionNameToIdMap.set(collection.name.toLowerCase(), collection.id);
    });
    
    // Create a map of all modes in each collection
    const collectionModesMap = new Map<string, Map<string, string>>();
    collections.forEach(collection => {
      const modesMap = new Map<string, string>();
      collection.modes.forEach(mode => {
        modesMap.set(mode.name.toLowerCase(), mode.modeId);
      });
      collectionModesMap.set(collection.id, modesMap);
    });
    
    // Extract all variables from the JSON data
    // This helps us identify what should exist in the final state
    const jsonVariables = extractVariablesFromJson(jsonDataCopy);
    
    // First Phase: Process Collections and Modes
    // We need to ensure all collections and modes exist before processing variables
    const collectionProcessingResult = await processCollectionsAndModes(
      jsonDataCopy, 
      collections, 
      collectionModesMap
    );
    
    // Update our metrics
    collectionsCreated += collectionProcessingResult.collectionsCreated;
    modesCreated += collectionProcessingResult.modesCreated;
    renamedCount += collectionProcessingResult.renamedCount;
    warnings.push(...collectionProcessingResult.warnings);
    
    // Refresh collections and modes maps after creation/renaming
    const updatedCollections = await figma.variables.getLocalVariableCollections();
    
    // Rebuild collection maps
    collectionNameToIdMap.clear();
    updatedCollections.forEach(collection => {
      collectionNameToIdMap.set(collection.name.toLowerCase(), collection.id);
    });
    
    // Rebuild modes maps
    collectionModesMap.clear();
    updatedCollections.forEach(collection => {
      const modesMap = new Map<string, string>();
      collection.modes.forEach(mode => {
        modesMap.set(mode.name.toLowerCase(), mode.modeId);
      });
      collectionModesMap.set(collection.id, modesMap);
    });
    
    // Second Phase: Process Variables
    // Process all variables, creating, updating, or renaming as needed
    const { 
      created, 
      updated, 
      renamed, 
      processingWarnings 
    } = await processVariables(
      jsonDataCopy, 
      allVariables, 
      variableMap, 
      collectionNameToIdMap, 
      collectionModesMap,
      variableIdToNameMap
    );
    
    // Update our metrics
    createdCount += created;
    updatedCount += updated;
    renamedCount += renamed;
    warnings.push(...processingWarnings);
    
    // Third Phase: Process Deletions
    // Identify variables that exist in Figma but not in the JSON
    // and delete them if they belong to collections present in the JSON
    const {
      deleted,
      deletionWarnings
    } = await processVariableDeletions(
      jsonDataCopy,
      allVariables,
      jsonVariables,
      collectionNameToIdMap
    );
    
    // Update our metrics
    deletedCount = deleted;
    warnings.push(...deletionWarnings);
    
    // Return the result
    return {
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      created: createdCount,
      updated: updatedCount,
      collections: collectionsCreated,
      modes: modesCreated,
      renamed: renamedCount,
      deleted: deletedCount
    };
  } catch (error: unknown) {
    console.error("Error in handleUpdateVariables:", error);
    return {
      success: false,
      error: `Error updating variables: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Processes collections and modes in the JSON data
 * Creates collections and modes if they don't exist
 */
async function processCollectionsAndModes(
  jsonData: any,
  collections: VariableCollection[],
  collectionModesMap: Map<string, Map<string, string>>
): Promise<{ 
  collectionsCreated: number, 
  modesCreated: number, 
  renamedCount: number, 
  warnings: string[] 
}> {
  let collectionsCreated = 0;
  let modesCreated = 0;
  let renamedCount = 0;
  const warnings: string[] = [];
  
  // Process each top-level key as a potential collection
  for (const [collectionName, collectionData] of Object.entries(jsonData)) {
    try {
      if (!collectionData || typeof collectionData !== 'object') continue;
      
      // Try to find the collection
      const existingCollection = collections.find(c => 
        c.name.toLowerCase() === collectionName.toLowerCase()
      );
      
      let collection: VariableCollection;
      
      if (existingCollection) {
        // Use the existing collection
        collection = existingCollection;
      } else {
        // Create a new collection with a default mode
        collection = figma.variables.createVariableCollection(collectionName);
        collectionsCreated++;
        console.log(`Created collection: ${collectionName}`);
      }
      
      // Get the modes already in this collection
      const existingModes = collection.modes;
      const existingModeNames = new Set(existingModes.map(mode => mode.name.toLowerCase()));
      
      // Collect all second-level keys as potential modes
      const potentialModes = new Set<string>();
      
      Object.entries(collectionData).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          potentialModes.add(key);
        }
      });
      
      // Create any missing modes
      for (const modeName of potentialModes) {
        if (!existingModeNames.has(modeName.toLowerCase())) {
          try {
            // Add this mode to the collection
            collection.addMode(modeName);
            modesCreated++;
            console.log(`Created mode: ${modeName} in collection ${collectionName}`);
          } catch (error) {
            const errorMessage = `Failed to create mode ${modeName} in collection ${collectionName}: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMessage);
            warnings.push(errorMessage);
          }
        }
      }
    } catch (error) {
      const errorMessage = `Error processing collection ${collectionName}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      warnings.push(errorMessage);
    }
  }
  
  return { collectionsCreated, modesCreated, renamedCount, warnings };
}

/**
 * Processes all variables in the JSON data
 * Creates, updates, or renames variables as needed
 */
async function processVariables(
  jsonData: any,
  allVariables: Variable[],
  variableMap: Map<string, Variable>,
  collectionNameToIdMap: Map<string, string>,
  collectionModesMap: Map<string, Map<string, string>>,
  variableIdToNameMap: Map<string, string>
): Promise<{ 
  created: number, 
  updated: number, 
  renamed: number, 
  processingWarnings: string[] 
}> {
  let created = 0;
  let updated = 0;
  let renamed = 0;
  const processingWarnings: string[] = [];
  
  // Track which variables have been processed
  const processedVariableIds = new Set<string>();
  
  // Track variable renames for reference updating
  const renamedVariables = new Map<string, string>();
  
  // Process each collection
  for (const [collectionName, collectionData] of Object.entries(jsonData)) {
    try {
      if (!collectionData || typeof collectionData !== 'object') continue;
      
      // Get the collection ID
      const collectionId = collectionNameToIdMap.get(collectionName.toLowerCase());
      
      if (!collectionId) {
        processingWarnings.push(`Collection not found: ${collectionName}`);
        continue;
      }
      
      // Process each mode
      for (const [modeName, modeData] of Object.entries(collectionData)) {
        if (!modeData || typeof modeData !== 'object') continue;
        
        // Get the mode ID
        const modesMap = collectionModesMap.get(collectionId);
        if (!modesMap) {
          processingWarnings.push(`Modes map not found for collection: ${collectionName}`);
          continue;
        }
        
        const modeId = modesMap.get(modeName.toLowerCase());
        if (!modeId) {
          processingWarnings.push(`Mode not found: ${modeName} in collection ${collectionName}`);
          continue;
        }
        
        // Process variables in this mode
        const { 
          createdCount, 
          updatedCount, 
          renamedCount, 
          warnings,
          processedIds,
          renamedPaths
        } = await processVariablesInMode(
          modeData,
          collectionId,
          modeId,
          allVariables,
          variableMap,
          renamedVariables
        );
        
        // Update our metrics
        created += createdCount;
        updated += updatedCount;
        renamed += renamedCount;
        processingWarnings.push(...warnings);
        
        // Add processed variable IDs
        processedIds.forEach(id => processedVariableIds.add(id));
        
        // Update renamed variables map
        renamedPaths.forEach((newPath, oldPath) => 
          renamedVariables.set(oldPath, newPath)
        );
      }
    }
    catch (error) {
      const errorMessage = `Error processing collection ${collectionName}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      processingWarnings.push(errorMessage);
    }
  }
  
  return { 
    created, 
    updated, 
    renamed, 
    processingWarnings 
  };
}

/**
 * Process variables within a specific mode
 * Creates, updates, or renames variables as needed
 */
async function processVariablesInMode(
  modeData: any,
  collectionId: string,
  modeId: string,
  allVariables: Variable[],
  variableMap: Map<string, Variable>,
  renamedVariables: Map<string, string>,
  currentPath: string = ""
): Promise<{ 
  createdCount: number, 
  updatedCount: number, 
  renamedCount: number, 
  warnings: string[],
  processedIds: Set<string>,
  renamedPaths: Map<string, string>
}> {
  let createdCount = 0;
  let updatedCount = 0;
  let renamedCount = 0;
  const warnings: string[] = [];
  const processedIds = new Set<string>();
  const renamedPaths = new Map<string, string>();
  
  // Process all keys in the mode data
  for (const [key, value] of Object.entries(modeData)) {
    // Construct the full path for this key
    const fullPath = currentPath ? `${currentPath}/${key}` : key;
    
    // If this is a token definition with $value and $type
    if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
      try {
        // Process this token
        const result = await processToken(
          fullPath,
          value,
          collectionId,
          modeId,
          allVariables,
          variableMap,
          renamedVariables
        );
        
        // Update metrics
        if (result.action === 'created') createdCount++;
        if (result.action === 'updated') updatedCount++;
        if (result.action === 'renamed') {
          renamedCount++;
          renamedPaths.set(result.oldPath || "", fullPath);
        }
        
        // Add warnings
        if (result.warning) warnings.push(result.warning);
        
        // Mark this variable as processed
        if (result.variableId) processedIds.add(result.variableId);
      } catch (error) {
        const errorMessage = `Error processing token ${fullPath}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        warnings.push(errorMessage);
      }
    }
    // If this is a nested object (group), process it recursively
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Process recursively
      const { 
        createdCount: nestedCreated, 
        updatedCount: nestedUpdated, 
        renamedCount: nestedRenamed, 
        warnings: nestedWarnings,
        processedIds: nestedProcessedIds,
        renamedPaths: nestedRenamedPaths
      } = await processVariablesInMode(
        value,
        collectionId,
        modeId,
        allVariables,
        variableMap,
        renamedVariables,
        fullPath
      );
      
      // Update our metrics
      createdCount += nestedCreated;
      updatedCount += nestedUpdated;
      renamedCount += nestedRenamed;
      warnings.push(...nestedWarnings);
      
      // Add processed variable IDs
      nestedProcessedIds.forEach(id => processedIds.add(id));
      
      // Add renamed paths
      nestedRenamedPaths.forEach((newPath, oldPath) => 
        renamedPaths.set(oldPath, newPath)
      );
    }
  }
  
  return { 
    createdCount, 
    updatedCount, 
    renamedCount, 
    warnings,
    processedIds,
    renamedPaths
  };
}

/**
 * Process a single token
 * Creates, updates, or renames the variable as needed
 */
async function processToken(
  path: string,
  tokenData: any,
  collectionId: string,
  modeId: string,
  allVariables: Variable[],
  variableMap: Map<string, Variable>,
  renamedVariables: Map<string, string>
): Promise<{ 
  action: 'created' | 'updated' | 'renamed' | 'unchanged', 
  variableId?: string,
  oldPath?: string,
  warning?: string
}> {
  try {
    // Token type must be one of Figma's supported types
    const type = tokenData.$type;
    let variableType: VariableResolvedDataType;
    
    // Map token type to Figma variable type
    switch (type.toLowerCase()) {
      case 'color':
        variableType = 'COLOR';
        break;
      case 'number':
        variableType = 'FLOAT';
        break;
      case 'string':
        variableType = 'STRING';
        break;
      case 'boolean':
        variableType = 'BOOLEAN';
        break;
      default:
        return { 
          action: 'unchanged', 
          warning: `Unsupported variable type: ${type}` 
        };
    }
    
    // Get or create the variable
    const existingVariable = variableMap.get(path.toLowerCase());
    
    // If the variable exists and is already of the right type, update it
    let variable: Variable;
    let action: 'created' | 'updated' | 'renamed' | 'unchanged' = 'unchanged';
    let oldPath: string | undefined;
    
    if (existingVariable) {
      // Use the existing variable
      variable = existingVariable;
      
      // Check if the variable type matches
      if (existingVariable.resolvedType !== variableType) {
        return { 
          action: 'unchanged', 
          variableId: existingVariable.id,
          warning: `Type mismatch for variable ${path}. Expected ${variableType}, got ${existingVariable.resolvedType}.` 
        };
      }
      
      action = 'updated';
      console.log(`Updating variable: ${path}`);
    } else {
      // Create a new variable
      variable = figma.variables.createVariable(
        path,
        collectionId,
        variableType
      );
      
      action = 'created';
      console.log(`Created variable: ${path}`);
      
      // Add to map for future reference
      variableMap.set(path.toLowerCase(), variable);
    }
    
    // Process the token value
    // Handle different value types
    let processedValue: any;
    
    if (typeof tokenData.$value === 'string' && tokenData.$value.startsWith('{') && tokenData.$value.endsWith('}')) {
      // This is a reference to another variable
      processedValue = resolveReferenceToFigmaAlias(tokenData.$value);
      
      // If reference resolution failed, fall back to other types
      if (processedValue === null) {
        // Check if it's a color value
        if (type.toLowerCase() === 'color') {
          processedValue = parseColorValue(tokenData.$value);
        } else {
          // Use the string value directly
          processedValue = tokenData.$value;
        }
      }
    } else if (type.toLowerCase() === 'color') {
      // Process color value
      processedValue = parseColorValue(tokenData.$value);
    } else {
      // Use the value directly
      processedValue = tokenData.$value;
    }
    
    // Update the variable value
    variable.setValueForMode(modeId, processedValue);
    
    return { 
      action, 
      variableId: variable.id,
      oldPath
    };
  } catch (error) {
    return { 
      action: 'unchanged', 
      warning: `Error processing token ${path}: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Extracts all variable paths from JSON data
 */
function extractVariablesFromJson(jsonData: any): Set<string> {
  const variablePaths = new Set<string>();
  
  // Helper function to collect variable paths recursively
  function collectPaths(data: any, prefix: string = '') {
    if (!data || typeof data !== 'object') return;
    
    Object.entries(data).forEach(([key, value]) => {
      const path = prefix ? `${prefix}/${key}` : key;
      
      if (value && typeof value === 'object') {
        if ('$value' in value && '$type' in value) {
          // This is a token
          variablePaths.add(path);
        } else {
          // This is a group - process it recursively
          collectPaths(value, path);
        }
      }
    });
  }
  
  // Process each collection and mode
  Object.entries(jsonData).forEach(([collectionName, collectionData]) => {
    if (typeof collectionData === 'object' && collectionData !== null) {
      Object.entries(collectionData).forEach(([modeName, modeData]) => {
        if (typeof modeData === 'object' && modeData !== null) {
          collectPaths(modeData);
        }
      });
    }
  });
  
  return variablePaths;
}

/**
 * Parse a color value string to a Figma Color
 * Supports various color formats including hex, rgba, hsla
 */
function parseColorValue(colorValue: string): RGBA {
  try {
    // Remove all whitespace from the color value
    colorValue = colorValue.replace(/\s/g, '');
    
    // Check if this is a hex color
    if (colorValue.startsWith('#')) {
      return hexToRgba(colorValue);
    }
    
    // Check if this is an rgb/rgba color
    if (colorValue.startsWith('rgb')) {
      return parseRgba(colorValue);
    }
    
    // Check if this is an hsl/hsla color
    if (colorValue.startsWith('hsl')) {
      return parseHsla(colorValue);
    }
    
    // Default fallback for unknown formats
    console.warn(`Unrecognized color format: ${colorValue}`);
    return { r: 0, g: 0, b: 0, a: 1 }; // Default black
  } catch (error) {
    console.error(`Error parsing color value: ${colorValue}`, error);
    return { r: 0, g: 0, b: 0, a: 1 }; // Default black on error
  }
}

/**
 * Convert hex color string to RGBA
 */
function hexToRgba(hex: string): RGBA {
  try {
    // Remove leading hash if present
    hex = hex.replace(/^#/, '');
    
    // Parse alpha value
    let a = 1;
    
    // Check if hex has alpha channel
    if (hex.length === 8) {
      a = parseInt(hex.slice(6, 8), 16) / 255;
      hex = hex.slice(0, 6); // Remove alpha part
    } else if (hex.length === 4) {
      a = parseInt(hex.slice(3, 4).repeat(2), 16) / 255;
      hex = hex.slice(0, 3); // Remove alpha part
    }
    
    // Expand shorthand (3 digits) if needed
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // Parse RGB values
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    
    return { r, g, b, a };
  } catch (error) {
    console.error(`Error parsing hex color: ${hex}`, error);
    return { r: 0, g: 0, b: 0, a: 1 }; // Default black on error
  }
}

/**
 * Parse rgba/rgb color string to RGBA
 */
function parseRgba(rgba: string): RGBA {
  try {
    // Extract values from rgba(...) or rgb(...)
    const isRgba = rgba.startsWith('rgba');
    const parts = rgba
      .replace(isRgba ? 'rgba(' : 'rgb(', '')
      .replace(')', '')
      .split(',');
    
    // Parse RGB values (normalize to 0-1 range)
    const r = parseInt(parts[0], 10) / 255;
    const g = parseInt(parts[1], 10) / 255;
    const b = parseInt(parts[2], 10) / 255;
    
    // Parse alpha, default to 1 for rgb
    const a = isRgba ? parseFloat(parts[3]) : 1;
    
    return { r, g, b, a };
  } catch (error) {
    console.error(`Error parsing rgba color: ${rgba}`, error);
    return { r: 0, g: 0, b: 0, a: 1 }; // Default black on error
  }
}

/**
 * Parse hsla/hsl color string to RGBA
 */
function parseHsla(hsl: string): RGBA {
  try {
    // Extract values from hsla(...) or hsl(...)
    const isHsla = hsl.startsWith('hsla');
    const parts = hsl
      .replace(isHsla ? 'hsla(' : 'hsl(', '')
      .replace(')', '')
      .split(',');
    
    // Parse values
    const h = parseFloat(parts[0]); // Hue in degrees
    
    // Parse saturation and lightness (remove % if present)
    let s = parseFloat(parts[1].replace('%', '')) / 100;
    let l = parseFloat(parts[2].replace('%', '')) / 100;
    
    // Parse alpha, default to 1 for hsl
    const a = isHsla ? parseFloat(parts[3]) : 1;
    
    // Convert HSL to RGB
    let r, g, b;
    
    if (s === 0) {
      // Achromatic (gray)
      r = g = b = l;
    } else {
      // Helper function for HSL to RGB conversion
      const hueToRgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
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
 * Process variable deletions
 * Deletes variables that exist in Figma but not in the JSON
 * Only deletes variables within collections present in the JSON
 */
async function processVariableDeletions(
  jsonData: any,
  allVariables: Variable[],
  jsonVariables: Set<string>,
  collectionNameToIdMap: Map<string, string>
): Promise<{
  deleted: number,
  deletionWarnings: string[]
}> {
  let deleted = 0;
  const deletionWarnings: string[] = [];
  
  try {
    // Get set of collection IDs from the JSON data
    const jsonCollectionIds = new Set<string>();
    for (const collectionName of Object.keys(jsonData)) {
      const collectionId = collectionNameToIdMap.get(collectionName.toLowerCase());
      if (collectionId) {
        jsonCollectionIds.add(collectionId);
      }
    }
    
    // Process all variables in the document
    for (const variable of allVariables) {
      // Only consider variables in collections that are part of the JSON
      if (jsonCollectionIds.has(variable.variableCollectionId)) {
        // Check if this variable exists in the JSON
        if (!jsonVariables.has(variable.name.toLowerCase())) {
          try {
            // This variable is not in the JSON, so delete it
            variable.remove();
            deleted++;
            console.log(`Deleted variable: ${variable.name}`);
          } catch (error) {
            const errorMessage = `Failed to delete variable ${variable.name}: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMessage);
            deletionWarnings.push(errorMessage);
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = `Error processing variable deletions: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    deletionWarnings.push(errorMessage);
  }
  
  return { deleted, deletionWarnings };
}

/**
 * Resolves a reference string in the format {path.to.variable} to a Figma variable alias
 * Enhanced to handle both slash and dot notation
 * @param reference The reference string in the format {path.to.variable} or {path/to/variable}
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
      
      // Try a more flexible search - match by case-insensitive name
      const caseInsensitiveMatch = allVariables.find(v => 
        v.name.toLowerCase() === normalizedPath.toLowerCase()
      );
      
      if (caseInsensitiveMatch) {
        console.log(`Found case-insensitive match for ${normalizedPath}: ${caseInsensitiveMatch.name}`);
        return {
          type: 'VARIABLE_ALIAS',
          id: caseInsensitiveMatch.id
        };
      }
      
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