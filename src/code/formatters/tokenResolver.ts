/**
 * Enhanced Token Reference Resolver
 * Consolidated implementation with advanced features from both plugin and UI side
 */

// Type definitions
export type VariableLookup = Map<string, string>;

export interface TokenReferenceMap {
  [path: string]: {
    value: any;
    type: string;
    originalPath?: string;
  };
}

export interface ResolvedReference {
  value: any;
  type: string;
  originalReference?: string;
  originalPath?: string;
  isResolved: boolean;
  resolvedFrom?: string;
}

export interface ReferenceError {
  path: string;
  reference: string;
  message: string;
  potentialMatches?: Array<{ path: string; similarity: number }>;
}

export interface DiagnosisResult {
  unresolvedReferences: ReferenceError[];
  suggestedFixes: Array<{
    path: string;
    original: string;
    suggested: string;
  }>;
  resolvedCount: number;
  unresolvedCount: number;
}

// Visual token interface for token preview components
export interface VisualToken {
  path: string;
  type: string;
  value: any;
  originalValue?: any;
  referencedValue?: any; // Store the resolved reference value
  referencedType?: string; // Store the type of the referenced value
  resolvedFrom?: string; // Path from which the reference was resolved
}

/**
 * Resolves variable references in dtcgVariables.ts
 * Simple version used during variable extraction
 */
