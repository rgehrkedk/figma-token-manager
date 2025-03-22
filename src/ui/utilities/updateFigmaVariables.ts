/**
 * updateFigmaVariables.ts
 * 
 * Handles updating Figma variables from edited JSON
 */

/**
 * Updates Figma variables with modified JSON data
 * @param jsonData The modified JSON data to apply to Figma variables
 */
export function updateFigmaVariables(jsonData: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create a deep copy of the data to avoid modifications
      const jsonDataCopy = JSON.parse(JSON.stringify(jsonData));
      
      // Create a message to send to the plugin
      const message = {
        type: 'update-variables',
        data: jsonDataCopy
      };
      
      // Log the data being sent (for debugging)
      console.log('Sending data to Figma plugin:', JSON.stringify(jsonDataCopy));
      
      // Send the message to the plugin
      parent.postMessage({ pluginMessage: message }, '*');
      
      // Set up a listener for the response
      const messageListener = (event: MessageEvent) => {
        const response = event.data.pluginMessage;
        
        if (!response || !response.type) return;
        
        // Check if this is a response to our update request
        if (response.type === 'update-variables-result') {
          // Clean up the listener
          window.removeEventListener('message', messageListener);
          
          if (response.success) {
            // Log statistics if available
            if (response.created !== undefined || response.updated !== undefined) {
              console.log(`Variables updated: ${response.created || 0} created, ${response.updated || 0} updated`);
            }
            
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to update variables'));
          }
        }
      };
      
      // Add the listener
      window.addEventListener('message', messageListener);
      
      // Set a timeout to avoid hanging if no response
      setTimeout(() => {
        window.removeEventListener('message', messageListener);
        reject(new Error('Timeout waiting for response from Figma plugin'));
      }, 30000); // 30 second timeout for larger variable sets
    } catch (error) {
      reject(error);
    }
  });
}