/**
 * Global declarations for window extensions
 */

declare global {
    interface Window {
      extractionTimeout: number | null;
    }
  }
  
  // Initialize the extraction timeout property
  window.extractionTimeout = null;
  
  export {};