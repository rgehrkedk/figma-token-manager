/**
 * Token filtering utilities
 * Handles filtering tokens by active collection while resolving references
 */

import { buildTokenReferenceMap } from '../../code/formatters/tokenResolver';

/**
 * Filters tokens to only include the active collection but preserves
 * reference information across all collections
 */
export function filterTokensByActiveCollection(
  tokenData: any,
  activeCollection: string | null,
  selectedModes: Map<string, string>
): any {
  if (!tokenData || !activeCollection || !selectedModes.has(activeCollection)) {
    return {};
  }

  const selectedMode = selectedModes.get(activeCollection);
  if (!selectedMode || !tokenData[activeCollection] || !tokenData[activeCollection][selectedMode]) {
    return {};
  }

  // Create a result with just the active collection
  return {
    [activeCollection]: {
      [selectedMode]: tokenData[activeCollection][selectedMode]
    }
  };
}

/**
 * Creates a token reference map from all selected collections and modes
 * for proper reference resolution
 */
export function createReferenceResolverMap(
  tokenData: any,
  selectedModes: Map<string, string>
): any {
  const resolverMap: any = {};
  
  // Add all selected collections/modes to the resolver map
  selectedModes.forEach((mode, collection) => {
    if (tokenData[collection] && tokenData[collection][mode]) {
      if (!resolverMap[collection]) {
        resolverMap[collection] = {};
      }
      resolverMap[collection][mode] = tokenData[collection][mode];
    }
  });
  
  return resolverMap;
}

/**
 * Extracts token data for display
 * Returns only tokens from active collection but ensures references
 * are resolved using all selected modes across collections
 */
export function extractDisplayTokens(
  tokenData: any,
  activeCollection: string | null,
  selectedModes: Map<string, string>
): { 
  displayTokens: any;
  referenceMap: any;
  unresolvedReferences: number;
} {
  if (!tokenData || !activeCollection || !selectedModes.has(activeCollection)) {
    return { 
      displayTokens: {}, 
      referenceMap: {}, 
      unresolvedReferences: 0 
    };
  }

  // Get reference resolver data from all selected collections/modes
  const resolverData = createReferenceResolverMap(tokenData, selectedModes);
  
  // Build token reference map for reference resolution
  const referenceMap = buildTokenReferenceMap(resolverData);
  
  // Get display tokens (filtered to active collection)
  const displayTokens = filterTokensByActiveCollection(
    tokenData,
    activeCollection,
    selectedModes
  );
  
  // Count unresolved references
  const unresolvedReferences = countUnresolvedReferences(
    displayTokens,
    referenceMap
  );
  
  return {
    displayTokens,
    referenceMap,
    unresolvedReferences
  };
}

/**
 * Counts unresolved references in token data
 */
function countUnresolvedReferences(tokenData: any, referenceMap: any): number {
  let count = 0;
  
  // Recursively check for unresolved references
  function checkReferences(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    
    // Check if this is a reference value
    if (obj.$value && typeof obj.$value === 'string' && 
        obj.$value.startsWith('{') && obj.$value.endsWith('}')) {
      
      const refPath = obj.$value.substring(1, obj.$value.length - 1);
      
      // Check if this reference exists in the reference map
      if (!referenceMap[refPath]) {
        count++;
      }
    }
    
    // Check nested objects
    if (Array.isArray(obj)) {
      obj.forEach(item => checkReferences(item));
    } else {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkReferences(obj[key]);
        }
      }
    }
  }
  
  // Process the token data
  for (const collection in tokenData) {
    for (const mode in tokenData[collection]) {
      checkReferences(tokenData[collection][mode]);
    }
  }
  
  return count;
}