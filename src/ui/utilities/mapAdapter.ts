/**
 * Map adapter utilities
 * Provides compatibility between different Map types
 */

/**
 * Converts a Map<string, string> to Map<string, string[]>
 * This is needed for compatibility with functions that expect an array of modes
 */
export function convertToArrayMap(singleModeMap: Map<string, string>): Map<string, string[]> {
    const arrayMap = new Map<string, string[]>();
    
    singleModeMap.forEach((mode, collection) => {
      arrayMap.set(collection, [mode]);
    });
    
    return arrayMap;
  }
  
  /**
   * Converts a Map<string, string[]> to Map<string, string>
   * Takes the first mode from each array
   */
  export function convertToSingleMap(arrayMap: Map<string, string[]>): Map<string, string> {
    const singleMap = new Map<string, string>();
    
    arrayMap.forEach((modes, collection) => {
      if (modes.length > 0) {
        singleMap.set(collection, modes[0]);
      }
    });
    
    return singleMap;
  }