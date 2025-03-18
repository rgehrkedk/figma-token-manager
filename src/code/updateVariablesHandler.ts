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
    const jsonVariables = extractVariablesFromJson(jsonData);
    
    // First Phase: Process Collections and Modes
    // We need to ensure all collections and modes exist before processing variables
    const collectionProcessingResult = await processCollectionsAndModes(
      jsonData, 
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
      jsonData, 
      allVariables, 
      variableMap, 
      collectionNameToIdMap, 
      collectionModesMap, 
      updatedCollections
    );
    
    // Update our metrics
    createdCount = created;
    updatedCount = updated;
    renamedCount += renamed;
    warnings.push(...processingWarnings);
    
    // Third Phase: Handle Deletions (Optional)
    // By default, we don't delete variables automatically to prevent data loss
    // Instead, we'll identify variables that could be deleted but not actually delete them
    const variablesToDelete = identifyDeletableVariables(
      jsonVariables,
      allVariables,
      updatedCollections
    );
    
    // Build result message components
    const successParts = [];
    if (createdCount > 0) successParts.push(`created ${createdCount} variables`);
    if (updatedCount > 0) successParts.push(`updated ${updatedCount} variables`);
    if (collectionsCreated > 0) successParts.push(`created ${collectionsCreated} collections`);
    if (modesCreated > 0) successParts.push(`created ${modesCreated} modes`);
    if (renamedCount > 0) successParts.push(`renamed ${renamedCount} items`);
    if (deletedCount > 0) successParts.push(`deleted ${deletedCount} variables`);
    
    const successMessage = successParts.join(', ');
    console.log(`Variable update completed successfully: ${successMessage}`);
    
    // If nothing was processed, return a message
    if (createdCount === 0 && updatedCount === 0 && collectionsCreated === 0 && 
        modesCreated === 0 && renamedCount === 0 && deletedCount === 0) {
      return {
        success: true,
        error: "No variables, collections, or modes were updated. The provided data might be empty or already match the current state."
      };
    }
    
    // If there are warnings, include them in the response
    if (warnings.length > 0) {
      console.warn(`Operation completed with ${warnings.length} warnings`);
      const uniqueWarnings = Array.from(new Set(warnings));
      
      return {
        success: true,
        warnings: uniqueWarnings,
        error: `Variables updated with ${uniqueWarnings.length} warning(s).`,
        created: createdCount,
        updated: updatedCount,
        collections: collectionsCreated,
        modes: modesCreated,
        renamed: renamedCount,
        deleted: deletedCount
      };
    }
    
    // Return success result
    return {
      success: true,
      created: createdCount,
      updated: updatedCount,
      collections: collectionsCreated,
      modes: modesCreated,
      renamed: renamedCount,
      deleted: deletedCount
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
 * Process collections and modes from JSON data
 * Creates or renames collections and modes as needed
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
  
  // Track processed collection names to avoid duplicates
  const processedCollections = new Set<string>();
  
  // Get collection names from JSON
  const collectionNames = Object.keys(jsonData);
  
  // Process each collection in the JSON data
  for (const collectionName of collectionNames) {
    console.log(`Processing collection: ${collectionName}`);
    
    // Find the matching collection in Figma
    let collection = collections.find(c => 
      c.name.toLowerCase() === collectionName.toLowerCase()
    );
    
    // If collection doesn't exist, check if it's a renamed collection
    if (!collection) {
      // Look for a collection that should be renamed
      // We'll consider renaming collections that aren't matched in the JSON
      const unmatchedCollections = collections.filter(c => 
        !collectionNames.some(jsonCollection => 
          jsonCollection.toLowerCase() === c.name.toLowerCase()
        ) && !processedCollections.has(c.name.toLowerCase())
      );
      
      // If we have unmatched collections, rename the first one
      if (unmatchedCollections.length > 0) {
        const oldCollection = unmatchedCollections[0];
        console.log(`Renaming collection: ${oldCollection.name} to ${collectionName}`);
        
        try {
          // Rename the collection
          oldCollection.name = collectionName;
          collection = oldCollection;
          renamedCount++;
          
          // Mark as processed
          processedCollections.add(oldCollection.name.toLowerCase());
          processedCollections.add(collectionName.toLowerCase());
        } catch (error) {
          const errorMessage = `Error renaming collection ${oldCollection.name} to ${collectionName}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(errorMessage);
          warnings.push(errorMessage);
        }
      }
      
      // If still no collection (not a rename), create it
      if (!collection) {
        console.log(`Creating new collection: ${collectionName}`);
        
        try {
          collection = figma.variables.createVariableCollection(collectionName);
          collectionsCreated++;
          
          // Mark as processed
          processedCollections.add(collectionName.toLowerCase());
        } catch (error) {
          const errorMessage = `Error creating collection ${collectionName}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(errorMessage);
          warnings.push(errorMessage);
          continue;
        }
      }
    } else {
      // Mark existing collection as processed
      processedCollections.add(collectionName.toLowerCase());
    }
    
    // Process modes for this collection
    const collectionData = jsonData[collectionName];
    const modeNames = Object.keys(collectionData);
    
    // Track processed mode names for this collection
    const processedModes = new Set<string>();
    
    // Get current modes map for this collection
    const modesMap = collectionModesMap.get(collection.id) || new Map<string, string>();
    
    // Process each mode in the collection
    for (const modeName of modeNames) {
      console.log(`Processing mode: ${modeName} in collection ${collectionName}`);
      
      // Check if the mode already exists
      const modeExists = collection.modes.some(m => 
        m.name.toLowerCase() === modeName.toLowerCase()
      );
      
      // If mode doesn't exist, check if it should be renamed
      if (!modeExists) {
        // Find modes in Figma that haven't been processed and don't match any JSON mode
        const unmatchedModes = collection.modes.filter(m => 
          !modeNames.some(jsonMode => 
            jsonMode.toLowerCase() === m.name.toLowerCase()
          ) && !processedModes.has(m.name.toLowerCase())
        );
        
        // If we have unmatched modes, rename the first one
        if (unmatchedModes.length > 0) {
          const oldMode = unmatchedModes[0];
          console.log(`Renaming mode: ${oldMode.name} to ${modeName} in collection ${collectionName}`);
          
          try {
            // Rename the mode
            collection.renameMode(oldMode.modeId, modeName);
            renamedCount++;
            
            // Mark as processed
            processedModes.add(oldMode.name.toLowerCase());
            processedModes.add(modeName.toLowerCase());
          } catch (error) {
            const errorMessage = `Error renaming mode ${oldMode.name} to ${modeName}: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMessage);
            warnings.push(errorMessage);
          }
        } 
        // If not a rename, create the mode
        else {
          console.log(`Creating new mode: ${modeName} in collection ${collectionName}`);
          
          try {
            // Add the mode to the collection
            collection.addMode(modeName);
            modesCreated++;
            
            // Mark as processed
            processedModes.add(modeName.toLowerCase());
          } catch (error) {
            const errorMessage = `Error creating mode ${modeName} in collection ${collectionName}: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMessage);
            warnings.push(errorMessage);
          }
        }
      } else {
        // Mark existing mode as processed
        processedModes.add(modeName.toLowerCase());
      }
    }
  }
  
  return { 
    collectionsCreated, 
    modesCreated, 
    renamedCount, 
    warnings 
  };
}

