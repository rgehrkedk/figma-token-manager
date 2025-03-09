// Type definitions for the plugin code

// Message types for communication with UI
export interface UIMessage {
    type: string;
    [key: string]: any;
  }
  
  // Token data structure
  export interface TokenData {
    [collection: string]: {
      [mode: string]: {
        [path: string]: any;
      };
    };
  }
  
  // Reference mapping type
  export type VariableLookup = Map<string, string>;
  
  // DTCG Token structure
  export interface DTCGToken {
    $value: any;
    $type: string;
    $description?: string;
  }
  
  // Type for reference validation problems
  export interface ReferenceError {
    path: string;
    reference: string;
    message: string;
  }
  
  // Plugin settings type
  export interface PluginSettings {
    format: 'dtcg' | 'legacy';
    separateFiles: boolean;
    validateReferences: boolean;
    flatStructure: boolean;
  }