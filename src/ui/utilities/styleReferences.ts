/**
 * Enhanced reference resolver inspired by Style Dictionary
 * Implementation focused on resolving references across the entire token set
 * rather than just within their own collection/file.
 * 
 * Now supports both dot notation (colors.red.500) and slash notation (colors/red/500)
 */

// Type definitions
interface FlatTokenMap {
  [path: string]: {
    value: any;
    type: string;
    originalPath: string;
  };
}

interface ResolvedToken {
  value: any;
  type: string;
  originalReference?: string;
  originalPath?: string;
  isResolved: boolean;
  resolvedFrom?: string;
}

interface DiagnosisResult {
  unresolvedReferences: Array<{
    path: string;
    reference: string;
    potentialMatches: Array<{ path: string; similarity: number }>;
  }>;
  suggestedFixes: Array<{
    path: string;
    original: string;
    suggested: string;
  }>;
}

/**
 * Builds a flattened map of all tokens for reference resolution
 * Enhanced to better support Style Dictionary references
 */
export function buildTokenReferenceMap(tokenData: any): FlatTokenMap {
  const flatMap: FlatTokenMap = {};
  
  // Process all tokens in the data structure
  function processTokens(obj: any, path: string = '', originalPath: string = '') {
    if (!obj || typeof obj !== 'object') return;
    
    // Process DTCG-format tokens with $value
    if (obj.$value !== undefined && obj.$type !== undefined) {
      // Store in the flat map with various path formats to improve resolution
      
      // 1. Store with exact path using dots (Style Dictionary format)
      const dotPath = path.replace(/\//g, '.');
      flatMap[dotPath] = {
        value: obj.$value,
        type: obj.$type,
        originalPath
      };
      
      // 2. Store with exact path using slashes
      flatMap[path] = {
        value: obj.$value,
        type: obj.$type,
        originalPath
      };
      
      // 3. Store each path segment for partial references
      const pathParts = dotPath.split('.');
      
      // Store progressively more specific paths
      for (let i = pathParts.length; i > 0; i--) {
        const partialPath = pathParts.slice(pathParts.length - i).join('.');
        if (!flatMap[partialPath] && partialPath !== dotPath) {
          flatMap[partialPath] = {
            value: obj.$value,
            type: obj.$type,
            originalPath
          };
        }
        
        // Also store with slashes for compatibility
        const partialSlashPath = pathParts.slice(pathParts.length - i).join('/');
        if (!flatMap[partialSlashPath] && partialSlashPath !== path) {
          flatMap[partialSlashPath] = {
            value: obj.$value,
            type: obj.$type,
            originalPath
          };
        }
      }
      
      // 4. Store just the token name for simplest references
      const tokenName = pathParts[pathParts.length - 1];
      if (!flatMap[tokenName]) {
        flatMap[tokenName] = {
          value: obj.$value,
          type: obj.$type,
          originalPath
        };
      }
      
      return;
    }
    
    // Process nested objects
    for (const key in obj) {
      const newPath = path ? `${path}/${key}` : key;
      const newOriginalPath = originalPath ? `${originalPath}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        processTokens(obj[key], newPath, newOriginalPath);
      }
    }
  }
  
  // Process each collection and mode
  for (const collection in tokenData) {
    for (const mode in tokenData[collection]) {
      processTokens(
        tokenData[collection][mode], 
        `${collection}/${mode}`, 
        `${collection}.${mode}`
      );
      
      // Also add entries without collection and mode for better resolution
      processTokens(
        tokenData[collection][mode],
        '',
        ''
      );
    }
  }
  
  // Debug: log all paths in the flat map (uncomment if needed)
  // console.log('Token paths in flat map:', Object.keys(flatMap));
  
  return flatMap;
}

/**
 * Resolves a token reference using Style Dictionary approach
 */
export function resolveTokenReference(
  reference: string, 
  referenceMap: FlatTokenMap, 
  visited: Set<string> = new Set()
): ResolvedToken {
  // Basic validation
  if (!reference || typeof reference !== 'string') {
    return { value: reference, type: 'unknown', isResolved: false };
  }
  
  // If not a reference format, return as is
  if (!reference.startsWith('{') || !reference.endsWith('}')) {
    return { value: reference, type: 'unknown', isResolved: false };
  }
  
  // Extract reference path without curly braces
  const refPath = reference.substring(1, reference.length - 1);
  
  // Debug: log the reference being resolved
  // console.log('Resolving reference:', refPath);
  
  // Check for circular references
  if (visited.has(refPath)) {
    console.warn(`Circular reference detected: ${refPath}`);
    return { 
      value: reference, 
      type: 'reference', 
      originalReference: reference,
      isResolved: false 
    };
  }
  
  // Add current path to visited set for circular reference detection
  visited.add(refPath);
  
  // Try multiple reference path formats for better resolution
  
  // 1. Try exact reference path first
  if (referenceMap[refPath]) {
    const resolved = referenceMap[refPath];
    
    // If this is also a reference, resolve it recursively
    if (typeof resolved.value === 'string' && 
        resolved.value.startsWith('{') && 
        resolved.value.endsWith('}')) {
      
      const nestedResult = resolveTokenReference(resolved.value, referenceMap, visited);
      
      return {
        ...nestedResult,
        originalReference: reference,
        originalPath: resolved.originalPath,
        resolvedFrom: refPath
      };
    }
    
    // Return the resolved value
    return {
      value: resolved.value,
      type: resolved.type,
      originalReference: reference,
      originalPath: resolved.originalPath,
      isResolved: true,
      resolvedFrom: refPath
    };
  }
  
  // 2. Try with alternative separators (slash vs dot)
  const alternativePath = refPath.includes('/') 
    ? refPath.replace(/\//g, '.') 
    : refPath.replace(/\./g, '/');
    
  if (referenceMap[alternativePath]) {
    const resolved = referenceMap[alternativePath];
    
    // If this is also a reference, resolve it recursively
    if (typeof resolved.value === 'string' && 
        resolved.value.startsWith('{') && 
        resolved.value.endsWith('}')) {
      
      const nestedResult = resolveTokenReference(resolved.value, referenceMap, visited);
      
      return {
        ...nestedResult,
        originalReference: reference,
        originalPath: resolved.originalPath,
        resolvedFrom: alternativePath
      };
    }
    
    // Return the resolved value
    return {
      value: resolved.value,
      type: resolved.type,
      originalReference: reference,
      originalPath: resolved.originalPath,
      isResolved: true,
      resolvedFrom: alternativePath
    };
  }
  
  // 3. Try the last part of the path (for simple token names)
  const simplePath = refPath.split(/[\/\.]/).pop() || '';
  if (simplePath !== refPath && referenceMap[simplePath]) {
    const resolved = referenceMap[simplePath];
    
    // If this is also a reference, resolve it recursively
    if (typeof resolved.value === 'string' && 
        resolved.value.startsWith('{') && 
        resolved.value.endsWith('}')) {
      
      const nestedResult = resolveTokenReference(resolved.value, referenceMap, visited);
      
      return {
        ...nestedResult,
        originalReference: reference,
        originalPath: resolved.originalPath,
        resolvedFrom: simplePath
      };
    }
    
    // Return the resolved value
    return {
      value: resolved.value,
      type: resolved.type,
      originalReference: reference,
      originalPath: resolved.originalPath,
      isResolved: true,
      resolvedFrom: simplePath
    };
  }
  
  // 4. Try matching with fuzzy path matching for better resolution
  const bestMatchPath = findBestTokenPathMatch(refPath, referenceMap);
  if (bestMatchPath) {
    const resolved = referenceMap[bestMatchPath];
    
    // If this is also a reference, resolve it recursively
    if (typeof resolved.value === 'string' && 
        resolved.value.startsWith('{') && 
        resolved.value.endsWith('}')) {
      
      const nestedResult = resolveTokenReference(resolved.value, referenceMap, visited);
      
      return {
        ...nestedResult,
        originalReference: reference,
        originalPath: resolved.originalPath,
        resolvedFrom: bestMatchPath
      };
    }
    
    // Return the resolved value
    return {
      value: resolved.value,
      type: resolved.type,
      originalReference: reference,
      originalPath: resolved.originalPath,
      isResolved: true,
      resolvedFrom: bestMatchPath
    };
  }
  
  // If we get here, we couldn't resolve the reference
  // console.warn('Reference not resolved:', refPath);
  
  return { 
    value: reference, 
    type: 'reference', 
    originalReference: reference,
    isResolved: false 
  };
}

/**
 * Find the best match for a token path from available paths
 */
function findBestTokenPathMatch(path: string, referenceMap: FlatTokenMap): string | null {
  const allPaths = Object.keys(referenceMap);
  let bestMatch: string | null = null;
  let bestScore = 0;
  
  // Normalize the path for matching
  const normalizedPath = path.toLowerCase();
  
  // Try to find the best match based on string similarity
  for (const candidatePath of allPaths) {
    // Check for partial matches (end of path matching)
    const normalizedCandidate = candidatePath.toLowerCase();
    
    if (normalizedCandidate.endsWith(normalizedPath)) {
      const score = normalizedPath.length / normalizedCandidate.length;
      if (score > bestScore) {
        bestMatch = candidatePath;
        bestScore = score;
      }
    }
    // Also check for segments matching
    else {
      const pathSegments = normalizedPath.split(/[\/\.]/);
      const candidateSegments = normalizedCandidate.split(/[\/\.]/);
      
      const lastPathSegment = pathSegments[pathSegments.length - 1];
      const lastCandidateSegment = candidateSegments[candidateSegments.length - 1];
      
      if (lastPathSegment === lastCandidateSegment) {
        const score = 0.5; // Half score for just last segment match
        if (score > bestScore) {
          bestMatch = candidatePath;
          bestScore = score;
        }
      }
    }
  }
  
  return bestMatch;
}

/**
 * Resolves all references in a token map
 */
export function resolveAllReferences(tokens: any, referenceMap: FlatTokenMap): any {
  const resolvedTokens = JSON.parse(JSON.stringify(tokens)); // Deep clone
  
  // Recursively process objects
  function processObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => processObject(item));
    }
    
    // Handle DTCG format tokens
    if (obj.$value !== undefined && obj.$type !== undefined) {
      // Check if the value is a reference
      if (typeof obj.$value === 'string' && 
          obj.$value.startsWith('{') && 
          obj.$value.endsWith('}')) {
        
        // Resolve the reference
        const resolved = resolveTokenReference(obj.$value, referenceMap);
        
        // If resolved successfully, update the object with the resolved value
        if (resolved.isResolved) {
          return {
            ...obj,
            $value: resolved.value,
            $originalValue: obj.$value,
            $resolvedFrom: resolved.resolvedFrom,
            // Keep the original type if it's a reference type
            $type: obj.$type === 'reference' ? resolved.type : obj.$type
          };
        }
      }
      
      return obj;
    }
    
    // Process nested objects
    const result: Record<string, any> = {};
    for (const key in obj) {
      result[key] = processObject(obj[key]);
    }
    
    return result;
  }
  
  return processObject(resolvedTokens);
}

/**
 * Diagnose reference resolution issues
 * Returns information about failed references and potential matches
 */
export function diagnoseReferenceIssues(tokenData: any): DiagnosisResult {
  // Build the reference map
  const referenceMap = buildTokenReferenceMap(tokenData);
  const unresolvedReferences: Array<{
    path: string;
    reference: string;
    potentialMatches: Array<{ path: string; similarity: number }>;
  }> = [];
  const suggestedFixes: Array<{
    path: string;
    original: string;
    suggested: string;
  }> = [];

  // Function to find all references in the token data
  function findReferences(obj: any, path: string = '') {
    if (!obj || typeof obj !== 'object') return;
    
    // If it's a DTCG token with a reference value
    if (obj.$value !== undefined && 
        typeof obj.$value === 'string' && 
        obj.$value.startsWith('{') && 
        obj.$value.endsWith('}')) {
      
      const reference = obj.$value;
      const refPath = reference.substring(1, reference.length - 1);
      
      // Try to resolve the reference
      const resolved = resolveTokenReference(reference, referenceMap);
      
      // If not resolved, collect information about it
      if (!resolved.isResolved) {
        // Find potential matches based on similarity
        const potentialMatches = findPotentialMatches(refPath, referenceMap);
        
        unresolvedReferences.push({
          path,
          reference: refPath,
          potentialMatches
        });
        
        // If there's a good potential match, suggest a fix
        // Ensure we suggest using dot notation for the fixed path
        if (potentialMatches.length > 0 && potentialMatches[0].similarity > 0.7) {
          // Convert any slash paths to dot paths for consistency in suggestions
          const suggestedPath = potentialMatches[0].path.replace(/\//g, '.');
          suggestedFixes.push({
            path,
            original: reference,
            suggested: `{${suggestedPath}}`
          });
        }
      }
    }
    
    // Process nested objects
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        findReferences(item, `${path}[${index}]`);
      });
    } else {
      for (const key in obj) {
        const newPath = path ? `${path}.${key}` : key;
        findReferences(obj[key], newPath);
      }
    }
  }
  
  // Calculate simple similarity between two strings
  function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Normalize paths (convert slashes to dots for comparison)
    const normalized1 = s1.replace(/\//g, '.');
    const normalized2 = s2.replace(/\//g, '.');
    
    // Check if one contains the other after normalization
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return 0.8;
    }
    
    // Check for path similarity (common segments)
    const parts1 = normalized1.split('.');
    const parts2 = normalized2.split('.');
    
    let commonSegments = 0;
    for (const p1 of parts1) {
      if (parts2.includes(p1)) {
        commonSegments++;
      }
    }
    
    if (commonSegments > 0) {
      return 0.5 + (0.5 * commonSegments / Math.max(parts1.length, parts2.length));
    }
    
    // Simple character-based similarity as fallback
    let common = 0;
    const minLength = Math.min(normalized1.length, normalized2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (normalized1[i] === normalized2[i]) {
        common++;
      }
    }
    
    return common / Math.max(normalized1.length, normalized2.length);
  }
  
  // Find potential matches for a reference path
  function findPotentialMatches(refPath: string, refMap: FlatTokenMap): Array<{ path: string; similarity: number }> {
    const matches: Array<{ path: string; similarity: number }> = [];
    
    for (const path in refMap) {
      const similarity = calculateSimilarity(refPath, path);
      
      if (similarity > 0.5) {
        // Always suggest dot notation format for paths
        const normalizedPath = path.replace(/\//g, '.');
        matches.push({ path: normalizedPath, similarity });
      }
    }
    
    // Sort by similarity, highest first
    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }
  
  // Scan the entire token set for references
  for (const collection in tokenData) {
    for (const mode in tokenData[collection]) {
      findReferences(tokenData[collection][mode], `${collection}.${mode}`);
    }
  }
  
  return {
    unresolvedReferences,
    suggestedFixes
  };
}

/**
 * Resolves references in a visual token list
 */
export function resolveVisualTokenReferences(
  visualTokens: any[], 
  tokenData: any
): any[] {
  // Build the reference map from all tokens
  const referenceMap = buildTokenReferenceMap(tokenData);
  
  // Process each visual token
  return visualTokens.map(token => {
    const { path, type, value } = token;
    
    // Check if this is a reference
    if (typeof value === 'string' && 
        value.startsWith('{') && 
        value.endsWith('}')) {
      
      // Resolve the reference
      const resolvedRef = resolveTokenReference(value, referenceMap);
      
      // Update the token with the resolved reference
      return {
        ...token,
        referencedValue: resolvedRef.isResolved ? resolvedRef.value : undefined,
        referencedType: resolvedRef.isResolved ? resolvedRef.type : undefined,
        resolvedFrom: resolvedRef.resolvedFrom
      };
    }
    
    return token;
  });
}