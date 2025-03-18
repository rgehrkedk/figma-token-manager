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
    
    // Flag to track if we've processed anything
    let updatedAnyVariables = false;
    let createdCount = 0;
    let updatedCount = 0;
    let collectionsCreated = 0;
    let modesCreated = 0;
    let renamedCount = 0;
    let deletedCount = 0;
    
    // Track reference resolution errors
    const referenceErrors: string[] = [];
    const creationErrors: string[] = [];
    
    // Track which variables we'll keep (from the JSON)
    const variablesToKeep = new Set<string>();
    
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
    
    // Collection variables and groups map
    const variablesMap = new Map<string, Map<string, Set<string>>>();
    
    // First, build a map of all variables in each collection
    // This helps us organize variables by collection and group
    for (const collection of collections) {
      const collectionVars = figma.variables.getLocalVariables().filter(
        v => v.variableCollectionId === collection.id
      );
      
      const groupsMap = new Map<string, Set<string>>();
      
      for (const variable of collectionVars) {
        // Extract group path from variable name
        const parts = variable.name.split('/');
        // Variable is directly in collection (no group)
        if (parts.length === 1) {
          if (!groupsMap.has('')) {
            groupsMap.set('', new Set());
          }
          groupsMap.get('')?.add(variable.name);
        } 
        // Variable is in a group
        else {
          const groupPath = parts.slice(0, parts.length - 1).join('/');
          const variableName = variable.name;
          if (!groupsMap.has(groupPath)) {
            groupsMap.set(groupPath, new Set());
          }
          groupsMap.get(groupPath)?.add(variableName);
        }
      }
      
      variablesMap.set(collection.name.toLowerCase(), groupsMap);
    }
    
    // Process each collection in the JSON data in order
    for (const collectionName of collectionNames) {
      console.log(`Processing collection: ${collectionName}`);
      
      // Find the matching collection in Figma
      let collection = collections.find(c => c.name.toLowerCase() === collectionName.toLowerCase());
      
      // If collection doesn't exist, check if it's a renamed collection
      if (!collection) {
        // Check for a collection that should be renamed
        // Look at all collections that haven't been processed yet
        const processedCollections = new Set();
        const unmatchedFigmaCollections = collections.filter(c => 
          !collectionNames.some(jsonCollection => 
            jsonCollection.toLowerCase() === c.name.toLowerCase()
          ) && !processedCollections.has(c.name.toLowerCase())
        );
        
        if (unmatchedFigmaCollections.length > 0) {
          // Find the first unprocessed collection to rename
          const oldCollection = unmatchedFigmaCollections[0];
          console.log(`Renaming collection: ${oldCollection.name} to ${collectionName}`);
          
          try {
            // Rename the collection
            oldCollection.name = collectionName;
            collection = oldCollection;
            renamedCount++;
            
            // Mark this collection as processed so we don't use it again
            processedCollections.add(oldCollection.name.toLowerCase());
            processedCollections.add(collectionName.toLowerCase());
            
            // Update our variables map with the new collection name
            if (variablesMap.has(oldCollection.name.toLowerCase())) {
              const groupsMap = variablesMap.get(oldCollection.name.toLowerCase());
              if (groupsMap) {
                variablesMap.delete(oldCollection.name.toLowerCase());
                variablesMap.set(collectionName.toLowerCase(), groupsMap);
              }
            }
          } catch (error) {
            console.error(`Error renaming collection ${oldCollection.name} to ${collectionName}:`, error);
            creationErrors.push(`Error renaming collection: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        
        // If still no collection (not a rename), create it
        if (!collection) {
          console.log(`Creating new collection: ${collectionName}`);
          
          try {
            collection = figma.variables.createVariableCollection(collectionName);
            collectionsCreated++;
            
            // Create an empty groups map for this collection
            variablesMap.set(collectionName.toLowerCase(), new Map());
            
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
          
          // Track processed modes to avoid duplicates
          const processedModes = new Set();
          
          // Find modes in Figma that haven't been processed and don't match any mode in JSON
          const unmatchedFigmaModes = existingModes.filter(m => 
            !modeNames.some(jsonMode => 
              jsonMode.toLowerCase() === m.name.toLowerCase()
            ) && !processedModes.has(m.name.toLowerCase())
          );
          
          // If there are unmatched modes, rename the first one
          if (unmatchedFigmaModes.length > 0) {
            const oldMode = unmatchedFigmaModes[0];
            console.log(`Renaming mode: ${oldMode.name} to ${modeName}`);
            
            try {
              // Rename the mode
              collection.renameMode(oldMode.modeId, modeName);
              mode = collection.modes.find(m => m.modeId === oldMode.modeId);
              renamedCount++;
              
              // Mark as processed
              processedModes.add(oldMode.name.toLowerCase());
              processedModes.add(modeName.toLowerCase());
            } catch (error) {
              console.error(`Error renaming mode ${oldMode.name} to ${modeName}:`, error);
              creationErrors.push(`Error renaming mode: ${error instanceof Error ? error.message : String(error)}`);
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
          collection.id,  // Pass the collection ID for variable creation
          variablesMap.get(collectionName.toLowerCase()) // Pass the groups map
        );
        
        updatedAnyVariables = updatedAnyVariables || updateResult.updated;
        updatedCount += updateResult.updatedCount || 0;
        createdCount += updateResult.createdCount || 0;
        
        // Collect reference errors
        if (updateResult.referenceErrors && updateResult.referenceErrors.length > 0) {
          referenceErrors.push(...updateResult.referenceErrors);
        }
        
        // No need to collect additional IDs anymore
      }
    }
    
    // Collect all variable paths that exist in the final JSON
    const variablePathsInJson = new Set<string>();
    
    // Helper function to collect variable paths from the JSON
    const collectVariablePaths = (data: any, prefix: string = '') => {
      if (!data || typeof data !== 'object') return;
      
      Object.entries(data).forEach(([key, value]) => {
        // Full path including this key
        const fullPath = prefix ? `${prefix}/${key}` : key;
        
        // If it's a token definition with $value and $type
        if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
          variablePathsInJson.add(fullPath);
        }
        // If it's a nested object, recursively process it
        else if (value && typeof value === 'object') {
          collectVariablePaths(value, fullPath);
        }
      });
    };
    
    // Process the entire JSON to get all variable paths
    Object.entries(jsonData).forEach(([collection, collectionData]) => {
      if (typeof collectionData === 'object') {
        Object.entries(collectionData).forEach(([mode, modeData]) => {
          collectVariablePaths(modeData, `${collection}/${mode}`);
        });
      }
    });
    
    console.log(`Found ${variablePathsInJson.size} variables in the JSON data`);
    
    // Get all variables from collections we care about
    const allVariables = figma.variables.getLocalVariables();
    const collectionsToProcess = new Set<string>();
    
    // Identify collections mentioned in the JSON
    collections.forEach(collection => {
      if (jsonData[collection.name]) {
        collectionsToProcess.add(collection.id);
      }
    });
    
    // IMPORTANT: Disable automatic deletion of variables
    // Instead of automatically deleting variables, we'll make this a user-driven action
    // to prevent accidental deletion
    const variablesToDelete: Variable[] = [];
    
    // Delete the variables
    for (const variable of variablesToDelete) {
      try {
        console.log(`Deleting variable: ${variable.name}`);
        variable.remove();
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting variable ${variable.name}:`, error);
        creationErrors.push(`Error deleting variable: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Handle completion status
    if (!updatedAnyVariables && collectionsCreated === 0 && modesCreated === 0 && renamedCount === 0 && deletedCount === 0) {
      console.log("No variables, collections, or modes were updated, created, renamed or deleted - possibly empty input");
      return { 
        success: true,
        error: "No variables, collections, or modes were updated, created, renamed or deleted. The filter might be too restrictive or data is empty."
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
        renamed: renamedCount,
        deleted: deletedCount
      };
    }
    
    // Build a success message
    const successParts = [];
    if (createdCount > 0) successParts.push(`created ${createdCount} variables`);
    if (updatedCount > 0) successParts.push(`updated ${updatedCount} variables`);
    if (collectionsCreated > 0) successParts.push(`created ${collectionsCreated} collections`);
    if (modesCreated > 0) successParts.push(`created ${modesCreated} modes`);
    if (renamedCount > 0) successParts.push(`renamed ${renamedCount} items`);
    
    const successMessage = successParts.join(', ');
    console.log(`Variable update completed successfully: ${successMessage}`);
    
    return { 
      success: true,
      created: createdCount,
      updated: updatedCount,
      collections: collectionsCreated,
      modes: modesCreated,
      renamed: renamedCount,
      deleted: 0 // Auto-deletion is now disabled
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
 * Enhanced to handle variable groups properly
 * @param variables Array of Figma variables
 * @param modeData JSON data for the mode
 * @param modeId The mode ID
 * @param path The current path (for nested objects)
 * @param currentPath The current JSON path for nested objects
 * @param collectionId Collection ID for variable creation
 * @param groupsMap Map of groups to variables in the collection
 * @returns Object with information about update status
 */
async function updateVariablesInMode(
  variables: Variable[],
  modeData: any,
  modeId: string,
  path: string,
  collectionId?: string,
  groupsMap?: Map<string, Set<string>>,
  currentPath: string = ''
): Promise<{ updated: boolean, updatedCount: number, createdCount: number, referenceErrors?: string[], processedVariableIds?: Set<string> }> {
  let updated = false;
  let updatedCount = 0;
  let createdCount = 0;
  const referenceErrors: string[] = [];
  // Track processed variables to identify deleted ones later
  const processedVariableIds = new Set<string>();
  
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
  
  // Check if this is a group renaming scenario
  // We need to detect if an entire group was renamed by looking at the structure
  const isGroupRename = currentPath && modeData && typeof modeData === 'object';
  
  if (isGroupRename) {
    // Identify potential group renamings
    const possibleOldGroups = new Set<string>();
    
    // Get all variables that might be part of a group
    const variableGroups = new Map<string, Variable[]>();
    
    // Group variables by their parent group path
    variables.forEach(v => {
      const parts = v.name.split('/');
      if (parts.length > 1) {
        const groupPath = parts.slice(0, -1).join('/');
        if (!variableGroups.has(groupPath)) {
          variableGroups.set(groupPath, []);
        }
        variableGroups.get(groupPath)?.push(v);
      }
    });
    
    // Find groups that might have been renamed
    const currentGroupPath = currentPath;
    
    // Check if we can find a matching group
    let matchingOldGroup = '';
    let matchingOldGroupVars: Variable[] = [];
    
    // Look for potential old group paths that might be a match
    // We consider it a match if:
    // 1. The group isn't already in use as a currentPath
    // 2. The group has a similar structure to the current group
    for (const [groupPath, groupVars] of variableGroups.entries()) {
      // Skip if this group matches the current path (not renamed)
      if (groupPath === currentGroupPath) continue;
      
      // Check if this group is a good candidate (similar number of variables)
      const tokensInNewGroup = Object.keys(modeData).filter(
        k => modeData[k] && typeof modeData[k] === 'object' && modeData[k].$value !== undefined
      ).length;
      
      // Similar number of variables indicates potential match
      if (Math.abs(groupVars.length - tokensInNewGroup) <= 1) {
        // We found a potential match
        matchingOldGroup = groupPath;
        matchingOldGroupVars = groupVars;
        break;
      }
    }
    
    // If we found a matching old group, handle group renaming
    if (matchingOldGroup && matchingOldGroupVars.length > 0) {
      console.log(`Detected group rename: ${matchingOldGroup} -> ${currentGroupPath}`);
      
      // For each variable in the old group, rename it to the new group
      for (const oldVar of matchingOldGroupVars) {
        const oldParts = oldVar.name.split('/');
        const baseName = oldParts[oldParts.length - 1];
        const newVarName = `${currentGroupPath}/${baseName}`;
        
        console.log(`Renaming group variable: ${oldVar.name} -> ${newVarName}`);
        
        try {
          // Update the variable name
          oldVar.name = newVarName;
          
          // Mark this variable as processed to prevent deletion
          processedVariableIds.add(oldVar.id);
        } catch (error) {
          console.error(`Error renaming variable in group: ${error}`);
          referenceErrors.push(`Error renaming variable in group: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }
  
  // Process each property in the mode data
  for (const key of keys) {
    const value = modeData[key];
    const newPath = currentPath ? `${currentPath}/${key}` : key;
    
    // If this is a token object with $value and $type
    if (value && typeof value === 'object' && value.$value !== undefined) {
      // Find the matching variable - first by exact name
      const variableName = newPath;
      let variable = variables.find(v => v.name === variableName);
      
      // If not found, check if it's a renamed variable by looking at the path structure
      // and comparing segments to find likely matches
      let isRenamed = false;
      if (!variable) {
        const nameParts = variableName.split('/');
        const variableBaseName = nameParts[nameParts.length - 1]; // Last part is the base name
        const variablePath = nameParts.slice(0, -1).join('/'); // Path without the base name
        
        // STEP 1: First, try to find variables in the same group with similar names
        // This helps with small token name changes like "50" to "502"
        const variablesInSameGroup = variables.filter(v => {
          const parts = v.name.split('/');
          const vPath = parts.slice(0, -1).join('/');
          const vBaseName = parts[parts.length - 1];
          
          // Must be in the same path
          if (vPath !== variablePath) return false;
          
          // Names should be similar (one includes the other)
          // This catches cases like "50" vs "502", "primary" vs "primary2", etc.
          if (vBaseName.includes(variableBaseName) || variableBaseName.includes(vBaseName)) {
            return true;
          }
          
          // For number-only renames, try to be even more flexible
          const isNumericSource = /^\d+$/.test(variableBaseName);
          const isNumericTarget = /^\d+$/.test(vBaseName);
          
          if (isNumericSource && isNumericTarget) {
            // For numeric renames, consider them similar if they start with the same digit
            // (e.g., "50" and "500" both start with "5")
            return variableBaseName.charAt(0) === vBaseName.charAt(0);
          }
          
          return false;
        });
        
        // If we found similar variables in the same group, use the first one
        if (variablesInSameGroup.length > 0) {
          console.log(`Found similar variable in same group: ${variablesInSameGroup[0].name} → ${variableName}`);
          variable = variablesInSameGroup[0];
          isRenamed = true;
          processedVariableIds.add(variable.id);
        }
        
        // STEP 2: If same group matching didn't work, try exact base name matches across groups
        if (!variable) {
          // Look for variables with the exact same base name anywhere
          const variablesWithSameBaseName = variables.filter(v => {
            const parts = v.name.split('/');
            const baseName = parts[parts.length - 1];
            return baseName === variableBaseName;
          });
          
          // If we found variables with the same base name, check for unmatched ones
          if (variablesWithSameBaseName.length > 0) {
            // Find variables that don't match any other token in the current data
            const matchedVariables = new Set<string>();
            
            // Collect all variable paths that are already matched
            Object.keys(modeData).forEach(k => {
              if (k === key) return; // Skip the current key
              const v = modeData[k];
              if (v && typeof v === 'object' && v.$value !== undefined) {
                const path = currentPath ? `${currentPath}/${k}` : k;
                matchedVariables.add(path);
              }
            });
            
            // Find unmatched variables
            const unmatchedVariables = variablesWithSameBaseName.filter(v => 
              !Array.from(matchedVariables).some(path => path === v.name)
            );
            
            if (unmatchedVariables.length > 0) {
              // Use the first unmatched variable as the one to rename
              variable = unmatchedVariables[0];
              isRenamed = true;
              console.log(`Renaming variable: ${variable.name} to ${variableName}`);
              
              // Mark this variable as processed to prevent deletion
              processedVariableIds.add(variable.id);
            }
          }
        }
      }
      
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
        
        // Handle variable creation or renaming
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
        } else if (isRenamed) {
          // Handle renamed variable - we need to rename the existing variable
          const oldName = variable.name;
          
          try {
            // Update the variable name
            variable.name = variableName;
            console.log(`Renamed variable: ${oldName} to ${variableName}`);
          } catch (error) {
            console.error(`Error renaming variable ${oldName} to ${variableName}:`, error);
            referenceErrors.push(`Error renaming variable: ${error instanceof Error ? error.message : String(error)}`);
          }
          
          // Add the variable to the groups map if provided
          if (groupsMap) {
            // Extract group path
            const parts = variableName.split('/');
            if (parts.length > 1) {
              const groupPath = parts.slice(0, parts.length - 1).join('/');
              if (!groupsMap.has(groupPath)) {
                groupsMap.set(groupPath, new Set());
              }
              groupsMap.get(groupPath)?.add(variableName);
            } else {
              if (!groupsMap.has('')) {
                groupsMap.set('', new Set());
              }
              groupsMap.get('')?.add(variableName);
            }
          }
          
          // Add to the variables array so we can find it later
          variables.push(variable);
          
          // Set description if provided
          if (value.$description) {
            variable.description = value.$description;
          }

          // Set scopes if provided and supported
          if (value.$scopes && Array.isArray(value.$scopes)) {
            try {
              // Filter only valid scopes
              const validScopes = value.$scopes.filter(scope => 
                isValidVariableScope(scope)
              );
              
              if (validScopes.length > 0) {
                variable.scopes = validScopes;
              }
            } catch (error) {
              console.warn(`Could not set scopes for ${variableName}:`, error);
            }
          }
          
          // Increment creation counter (this is a new variable)
          createdCount++;
        } else {
          // Update description if provided and different
          if (value.$description && variable.description !== value.$description) {
            variable.description = value.$description;
          }

          // Update scopes if provided and supported
          if (value.$scopes && Array.isArray(value.$scopes)) {
            try {
              // Filter only valid scopes
              const validScopes = value.$scopes.filter(scope => 
                isValidVariableScope(scope)
              );
              
              // Check if scopes are different
              if (validScopes.length > 0 && !arraysEqual(validScopes, variable.scopes)) {
                variable.scopes = validScopes;
              }
            } catch (error) {
              console.warn(`Could not update scopes for ${variableName}:`, error);
            }
          }
        }
        
        // Update the variable value for this mode
        await variable.setValueForMode(modeId, processedValue);
        
        if (isReference) {
          console.log(`${variable ? 'Updated' : 'Created'} variable with reference: ${variableName} → ${value.$value}`);
        } else {
          console.log(`${variable ? 'Updated' : 'Created'} variable: ${variableName}`);
        }
        
        // Mark this variable as processed
        processedVariableIds.add(variable.id);
        
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
      const nestedResult = await updateVariablesInMode(
        variables, 
        value, 
        modeId, 
        path, 
        collectionId,
        groupsMap,
        newPath
      );
      
      updated = updated || nestedResult.updated;
      updatedCount += nestedResult.updatedCount;
      createdCount += nestedResult.createdCount;
      
      // Collect any reference errors from nested calls
      if (nestedResult.referenceErrors && nestedResult.referenceErrors.length > 0) {
        referenceErrors.push(...nestedResult.referenceErrors);
      }
    }
  }
  
  return { updated, updatedCount, createdCount, referenceErrors, processedVariableIds };
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