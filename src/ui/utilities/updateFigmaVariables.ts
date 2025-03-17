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
        // Create a message to send to the plugin
        const message = {
          type: 'update-variables',
          data: jsonData
        };
        
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
        }, 10000); // 10 second timeout
      } catch (error) {
        reject(error);
      }
    });
  }