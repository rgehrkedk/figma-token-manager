/**
 * ReferenceResolver.ts
 * 
 * Core module for handling design token references following Style Dictionary principles.
 * Responsible for extracting, validating, and resolving references within token data.
 */

// Define interfaces for token references
export interface TokenMap {
    [path: string]: {
      value: any;
      type: string;
      originalPath?: string;
    };
  }
  
  export interface ResolvedReference {
    value: any;
    type: string;
    originalReference: string;
    referencePath: string;
    isResolved: boolean;
    resolvedFrom?: string;
    chain?: string[]; // For future reference chain visualization
  }
  
  export interface TokenData {
    id: string;
    name: string;
    path: string;
    value: any;
    type: string;
    reference: boolean;
    referencePath?: string;
    resolvedValue?: any;
    resolvedType?: string;
    referenceChain?: string[]; // For future reference chain visualization
  }
  
  /**
   * Determines if a value is a reference (starts with { and ends with }).
   */
  export function isReference(value: any): boolean {
    if (typeof value !== 'string') return false;
    return value.startsWith('{') && value.endsWith('}');
  }
  
  /**
   * Extracts the path from a reference string (removes curly braces).
   */
  export function extractReferencePath(value: string): string | null {
    if (!isReference(value)) return null;
    return value.substring(1, value.length - 1);
  }
  
  /**
   * Formats a reference for display (removes curly braces).
   */
  export function formatReferenceDisplay(reference: string): string {
    if (isReference(reference)) {
      return extractReferencePath(reference) || reference;
    }
    return reference;
  }
  
  /**
   * Creates a flattened map of all tokens for resolution.
   * Includes multiple path formats (dots, slashes) for better resolution.
   */
  export function buildTokenMap(tokenData: any): TokenMap {
    const tokenMap: TokenMap = {};
    
    // Process all tokens in the data structure
    function processTokens(obj: any, path: string = '', originalPath: string = '') {
      if (!obj || typeof obj !== 'object') return;
      
      // Process DTCG-format tokens with $value
      if (obj.$value !== undefined && obj.$type !== undefined) {
        // Store in the flat map with various path formats to improve resolution
        
        // 1. Store with exact path using dots (Style Dictionary format)
        const dotPath = path.replace(/\//g, '.');
        tokenMap[dotPath] = {
          value: obj.$value,
          type: obj.$type,
          originalPath
        };
        
        // 2. Store with exact path using slashes
        tokenMap[path] = {
          value: obj.$value,
          type: obj.$type,
          originalPath
        };
        
        // 3. Store path segments for partial references
        const pathParts = dotPath.split('.');
        
        // Store progressively more specific paths
        for (let i = pathParts.length; i > 0; i--) {
          const partialPath = pathParts.slice(pathParts.length - i).join('.');
          if (!tokenMap[partialPath] && partialPath !== dotPath) {
            tokenMap[partialPath] = {
              value: obj.$value,
              type: obj.$type,
              originalPath
            };
          }
          
          // Also store with slashes for compatibility
          const partialSlashPath = pathParts.slice(pathParts.length - i).join('/');
          if (!tokenMap[partialSlashPath] && partialSlashPath !== path) {
            tokenMap[partialSlashPath] = {
              value: obj.$value,
              type: obj.$type,
              originalPath
            };
          }
        }
        
        // 4. Store just the token name for simplest references
        const tokenName = pathParts[pathParts.length - 1];
        if (!tokenMap[tokenName]) {
          tokenMap[tokenName] = {
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
    
    return tokenMap;
  }
  
  /**
   * Resolves a reference to its actual value.
   * Handles nested references and builds resolution chain.
   */
  export function resolveReference(
    reference: string,
    tokenMap: TokenMap,
    visited: Set<string> = new Set(),
    chain: string[] = []
  ): ResolvedReference {
    // Basic validation
    if (!isReference(reference)) {
      return {
        value: reference,
        type: 'unknown',
        originalReference: reference,
        referencePath: '',
        isResolved: false
      };
    }
    
    // Extract reference path without curly braces
    const refPath = extractReferencePath(reference) || '';
    
    // Start building the resolution chain
    const currentChain = [...chain, refPath];
    
    // Check for circular references
    if (visited.has(refPath)) {
      return {
        value: reference,
        type: 'reference',
        originalReference: reference,
        referencePath: refPath,
        isResolved: false,
        chain: currentChain
      };
    }
    
    // Add current path to visited set for circular reference detection
    visited.add(refPath);
    
    // Try to resolve the reference
    const resolved = tryResolveReference(refPath, tokenMap);
    
    if (resolved) {
      // Check if the resolved value is also a reference
      if (isReference(resolved.value)) {
        // Recursively resolve nested reference
        const nestedResult = resolveReference(
          resolved.value,
          tokenMap,
          visited,
          currentChain
        );
        
        return {
          ...nestedResult,
          originalReference: reference,
          referencePath: refPath,
          resolvedFrom: resolved.originalPath,
          chain: currentChain.concat(nestedResult.chain || [])
        };
      }
      
      // Return the resolved value
      return {
        value: resolved.value,
        type: resolved.type,
        originalReference: reference,
        referencePath: refPath,
        isResolved: true,
        resolvedFrom: resolved.originalPath,
        chain: currentChain
      };
    }
    
    // Reference couldn't be resolved
    return {
      value: reference,
      type: 'reference',
      originalReference: reference,
      referencePath: refPath,
      isResolved: false,
      chain: currentChain
    };
  }
  
  /**
   * Tries different approaches to resolve a reference.
   * Returns null if the reference can't be resolved.
   */
  function tryResolveReference(
    refPath: string,
    tokenMap: TokenMap
  ): { value: any; type: string; originalPath?: string } | null {
    // 1. Try exact reference path first
    if (tokenMap[refPath]) {
      return tokenMap[refPath];
    }
    
    // 2. Try with alternative separators (slash vs dot)
    const alternativePath = refPath.includes('/') 
      ? refPath.replace(/\//g, '.') 
      : refPath.replace(/\./g, '/');
      
    if (tokenMap[alternativePath]) {
      return tokenMap[alternativePath];
    }
    
    // 3. Try the last part of the path (for simple token names)
    const pathParts = refPath.split(/[\/\.]/);
    const simplePath = pathParts[pathParts.length - 1];
    
    if (pathParts.length > 1 && tokenMap[simplePath]) {
      return tokenMap[simplePath];
    }
    
    // 4. Try matching with fuzzy path matching
    const bestMatchPath = findBestTokenPathMatch(refPath, tokenMap);
    if (bestMatchPath) {
      return tokenMap[bestMatchPath];
    }
    
    // Couldn't resolve the reference
    return null;
  }
  
  /**
   * Find the best match for a token path from available paths.
   */
  function findBestTokenPathMatch(path: string, tokenMap: TokenMap): string | null {
    const allPaths = Object.keys(tokenMap);
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
   * Process token data to enhance with reference information.
   * Resolves references and populates additional reference data.
   */
  export function processTokensWithReferences(tokenData: any): any {
    // Build token map for reference resolution
    const tokenMap = buildTokenMap(tokenData);
    
    // Deep clone to avoid modifying the original
    const processedData = JSON.parse(JSON.stringify(tokenData));
    
    // Process all tokens and resolve references
    function processTokenObject(obj: any, path: string = ''): void {
      if (!obj || typeof obj !== 'object') return;
      
      // If it's an array, process each item
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          processTokenObject(item, `${path}[${index}]`);
        });
        return;
      }
      
      // Process DTCG token with $value
      if (obj.$value !== undefined) {
        // Check if the value is a reference
        if (isReference(obj.$value)) {
          // Resolve the reference
          const resolved = resolveReference(obj.$value, tokenMap);
          
          // Add reference information to the token
          obj.$reference = true;
          obj.$referencePath = resolved.referencePath;
          
          if (resolved.isResolved) {
            obj.$resolvedValue = resolved.value;
            obj.$resolvedType = resolved.type;
            obj.$resolvedFrom = resolved.resolvedFrom;
            obj.$referenceChain = resolved.chain;
          }
        }
      }
      
      // Process nested objects
      for (const key in obj) {
        if (key.startsWith('$')) continue; // Skip metadata properties
        
        const value = obj[key];
        const newPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          processTokenObject(value, newPath);
        }
      }
    }
    
    // Process each collection and mode
    for (const collection in processedData) {
      for (const mode in processedData[collection]) {
        processTokenObject(processedData[collection][mode], `${collection}.${mode}`);
      }
    }
    
    return processedData;
  }
  
  /**
   * Extract a flat list of TokenData objects from tokenData with reference information.
   */
  export function extractTokenList(tokenData: any): TokenData[] {
    const tokens: TokenData[] = [];
    
    // Process tokenData to extract tokens
    function processTokens(obj: any, basePath: string = '', name: string = ''): void {
      if (!obj || typeof obj !== 'object') return;
      
      // Handle DTCG format tokens
      if (obj.$value !== undefined) {
        const token: TokenData = {
          id: basePath,
          name: name || basePath.split('.').pop() || '',
          path: basePath,
          value: obj.$value,
          type: obj.$type || 'unknown',
          reference: isReference(obj.$value)
        };
        
        // Add reference-specific properties if it's a reference
        if (token.reference) {
          token.referencePath = obj.$referencePath || extractReferencePath(obj.$value) || '';
          token.resolvedValue = obj.$resolvedValue;
          token.resolvedType = obj.$resolvedType;
          token.referenceChain = obj.$referenceChain;
        }
        
        tokens.push(token);
        return;
      }
      
      // Process nested objects
      for (const key in obj) {
        if (key.startsWith('$')) continue; // Skip metadata properties
        
        const value = obj[key];
        const newPath = basePath ? `${basePath}.${key}` : key;
        const newName = name ? `${name}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          processTokens(value, newPath, newName);
        }
      }
    }
    
    // Process each collection and mode
    for (const collection in tokenData) {
      for (const mode in tokenData[collection]) {
        processTokens(tokenData[collection][mode], `${collection}.${mode}`);
      }
    }
    
    return tokens;
  }