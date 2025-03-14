import { extractDTCGVariables } from './extractors/dtcgVariables';
import { formatAllColors, ColorFormat } from './formatters/colorUtils';

// Flag to track if we should extract on startup
let shouldExtractOnStartup = true;

// Store current color format
let currentColorFormat: ColorFormat = 'hex';

// Store original extracted tokens for transformations
let originalTokenData: any = null;

// Show UI with larger size to accommodate two-panel layout
figma.showUI(__html__, { width: 1080, height: 800 });
console.log("Plugin UI shown with updated dimensions");

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
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};