export function resolveVariableReference(
  reference: any, 
  variables: Variable[], 
  variableLookup: VariableLookup
): any {
  if (!reference || typeof reference !== 'object') {
    return reference;
  }

  // Handle variable alias references
  if ((reference.type === 'VARIABLE_ALIAS' || reference.type === 'VARIABLE_REFERENCE') && reference.id) {
    const referencedVar = variables.find(v => v.id === reference.id);
    if (referencedVar) {
      // Return a reference string format with the full path
      // Convert slashes to dots in the reference path
      const referencePath = referencedVar.name.replace(/\//g, '.');
      
      // Cache this reference for later validation
      if (reference.id && referencePath) {
        variableLookup.set(reference.id, referencePath);
      }
      
      return `{${referencePath}}`;
    }
  }

  return reference;
}

/**
 * Builds a flattened map of all tokens for reference resolution
 */
export function buildTokenReferenceMap(tokenData: any): TokenReferenceMap {
  const flatMap: TokenReferenceMap = {};
  
  // Process all tokens in the data structure
  function processTokens(obj: any, path: string = '', originalPath: string = '') {
    if (!obj || typeof obj !== 'object') return;
    
    // Process DTCG-format tokens with $value
    if (obj.$value !== undefined && obj.$type !== undefined) {
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
      
      // 3. Store path segments for partial references
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
  
  return flatMap;
}

/**
 * Resolves a token reference using enhanced approach
 */
export function resolveTokenReference(
  reference: string, 
  referenceMap: TokenReferenceMap, 
  visited: Set<string> = new Set()
): ResolvedReference {
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
function findBestTokenPathMatch(path: string, referenceMap: TokenReferenceMap): string | null {
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
 * Validates and fixes all references in the token set
 * Enhanced version of original validateAndFixReferences in references.ts
 */
export function validateAndFixReferences(tokens: any, referenceMap: VariableLookup | TokenReferenceMap): any {
  const validatedTokens = JSON.parse(JSON.stringify(tokens)); // Deep clone
  
  // Convert VariableLookup to TokenReferenceMap if needed
  const tokenReferenceMap: TokenReferenceMap = {};
  if (referenceMap instanceof Map) {
    for (const [id, path] of referenceMap.entries()) {
      tokenReferenceMap[path] = {
        value: `{${path}}`,
        type: 'reference'
      };
    }
  } else {
    Object.assign(tokenReferenceMap, referenceMap);
  }
  
  // Build comprehensive reference map if not provided
  if (Object.keys(tokenReferenceMap).length === 0) {
    Object.assign(tokenReferenceMap, buildTokenReferenceMap(tokens));
  }
  
  // Function to recursively check and fix references
  function processTokenObject(obj: any, path: string = ''): void {
    if (!obj || typeof obj !== 'object') return;
    
    // If it's an array, process each item
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => processTokenObject(item, `${path}[${index}]`));
      return;
    }
    
    // Process each property in the object
    for (const key in obj) {
      const value = obj[key];
      const newPath = path ? `${path}.${key}` : key;
      
      // Skip metadata keys that start with $ except $value
      if (key.startsWith('$') && key !== '$value') continue;
      
      // If this is a token object with $value that's a reference
      if (key === '$value' && typeof value === 'string' && 
          value.startsWith('{') && value.endsWith('}')) {
        
        // Extract the reference path
        const refPath = value.substring(1, value.length - 1);
        
        // Resolve the reference
        const resolved = resolveTokenReference(value, tokenReferenceMap);
        
        // If resolved successfully, update the object
        if (resolved.isResolved) {
          obj.$originalValue = value;
          obj.$value = resolved.value;
          obj.$resolvedFrom = resolved.resolvedFrom;
          
          // Ensure the type is set appropriately
          if (obj.$type === 'reference' && resolved.type) {
            obj.$type = resolved.type;
          } else if (!obj.$type) {
            obj.$type = resolved.type || 'reference';
          }
        }
        // For unresolved references, ensure type is set correctly
        else if (!obj.$type) {
          obj.$type = 'reference';
        }
      } 
      else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        processTokenObject(value, newPath);
      }
    }
  }
  
  // Start the validation process for each collection and mode
  for (const collection in validatedTokens) {
    for (const mode in validatedTokens[collection]) {
      processTokenObject(validatedTokens[collection][mode], `${collection}.${mode}`);
    }
  }
  
  return validatedTokens;
}

/**
 * Resolves all references in a token set
 */
export function resolveReferences(tokenData: any): any {
  // Clone the token data to avoid modifying the original
  const resolvedTokens = JSON.parse(JSON.stringify(tokenData));
  
  // Build reference map for resolution
  const referenceMap = buildTokenReferenceMap(tokenData);
  
  // Process all references in the token data
  function processTokenObject(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    
    // If it's an array, process each item
    if (Array.isArray(obj)) {
      obj.forEach(item => processTokenObject(item));
      return;
    }
    
    // Check for $value with reference
    if (obj.$value && typeof obj.$value === 'string' && 
        obj.$value.startsWith('{') && obj.$value.endsWith('}')) {
      // Try to resolve the reference
      const resolved = resolveTokenReference(obj.$value, referenceMap);
      if (resolved.isResolved) {
        // Store original value
        obj.$original = obj.$value;
        // Update with resolved value
        obj.$value = resolved.value;
        // Add resolved metadata
        obj.$resolvedFrom = resolved.resolvedFrom;
        if (!obj.$type && resolved.type) {
          obj.$type = resolved.type;
        }
      }
    }
    
    // Process each property in the object
    for (const key in obj) {
      const value = obj[key];
      
      // Skip metadata fields that start with $
      if (key.startsWith('$')) continue;
      
      if (typeof value === 'object' && value !== null) {
        processTokenObject(value);
      }
    }
  }
  
  // Process each collection and mode
  for (const collection in resolvedTokens) {
    for (const mode in resolvedTokens[collection]) {
      processTokenObject(resolvedTokens[collection][mode]);
    }
  }
  
  return resolvedTokens;
}

/**
 * Diagnoses reference issues in the token set
 */
export function diagnoseReferenceIssues(tokenData: any): DiagnosisResult {
  // Build the reference map
  const referenceMap = buildTokenReferenceMap(tokenData);
  const unresolvedReferences: ReferenceError[] = [];
  const suggestedFixes: Array<{
    path: string;
    original: string;
    suggested: string;
  }> = [];
  
  let resolvedCount = 0;
  let unresolvedCount = 0;

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
      
      if (resolved.isResolved) {
        resolvedCount++;
      } else {
        // If not resolved, collect information about it
        unresolvedCount++;
        
        // Find potential matches based on similarity
        const potentialMatches = findPotentialMatches(refPath, referenceMap);
        
        unresolvedReferences.push({
          path,
          reference: refPath,
          message: `Reference '${refPath}' not found in tokens`,
          potentialMatches
        });
        
        // If there's a good potential match, suggest a fix
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
  
  // Process collections and modes
  for (const collection in tokenData) {
    for (const mode in tokenData[collection]) {
      findReferences(tokenData[collection][mode], `${collection}.${mode}`);
    }
  }
  
  return {
    unresolvedReferences,
    suggestedFixes,
    resolvedCount,
    unresolvedCount
  };
}

/**
 * Find potential matches for an unresolved reference
 */
function findPotentialMatches(
  reference: string,
  referenceMap: TokenReferenceMap
): Array<{ path: string; similarity: number }> {
  const matches: Array<{ path: string; similarity: number }> = [];
  
  for (const path in referenceMap) {
    const similarity = calculateSimilarity(reference, path);
    
    if (similarity > 0.5) {
      // Always suggest dot notation format for paths
      const normalizedPath = path.replace(/\//g, '.');
      matches.push({ path: normalizedPath, similarity });
    }
  }
  
  // Sort by similarity, highest first
  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

/**
 * Calculate similarity between two strings
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(a: string, b: string): number {
  // Basic implementation of string similarity
  if (a === b) return 1;
  
  // Check if b contains a
  if (b.includes(a)) return 0.9;
  
  // Check if a is the last part of b (e.g. "red.500" in "colors.red.500")
  const aParts = a.split(/[\/\.]/);
  const bParts = b.split(/[\/\.]/);
  
  if (aParts.length > 0 && bParts.length > 0) {
    // Check if last parts match
    if (aParts[aParts.length - 1] === bParts[bParts.length - 1]) {
      return 0.8;
    }
    
    // Check if multiple end parts match
    let matchingEndParts = 0;
    const minLength = Math.min(aParts.length, bParts.length);
    
    for (let i = 1; i <= minLength; i++) {
      if (aParts[aParts.length - i] === bParts[bParts.length - i]) {
        matchingEndParts++;
      } else {
        break;
      }
    }
    
    if (matchingEndParts > 0) {
      return 0.6 + (0.1 * matchingEndParts);
    }
  }
  
  // Fallback - calculate primitive distance ratio
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  
  // Simple similarity check based on character differences
  let differences = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) differences++;
  }
  differences += Math.abs(a.length - b.length);
  
  return 1 - (differences / maxLength);
}