/**
 * exportHandler.ts
 * 
 * Handles exporting token data to various formats, including generating 
 * separate JSON files for each collection and mode with enhanced selection options
 */

import JSZip from 'jszip';

interface ExportOptions {
  format?: 'dtcg' | 'legacy';
  flattenStructure?: boolean;
  includeCompleteFile?: boolean;
  includeMetadata?: boolean;
  selectedCollections?: Record<string, boolean>;
  selectedModes?: Record<string, Record<string, boolean>>;
}

/**
 * Exports variables to downloadable files
 * 
 * @param tokenData The token data to export
 * @param options Export options
 * @returns Promise that resolves when the export is completed
 */
export async function exportVariablesToZip(
  tokenData: any, 
  options: ExportOptions = { 
    format: 'dtcg',
    flattenStructure: false,
    includeCompleteFile: true,
    includeMetadata: true,
    selectedCollections: {},
    selectedModes: {}
  }
): Promise<void> {
  try {
    // Log detailed export options
    console.log('Starting export with options:', {
      format: options.format,
      flattenStructure: Boolean(options.flattenStructure),
      includeCompleteFile: Boolean(options.includeCompleteFile),
      includeMetadata: Boolean(options.includeMetadata),
      selectedCollections: options.selectedCollections,
      selectedModes: options.selectedModes
    });
    
    // Get document name to use in filenames
    const documentName = figma.root.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Create a zip file in memory
    const zip = new JSZip();
    
    // Add metadata file with export info
    if (options.includeMetadata) {
      const metadata = {
        exportDate: new Date().toISOString(),
        documentName: figma.root.name,
        documentId: figma.root.id,
        pluginVersion: '1.0.0', // Replace with actual version
        exportOptions: {
          format: options.format,
          flattenStructure: options.flattenStructure,
          selectedCollections: Object.keys(options.selectedCollections || {})
            .filter(coll => options.selectedCollections?.[coll])
        }
      };
      
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    }
    
    // Create filtered token data with only selected collections and modes
    const filteredTokenData: any = {};
    
    Object.entries(tokenData).forEach(([collectionName, collectionData]: [string, any]) => {
      // Skip if collection is not selected
      if (options.selectedCollections && !options.selectedCollections[collectionName]) {
        return;
      }
      
      // Create an object for this collection
      filteredTokenData[collectionName] = {};
      
      // Add selected modes
      Object.entries(collectionData as object).forEach(([modeName, modeData]: [string, any]) => {
        // Skip if mode is not selected
        if (
          options.selectedModes && 
          options.selectedModes[collectionName] && 
          !options.selectedModes[collectionName][modeName]
        ) {
          return;
        }
        
        // Add this mode to the filtered data
        filteredTokenData[collectionName][modeName] = modeData;
      });
      
      // Remove collection if it has no modes
      if (Object.keys(filteredTokenData[collectionName]).length === 0) {
        delete filteredTokenData[collectionName];
      }
    });
    
    // Create index file with all selected tokens if requested
    if (options.includeCompleteFile) {
      zip.file('tokens.json', JSON.stringify(filteredTokenData, null, 2));
    }
    
    // Process each selected collection and mode
    Object.entries(filteredTokenData).forEach(([collectionName, collectionData]: [string, any]) => {
      // Clean up the collection name for filenames
      const safeCollectionName = sanitizeFileName(collectionName);
      
      // Create a separate file for each collection
      zip.file(`${safeCollectionName}.json`, JSON.stringify({ [collectionName]: collectionData }, null, 2));
      
      // Create a separate file for each mode in each collection
      Object.entries(collectionData).forEach(([modeName, modeData]: [string, any]) => {
        // Clean up the mode name for filenames
        const safeModeName = sanitizeFileName(modeName);
        
        // Format the data based on the selected format
        let formattedData = modeData;
        if (options.format === 'legacy') {
          // Transform to legacy format if needed
          console.log(`Applying legacy format for ${collectionName}/${modeName}`);
          formattedData = transformToLegacyFormat(modeData);
        }
        
        // Create filename based on collection and mode
        if (options.flattenStructure === true) {
          // Use flat structure
          console.log(`Using flat structure for ${collectionName}/${modeName}`);
          const flatFilename = `${safeCollectionName}_${safeModeName}.json`;
          zip.file(flatFilename, JSON.stringify(formattedData, null, 2));
        } else {
          // Use nested structure
          console.log(`Using nested structure for ${collectionName}/${modeName}`);
          const filename = `${safeCollectionName}/${safeModeName}.json`;
          zip.file(filename, JSON.stringify(formattedData, null, 2));
        }
      });
    });
    
    // Generate the zip file as a Uint8Array (compatible with Figma)
    const zipData = await zip.generateAsync({ type: 'uint8array' });
    
    // Tell Figma to download the file
    figma.ui.postMessage({
      type: 'download-file',
      fileName: `${documentName}_tokens.zip`,
      buffer: Array.from(zipData) // Convert Uint8Array to regular array for serialization
    });
    
    console.log('Export completed successfully');
  } catch (error) {
    console.error('Error exporting to zip:', error);
    throw error;
  }
}

/**
 * Transform data to legacy format if needed
 * 
 * @param data Token data in DTCG format
 * @returns Data in legacy format
 */
function transformToLegacyFormat(data: any): any {
  console.log('Transforming to legacy format:', data);
  
  // Create a result object
  const result: any = {};
  
  // DTCG format is typically nested objects with $value and $type
  // Legacy format typically has direct key-value pairs
  // We'll flatten the structure by taking just the $value property
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  // Process each property in the data
  Object.entries(data).forEach(([key, value]: [string, any]) => {
    if (typeof value === 'object' && value !== null) {
      if ('$value' in value && '$type' in value) {
        // This is a DTCG token, convert to legacy format
        result[key] = value.$value;
      } else {
        // This is a nested structure, recursively transform
        result[key] = transformToLegacyFormat(value);
      }
    } else {
      // This is already a primitive value
      result[key] = value;
    }
  });
  
  return result;
}

/**
 * Sanitize a string to be used as a filename
 * 
 * @param name The name to sanitize
 * @returns Sanitized name
 */
function sanitizeFileName(name: string): string {
  // Replace special characters with underscores
  return name
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_') // Replace multiple underscores with a single one
    .toLowerCase();
}