/**
 * Creates a Map<string, string[]> for modes from a collection and mode arrays
 * Used to convert older format selections to the new Map-based format
 */
export function createModesMap(
  collections: string[],
  modes: string[]
): Map<string, string[]> {
  const modesMap = new Map<string, string[]>();
  
  collections.forEach(collection => {
    modesMap.set(collection, [...modes]);
  });
  
  return modesMap;
}

/**
 * Creates a Map with the same mode applied to all selected collections
 * @param collections Collections to apply modes to
 * @param mode Single mode to apply to all collections
 */
export function createSingleModeMap(
  collections: string[],
  mode: string
): Map<string, string[]> {
  const modesMap = new Map<string, string[]>();
  
  collections.forEach(collection => {
    modesMap.set(collection, [mode]);
  });
  
  return modesMap;
}

/**
 * Creates a Map from a collection to its modes
 * @param collections Collections to modes mapping
 */
export function createCollectionModeMap(
  collectionModes: {[collection: string]: string[]}
): Map<string, string[]> {
  const modesMap = new Map<string, string[]>();
  
  for (const collection in collectionModes) {
    modesMap.set(collection, [...collectionModes[collection]]);
  }
  
  return modesMap;
}