/**
 * Process variables from JSON data
 * Creates, updates, or renames variables as needed
 */
async function processVariables(
  jsonData: any,
  allVariables: Variable[],
  variableMap: Map<string, Variable>,
  collectionNameToIdMap: Map<string, string>,
  collectionModesMap: Map<string, Map<string, string>>,
  collections: VariableCollection[]
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
  
  // Set to track all processed variable IDs
  const processedVariableIds = new Set<string>();
  
  // Track renamed variables to update our variable map
  const renamedVariables = new Map<string, string>(); // old name -> new name
  
  // Process each collection in the JSON data
  for (const [collectionName, collectionData] of Object.entries(jsonData)) {
    if (typeof collectionData !== 'object' || collectionData === null) {
      processingWarnings.push(`Invalid collection data for ${collectionName}`);
      continue;
    }
    
    // Get the collection ID
    const collectionId = collectionNameToIdMap.get(collectionName.toLowerCase());
    if (!collectionId) {
      processingWarnings.push(`Collection not found: ${collectionName}`);
      continue;
    }
    
    // Get the collection
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) {
      processingWarnings.push(`Collection not found with ID: ${collectionId}`);
      continue;
    }
    
    // Get modes for this collection
    const modesMap = collectionModesMap.get(collectionId);
    if (!modesMap || modesMap.size === 0) {
      processingWarnings.push(`No modes found for collection: ${collectionName}`);
      continue;
    }
    
    // Process each mode in the collection
    for (const [modeName, modeData] of Object.entries(collectionData)) {
      if (typeof modeData !== 'object' || modeData === null) {
        processingWarnings.push(`Invalid mode data for ${collectionName}.${modeName}`);
        continue;
      }
      
      // Get the mode ID
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
        renamedVariables,
        ""
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
      // Check if this is a group rename
      const potentialGroupRename = detectGroupRename(
        fullPath, 
        allVariables,
        variableMap,
        modeData
      );
      
      if (potentialGroupRename.isRename) {
        // Handle group rename
        const { renamedCount: groupRenamedCount, warnings: groupWarnings, processedIds: groupProcessedIds } =
          await handleGroupRename(
            potentialGroupRename.oldPath,
            fullPath,
            allVariables,
            processedIds
          );
        
        renamedCount += groupRenamedCount;
        warnings.push(...groupWarnings);
        groupProcessedIds.forEach(id => processedIds.add(id));
        
        // Add all old paths to renamed paths map
        if (potentialGroupRename.oldPath) {
          renamedPaths.set(potentialGroupRename.oldPath, fullPath);
        }
      }
      
      // Process nested objects recursively
      const nestedResult = await processVariablesInMode(
        value,
        collectionId,
        modeId,
        allVariables,
        variableMap,
        renamedVariables,
        fullPath
      );
      
      // Update metrics
      createdCount += nestedResult.createdCount;
      updatedCount += nestedResult.updatedCount;
      renamedCount += nestedResult.renamedCount;
      warnings.push(...nestedResult.warnings);
      
      // Add processed IDs
      nestedResult.processedIds.forEach(id => processedIds.add(id));
      
      // Add renamed paths
      nestedResult.renamedPaths.forEach((newPath, oldPath) => 
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
  variablePath: string,
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
  // Look for the variable by exact path
  let variable = variableMap.get(variablePath.toLowerCase());
  
  // If not found, check if it's a renamed variable
  let oldPath: string | undefined;
  let isRenamed = false;
  
  if (!variable) {
    // Try to find a matching variable using our renaming detection logic
    const match = findBestMatchForRename(
      variablePath, 
      allVariables, 
      variableMap,
      renamedVariables
    );
    
    if (match.variable) {
      variable = match.variable;
      oldPath = match.oldPath;
      isRenamed = true;
      console.log(`Found variable to rename: ${oldPath} → ${variablePath}`);
    }
  }
  
  try {
    // Get the Figma variable type from DTCG type
    const figmaType = mapDTCGTypeToFigmaType(tokenData.$type);
    if (!figmaType) {
      return { 
        action: 'unchanged', 
        warning: `Invalid variable type: ${tokenData.$type} for ${variablePath}` 
      };
    }
    
    // Process the value for Figma
    const processedValue = processValueForFigma(tokenData.$value, tokenData.$type);
    
    // If this is a reference that couldn't be resolved
    if (processedValue === null && 
        typeof tokenData.$value === 'string' && 
        tokenData.$value.startsWith('{') && 
        tokenData.$value.endsWith('}')) {
      return { 
        action: 'unchanged', 
        warning: `Could not resolve reference for ${variablePath}: ${tokenData.$value}` 
      };
    }
    
    // Create, rename, or update the variable
    if (!variable) {
      // Create a new variable
      console.log(`Creating new variable: ${variablePath} of type ${figmaType}`);
      variable = figma.variables.createVariable(variablePath, collectionId, figmaType);
      
      // Update description if provided
      if (tokenData.$description) {
        variable.description = tokenData.$description;
      }
      
      // Update scopes if provided
      if (tokenData.$scopes && Array.isArray(tokenData.$scopes)) {
        const validScopes = tokenData.$scopes.filter(scope => isValidVariableScope(scope));
        if (validScopes.length > 0) {
          variable.scopes = validScopes;
        }
      }
      
      // Set the value for this mode
      await variable.setValueForMode(modeId, processedValue);
      
      // Update our variable map
      variableMap.set(variablePath.toLowerCase(), variable);
      
      return { 
        action: 'created', 
        variableId: variable.id 
      };
    } else if (isRenamed) {
      // Handle renamed variable
      const originalName = variable.name;
      
      // Update the variable name
      variable.name = variablePath;
      console.log(`Renamed variable: ${originalName} → ${variablePath}`);
      
      // Update description if provided and different
      if (tokenData.$description && variable.description !== tokenData.$description) {
        variable.description = tokenData.$description;
      }
      
      // Update scopes if provided
      if (tokenData.$scopes && Array.isArray(tokenData.$scopes)) {
        const validScopes = tokenData.$scopes.filter(scope => isValidVariableScope(scope));
        if (validScopes.length > 0 && !arraysEqual(validScopes, variable.scopes)) {
          variable.scopes = validScopes;
        }
      }
      
      // Set the value for this mode
      await variable.setValueForMode(modeId, processedValue);
      
      // Update our variable maps
      variableMap.delete(originalName.toLowerCase());
      variableMap.set(variablePath.toLowerCase(), variable);
      
      return { 
        action: 'renamed', 
        variableId: variable.id,
        oldPath: originalName
      };
    } else {
      // Update existing variable
      let changed = false;
      
      // Update description if different
      if (tokenData.$description && variable.description !== tokenData.$description) {
        variable.description = tokenData.$description;
        changed = true;
      }
      
      // Update scopes if different
      if (tokenData.$scopes && Array.isArray(tokenData.$scopes)) {
        const validScopes = tokenData.$scopes.filter(scope => isValidVariableScope(scope));
        if (validScopes.length > 0 && !arraysEqual(validScopes, variable.scopes)) {
          variable.scopes = validScopes;
          changed = true;
        }
      }
      
      // Get current value for this mode
      const currentValue = variable.valuesByMode[modeId];
      
      // Check if we need to update the value
      // For complex values like colors, we need to do a deep comparison
      const needsValueUpdate = !areValuesEqual(currentValue, processedValue);
      
      if (needsValueUpdate) {
        await variable.setValueForMode(modeId, processedValue);
        changed = true;
      }
      
      return { 
        action: changed ? 'updated' : 'unchanged', 
        variableId: variable.id 
      };
    }
  } catch (error) {
    return { 
      action: 'unchanged', 
      warning: `Error processing ${variablePath}: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Detects if a group path represents a renamed group
 */
function detectGroupRename(
  groupPath: string,
  allVariables: Variable[],
  variableMap: Map<string, Variable>,
  modeData: any
): { 
  isRename: boolean, 
  oldPath?: string, 
  confidence: number 
} {
  // If the group path already exists, it's not a rename
  if (variableMap.has(groupPath.toLowerCase())) {
    return { isRename: false, confidence: 0 };
  }
  
  // Get all variables that might be in this group from the JSON
  const tokensInGroup = countTokensInGroup(modeData);
  
  // If there are no tokens in this group, it can't be a rename
  if (tokensInGroup === 0) {
    return { isRename: false, confidence: 0 };
  }
  
  // Find potential groups with similar structure
  const potentialGroups = findPotentialGroupMatches(groupPath, allVariables, tokensInGroup);
  
  // If we found a good match, return it
  if (potentialGroups.length > 0 && potentialGroups[0].confidence > 0.7) {
    return { 
      isRename: true, 
      oldPath: potentialGroups[0].path, 
      confidence: potentialGroups[0].confidence 
    };
  }
  
  return { isRename: false, confidence: 0 };
}

/**
 * Count the number of token definitions in a group
 */
function countTokensInGroup(groupData: any): number {
  let count = 0;
  
  // Count tokens directly in this group
  for (const [key, value] of Object.entries(groupData)) {
    if (value && typeof value === 'object') {
      if ('$value' in value && '$type' in value) {
        count++;
      } else {
        // Recursively count tokens in nested groups
        count += countTokensInGroup(value);
      }
    }
  }
  
  return count;
}

/**
 * Find potential group matches for a rename operation
 */
function findPotentialGroupMatches(
  groupPath: string, 
  allVariables: Variable[],
  tokenCount: number
): Array<{ path: string, confidence: number }> {
  // Group variables by their path prefix
  const groupedVariables = new Map<string, Variable[]>();
  
  allVariables.forEach(variable => {
    const parts = variable.name.split('/');
    if (parts.length > 1) {
      // For each possible prefix of the path
      for (let i = 1; i < parts.length; i++) {
        const prefix = parts.slice(0, i).join('/');
        if (!groupedVariables.has(prefix)) {
          groupedVariables.set(prefix, []);
        }
        groupedVariables.get(prefix)?.push(variable);
      }
    }
  });
  
  // Calculate similarity scores for each group
  const scores: Array<{ path: string, confidence: number }> = [];
  
  groupedVariables.forEach((groupVars, path) => {
    // Skip if this is the current path
    if (path === groupPath) return;
    
    // Calculate confidence based on token count similarity
    const countDifference = Math.abs(groupVars.length - tokenCount);
    let confidence = 1.0 - (countDifference / Math.max(groupVars.length, tokenCount));
    
    // Boost confidence for groups with similar token counts
    if (countDifference <= 1) {
      confidence += 0.2;
    }
    
    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);
    
    scores.push({ path, confidence });
  });
  
  // Sort by confidence descending
  return scores.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Handle renaming an entire group of variables
 */
async function handleGroupRename(
  oldPath: string | undefined,
  newPath: string,
  allVariables: Variable[],
  processedIds: Set<string>
): Promise<{ 
  renamedCount: number, 
  warnings: string[],
  processedIds: Set<string>
}> {
  let renamedCount = 0;
  const warnings: string[] = [];
  const newProcessedIds = new Set<string>();
  
  if (!oldPath) {
    return { renamedCount: 0, warnings: [], processedIds: new Set() };
  }
  
  // Find all variables in the old group
  const variablesInOldGroup = allVariables.filter(variable => 
    variable.name.startsWith(oldPath + '/')
  );
  
  // Rename each variable
  for (const variable of variablesInOldGroup) {
    try {
      // Get the relative path within the group
      const relativePath = variable.name.substring(oldPath.length + 1);
      
      // Construct the new variable name
      const newVariableName = `${newPath}/${relativePath}`;
      
      // Skip if this variable was already processed
      if (processedIds.has(variable.id)) {
        continue;
      }
      
      console.log(`Renaming group variable: ${variable.name} → ${newVariableName}`);
      
      // Update the variable name
      const originalName = variable.name;
      variable.name = newVariableName;
      
      renamedCount++;
      newProcessedIds.add(variable.id);
    } catch (error) {
      const errorMessage = `Error renaming variable in group: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      warnings.push(errorMessage);
    }
  }
  
  return { renamedCount, warnings, processedIds: newProcessedIds };
}

/**
 * Find the best match for a variable rename
 */
function findBestMatchForRename(
  variablePath: string,
  allVariables: Variable[],
  variableMap: Map<string, Variable>,
  renamedVariables: Map<string, string>
): { 
  variable?: Variable, 
  oldPath?: string, 
  confidence: number 
} {
  // Extract path parts
  const pathParts = variablePath.split('/');
  const variableName = pathParts[pathParts.length - 1];
  const groupPath = pathParts.slice(0, -1).join('/');
  
  // Strategy 1: Check for variables in the same group with similar names
  const variablesInSameGroup = allVariables.filter(v => {
    const parts = v.name.split('/');
    const vName = parts[parts.length - 1];
    const vGroupPath = parts.slice(0, -1).join('/');
    
    // Must be in the same path
    if (vGroupPath !== groupPath) return false;
    
    // Check if it's been processed in a rename
    if (renamedVariables.has(v.name.toLowerCase())) return false;
    
    // Names should be similar
    return areSimilarNames(vName, variableName);
  });
  
  if (variablesInSameGroup.length > 0) {
    return { 
      variable: variablesInSameGroup[0], 
      oldPath: variablesInSameGroup[0].name,
      confidence: 0.9 
    };
  }
  
  // Strategy 2: Look for exact base name matches across groups
  const variablesWithSameBaseName = allVariables.filter(v => {
    const parts = v.name.split('/');
    const vName = parts[parts.length - 1];
    
    // Check if it's been processed in a rename
    if (renamedVariables.has(v.name.toLowerCase())) return false;
    
    // Must have the exact same base name
    return vName === variableName;
  });
  
  if (variablesWithSameBaseName.length > 0) {
    return { 
      variable: variablesWithSameBaseName[0], 
      oldPath: variablesWithSameBaseName[0].name,
      confidence: 0.85 
    };
  }
  
  // Strategy 3: Look for variables with similar base names in different groups
  const variablesWithSimilarBaseNames = allVariables.filter(v => {
    const parts = v.name.split('/');
    const vName = parts[parts.length - 1];
    
    // Check if it's been processed in a rename
    if (renamedVariables.has(v.name.toLowerCase())) return false;
    
    // Must have a similar base name
    return areSimilarNames(vName, variableName);
  });
  
  if (variablesWithSimilarBaseNames.length > 0) {
    // Sort by similarity
    variablesWithSimilarBaseNames.sort((a, b) => {
      const aName = a.name.split('/').pop() || "";
      const bName = b.name.split('/').pop() || "";
      
      const aSimilarity = calculateNameSimilarity(aName, variableName);
      const bSimilarity = calculateNameSimilarity(bName, variableName);
      
      return bSimilarity - aSimilarity;
    });
    
    return { 
      variable: variablesWithSimilarBaseNames[0], 
      oldPath: variablesWithSimilarBaseNames[0].name,
      confidence: 0.7 
    };
  }
  
  return { confidence: 0 };
}

/**
 * Check if two names are similar enough to be considered a rename
 */
function areSimilarNames(name1: string, name2: string): boolean {
  // If one includes the other, they're similar
  if (name1.includes(name2) || name2.includes(name1)) {
    return true;
  }
  
  // For numeric tokens, be more flexible
  const isNumeric1 = /^\d+$/.test(name1);
  const isNumeric2 = /^\d+$/.test(name2);
  
  if (isNumeric1 && isNumeric2) {
    // For numeric names, consider them similar if they start with the same digit
    return name1.charAt(0) === name2.charAt(0);
  }
  
  // Calculate a similarity score
  const similarity = calculateNameSimilarity(name1, name2);
  return similarity > 0.6; // Threshold for similarity
}

/**
 * Calculate a similarity score between two names
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  // Simple similarity based on longest common substring
  let longestCommon = 0;
  const matrix = Array(name1.length + 1).fill(0).map(() => Array(name2.length + 1).fill(0));
  
  for (let i = 1; i <= name1.length; i++) {
    for (let j = 1; j <= name2.length; j++) {
      if (name1[i - 1] === name2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
        longestCommon = Math.max(longestCommon, matrix[i][j]);
      }
    }
  }
  
  // Calculate similarity score
  return longestCommon / Math.max(name1.length, name2.length);
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
 * Identifies variables that could be deleted but doesn't actually delete them
 */
function identifyDeletableVariables(
  jsonVariables: Set<string>,
  allVariables: Variable[],
  collections: VariableCollection[]
): Variable[] {
  // Get collections that appear in the JSON
  const jsonCollectionNames = new Set<string>();
  
  jsonVariables.forEach(path => {
    const parts = path.split('/');
    if (parts.length > 0) {
      // First path component would be in a collection
      jsonCollectionNames.add(parts[0].toLowerCase());
    }
  });
  
  // Filter collections that we care about
  const relevantCollectionIds = new Set<string>();
  
  collections.forEach(collection => {
    if (jsonCollectionNames.has(collection.name.toLowerCase())) {
      relevantCollectionIds.add(collection.id);
    }
  });
  
  // Find variables that are in relevant collections but not in the JSON
  const variablesToDelete = allVariables.filter(variable => {
    // Only consider variables in collections we care about
    if (!relevantCollectionIds.has(variable.variableCollectionId)) {
      return false;
    }
    
    // Check if this variable exists in the JSON
    return !jsonVariables.has(variable.name);
  });
  
  return variablesToDelete;
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
 * Check if a string is a valid VariableScope
 * @param scope The scope to check
 */
function isValidVariableScope(scope: string): boolean {
  const validScopes = [
    'ALL_SCOPES',
    'TEXT_CONTENT',
    'CORNER_RADIUS',
    'WIDTH_HEIGHT',
    'GAP',
    'ALL_FILLS',
    'FRAME_FILL',
    'SHAPE_FILL',
    'TEXT_FILL',
    'STROKE_COLOR',
    'STROKE_FLOAT',
    'EFFECT_FLOAT',
    'EFFECT_COLOR',
    'OPACITY',
    'FONT_FAMILY',
    'FONT_STYLE',
    'FONT_WEIGHT',
    'FONT_SIZE',
    'LINE_HEIGHT',
    'LETTER_SPACING',
    'PARAGRAPH_SPACING',
    'PARAGRAPH_INDENT'
  ];
  
  return validScopes.includes(scope);
}

/**
 * Compare two arrays for equality
 * @param a First array
 * @param b Second array
 */
function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  
  return true;
}

/**
 * Check if two values are equal, handling complex objects
 */
function areValuesEqual(value1: any, value2: any): boolean {
  // Handle null/undefined
  if (value1 === value2) return true;
  if (!value1 || !value2) return false;
  
  // Handle primitive types
  if (typeof value1 !== 'object' || typeof value2 !== 'object') {
    return value1 === value2;
  }
  
  // Handle color objects
  if ('r' in value1 && 'g' in value1 && 'b' in value1) {
    return Math.abs(value1.r - value2.r) < 0.001 &&
           Math.abs(value1.g - value2.g) < 0.001 &&
           Math.abs(value1.b - value2.b) < 0.001 &&
           Math.abs((value1.a || 1) - (value2.a || 1)) < 0.001;
  }
  
  // Handle variable alias references
  if (value1.type === 'VARIABLE_ALIAS' && value2.type === 'VARIABLE_ALIAS') {
    return value1.id === value2.id;
  }
  
  // For other objects, compare JSON strings
  return JSON.stringify(value1) === JSON.stringify(value2);
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