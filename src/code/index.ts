import { UIMessage } from './types';
import { extractDTCGVariables } from './extractors/dtcgVariables';

// Flag to track if we should extract on startup
let shouldExtractOnStartup = true;

// Show UI with larger size to see more info
figma.showUI(__html__, { width: 600, height: 700 });
console.log("Plugin UI shown");

// Listen for messages from the UI
figma.ui.onmessage = async (msg: UIMessage) => {
  console.log("Plugin received message from UI:", msg.type);
  
  if (msg.type === 'ui-ready') {
    console.log("UI is ready, sending data");
    if (shouldExtractOnStartup) {
      // Only extract once
      shouldExtractOnStartup = false;
      
      try {
        const tokens = await extractDTCGVariables();
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
      const tokens = await extractDTCGVariables();
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
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};