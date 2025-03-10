/**
 * Enhanced reference resolver inspired by Style Dictionary
 * Implementation focused on resolving references across the entire token set
 * rather than just within their own collection/file.
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
  
  /**
   * Builds a flattened map of all tokens for reference resolution
   */
  export function buildTokenReferenceMap(tokenData: any): FlatTokenMap {
    const flatMap: FlatTokenMap = {};
    
    // Process all tokens in the data structure
    function processTokens(obj: any, path: string = '', originalPath: string = '') {
      if (!obj || typeof obj !== 'object') return;
      
      // Process DTCG-format tokens with $value
      if (obj.$value !== undefined && obj.$type !== undefined) {
        // Store in the flat map with the full path
        flatMap[path] = {
          value: obj.$value,
          type: obj.$type,
          originalPath
        };
        
        // Also store with just the token name (last part of the path)
        const pathParts = path.split('/');
        const tokenName = pathParts[pathParts.length - 1];
        if (tokenName && tokenName !== path) {
          // Don't overwrite more specific paths with the same name
          if (!flatMap[tokenName]) {
            flatMap[tokenName] = {
              value: obj.$value,
              type: obj.$type,
              originalPath
            };
          }
        }
        
        // Store each segment of the path for partial matching
        // This allows references like {colors/neutral/200} to be found even 
        // if the full path is theme/light/colors/neutral/200
        let partialPath = '';
        for (let i = pathParts.length - 1; i >= 0; i--) {
          if (partialPath) {
            partialPath = pathParts[i] + '/' + partialPath;
          } else {
            partialPath = pathParts[i];
          }
          
          // Don't overwrite more specific paths
          if (!flatMap[partialPath] && partialPath !== path && partialPath !== tokenName) {
            flatMap[partialPath] = {
              value: obj.$value,
              type: obj.$type,
              originalPath
            };
          }
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
      }
    }
    
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
    
    // Try to find an exact match first
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
    
    // No exact match found, try more flexible matching strategies
    
    // 1. Try with multiple path separators ('/' vs '.')
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
    
    // 2. Try to find any path that ends with the reference path
    for (const path in referenceMap) {
      // Skip paths that would be an exact match (already checked)
      if (path === refPath) continue;
      
      // Check if this path ends with the reference
      if (path.endsWith(`/${refPath}`) || path.endsWith(`.${refPath}`)) {
        const resolved = referenceMap[path];
        
        // If this is also a reference, resolve it recursively
        if (typeof resolved.value === 'string' && 
            resolved.value.startsWith('{') && 
            resolved.value.endsWith('}')) {
          
          const nestedResult = resolveTokenReference(resolved.value, referenceMap, visited);
          
          return {
            ...nestedResult,
            originalReference: reference,
            originalPath: resolved.originalPath,
            resolvedFrom: path
          };
        }
        
        // Return the resolved value
        return {
          value: resolved.value,
          type: resolved.type,
          originalReference: reference,
          originalPath: resolved.originalPath,
          isResolved: true,
          resolvedFrom: path
        };
      }
    }
    
    // 3. If we still haven't found it, check for any subpath matches
    const refPathParts = refPath.split(/[\/\.]/);
    
    // Start with the most specific (longest) subpath
    for (let length = refPathParts.length - 1; length > 0; length--) {
      const subPath = refPathParts.slice(refPathParts.length - length).join('/');
      
      if (referenceMap[subPath]) {
        const resolved = referenceMap[subPath];
        
        // If this is also a reference, resolve it recursively
        if (typeof resolved.value === 'string' && 
            resolved.value.startsWith('{') && 
            resolved.value.endsWith('}')) {
          
          const nestedResult = resolveTokenReference(resolved.value, referenceMap, visited);
          
          return {
            ...nestedResult,
            originalReference: reference,
            originalPath: resolved.originalPath,
            resolvedFrom: subPath
          };
        }
        
        // Return the resolved value
        return {
          value: resolved.value,
          type: resolved.type,
          originalReference: reference,
          originalPath: resolved.originalPath,
          isResolved: true,
          resolvedFrom: subPath
        };
      }
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
  export function diagnoseReferenceIssues(tokenData: any): {
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
  } {
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
          if (potentialMatches.length > 0 && potentialMatches[0].similarity > 0.7) {
            suggestedFixes.push({
              path,
              original: reference,
              suggested: `{${potentialMatches[0].path}}`
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
      
      // Check if one contains the other
      if (s1.includes(s2) || s2.includes(s1)) {
        return 0.8;
      }
      
      // Check for path similarity (common segments)
      const parts1 = s1.split(/[\/\.]/);
      const parts2 = s2.split(/[\/\.]/);
      
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
      const minLength = Math.min(s1.length, s2.length);
      
      for (let i = 0; i < minLength; i++) {
        if (s1[i] === s2[i]) {
          common++;
        }
      }
      
      return common / Math.max(s1.length, s2.length);
    }
    
    // Find potential matches for a reference path
    function findPotentialMatches(refPath: string, refMap: FlatTokenMap): Array<{ path: string; similarity: number }> {
      const matches: Array<{ path: string; similarity: number }> = [];
      
      for (const path in refMap) {
        const similarity = calculateSimilarity(refPath, path);
        
        if (similarity > 0.5) {
          matches.push({ path, similarity });
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