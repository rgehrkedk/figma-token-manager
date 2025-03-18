/**
 * exportHandler.ts
 * 
 * Handles exporting token data to various formats, including generating 
 * separate JSON files for each collection and mode
 */

import JSZip from 'jszip';

interface ExportOptions {
  separateByMode?: boolean;
  separateByCollection?: boolean;
  flattenStructure?: boolean;
  includeMetadata?: boolean;
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
    separateByMode: true, 
    separateByCollection: true,
    flattenStructure: false,
    includeMetadata: true
  }
): Promise<void> {
  try {
    console.log('Starting export');
    
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
        pluginVersion: '1.0.0' // Replace with actual version
      };
      
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    }
    
    // Create index file with all tokens
    zip.file('tokens.json', JSON.stringify(tokenData, null, 2));
    
    // Process each collection and mode
    Object.entries(tokenData).forEach(([collectionName, collectionData]: [string, any]) => {
      // Clean up the collection name for filenames
      const safeCollectionName = sanitizeFileName(collectionName);
      
      // Create a separate file for each collection
      if (options.separateByCollection) {
        zip.file(`${safeCollectionName}.json`, JSON.stringify({ [collectionName]: collectionData }, null, 2));
      }
      
      // Create a separate file for each mode in each collection
      if (options.separateByMode) {
        Object.entries(collectionData).forEach(([modeName, modeData]: [string, any]) => {
          // Clean up the mode name for filenames
          const safeModeName = sanitizeFileName(modeName);
          
          // Create filename based on collection and mode
          const filename = `${safeCollectionName}/${safeModeName}.json`;
          
          // Add to zip with nested structure
          zip.file(filename, JSON.stringify(modeData, null, 2));
          
          // If we need a flattened structure, also add a file with a combined name
          if (options.flattenStructure) {
            const flatFilename = `${safeCollectionName}_${safeModeName}.json`;
            zip.file(flatFilename, JSON.stringify(modeData, null, 2));
          }
        });
      }
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