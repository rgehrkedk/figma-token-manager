import { extractDTCGVariables } from './extractors/dtcgVariables';
import { formatAllColors, ColorFormat } from './formatters/colorUtils';
import { handleUpdateVariables } from './updateVariablesHandler'; // Import the update handler
import { exportVariablesToZip } from './exportHandler'; // Import the export handler

// Flag to track if we should extract on startup
let shouldExtractOnStartup = true;

// Store current color format
let currentColorFormat: ColorFormat = 'hex';

// Store original extracted tokens for transformations
let originalTokenData: any = null;

// Show UI with larger size to accommodate two-panel layout
figma.showUI(__html__, { width: 1080, height: 800 });
console.log("Plugin UI shown with updated dimensions");

// Restore previous window size from client storage
figma.clientStorage.getAsync('window-size').then(size => {
  if (size) {
    figma.ui.resize(size.w, size.h);
    console.log("Restored window size:", size);
  }
}).catch(err => {
  console.error("Error restoring window size:", err);
});

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  console.log("Plugin received message from UI:", msg.type);
  
  if (msg.type === 'ui-ready') {
    console.log("UI is ready, sending data");
    if (shouldExtractOnStartup) {
      // Only extract once
      shouldExtractOnStartup = false;
      
      try {
        // Extract and store original tokens
        const tokens = await extractDTCGVariables();
        originalTokenData = JSON.parse(JSON.stringify(tokens)); // Deep clone
        
        console.log("Extracted DTCG-compliant tokens, sending to UI");
        figma.ui.postMessage({
          type: 'tokens-data',
          data: tokens
        });
      } catch (error: unknown) {
        console.error("Error extracting tokens:", error);
        figma.ui.postMessage({
          type: 'error',
          message: `Error extracting tokens: ${error instanceof Error ? error.message : "Unknown error"}`
        });
      }
    }
  } else if (msg.type === 'extract-tokens') {
    try {
      // Extract fresh tokens when requested
      const tokens = await extractDTCGVariables();
      originalTokenData = JSON.parse(JSON.stringify(tokens)); // Store original data
      
      console.log("Extracted tokens on demand, sending to UI");
      figma.ui.postMessage({
        type: 'tokens-data',
        data: tokens
      });
    } catch (error: unknown) {
      console.error("Error extracting tokens:", error);
      figma.ui.postMessage({
        type: 'error',
        message: `Error extracting tokens: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  } else if (msg.type === 'apply-color-format') {
    // Handle color format change requests from UI
    if (msg.colorFormat) {
      currentColorFormat = msg.colorFormat;
      console.log(`Color format set to: ${currentColorFormat}`);
      
      try {
        if (!originalTokenData) {
          // If we don't have original data, extract it first
          originalTokenData = await extractDTCGVariables();
        }
        
        // Apply color transformation to a copy of the original data
        const transformedTokens = formatAllColors(
          JSON.parse(JSON.stringify(originalTokenData)), 
          currentColorFormat
        );
        
        // Send transformed tokens back to UI
        figma.ui.postMessage({
          type: 'tokens-data',
          data: transformedTokens
        });
      } catch (error: unknown) {
        console.error("Error applying color format:", error);
        figma.ui.postMessage({
          type: 'error',
          message: `Error applying color format: ${error instanceof Error ? error.message : "Unknown error"}`
        });
      }
    }
  } else if (msg.type === 'update-variables') {
    // Handle variable update requests from UI
    try {
      console.log("Received update variables request");
      
      // Process the update
      const result = await handleUpdateVariables(msg.data);
      
      // Send response back to UI
      figma.ui.postMessage({
        type: 'update-variables-result',
        success: result.success,
        error: result.error,
        warnings: result.warnings,
        created: result.created,
        updated: result.updated,
        collections: result.collections,
        modes: result.modes,
        renamed: result.renamed,
        deleted: result.deleted
      });
    } catch (error: unknown) {
      console.error("Error handling variable update:", error);
      figma.ui.postMessage({
        type: 'update-variables-result',
        success: false,
        error: `Error handling variable update: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  } else if (msg.type === 'export-tokens') {
    try {
      console.log("Received export tokens request with options:", msg.options);
      
      // If we don't have token data, extract it first
      if (!originalTokenData) {
        originalTokenData = await extractDTCGVariables();
      }
      
      // Apply current color format if needed
      const dataToExport = formatAllColors(
        JSON.parse(JSON.stringify(originalTokenData)),
        currentColorFormat
      );
      
      // Log received options
      console.log('Export options received:', {
        format: msg.options.format,
        flattenStructure: Boolean(msg.options.flattenStructure),
        includeCompleteFile: Boolean(msg.options.includeCompleteFile)
      });
      
      // Generate and download a zip file with exported tokens
      // Now passing the user-selected options from the export dialog
      await exportVariablesToZip(dataToExport, {
        format: msg.options.format, // Pass the exact format from options
        flattenStructure: Boolean(msg.options.flattenStructure),
        includeCompleteFile: Boolean(msg.options.includeCompleteFile),
        includeMetadata: true,
        selectedCollections: msg.options.selectedCollections || {},
        selectedModes: msg.options.selectedModes || {},
        // Pass style dictionary options if available
        styleDictionary: msg.options.styleDictionary
      });
      
      // Notify UI that export completed successfully
      figma.ui.postMessage({
        type: 'export-complete',
        success: true
      });
    } catch (error: unknown) {
      console.error("Error exporting tokens:", error);
      figma.ui.postMessage({
        type: 'error',
        message: `Error exporting tokens: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  } else if (msg.type === 'resize') {
    // Handle window resize
    if (msg.size && typeof msg.size.w === 'number' && typeof msg.size.h === 'number') {
      // Resize the plugin window
      figma.ui.resize(msg.size.w, msg.size.h);
      // Store the size in client storage
      figma.clientStorage.setAsync('window-size', msg.size).catch(err => {
        console.error("Error saving window size:", err);
      });
      console.log("Resized plugin window to:", msg.size);
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};