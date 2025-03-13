/**
 * Type definitions for the Figma Token Manager
 */

// Available color formats
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

// Message types for communication with UI
export interface UIMessage {
  type: string;
  colorFormat?: ColorFormat;
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
  $original?: string;
  $resolvedFrom?: string;
  $originalValue?: any;
}

// Type for reference validation problems
export interface ReferenceError {
  path: string;
  reference: string;
  message: string;
  potentialMatches?: Array<{ path: string; similarity: number }>;
}

// Plugin settings type
export interface PluginSettings {
  format: 'dtcg' | 'legacy';
  separateFiles: boolean;
  validateReferences: boolean;
  flatStructure: boolean;
  colorFormat: ColorFormat;
}

// Token Reference Map
export interface TokenReferenceMap {
  [path: string]: {
    value: any;
    type: string;
    originalPath?: string;
  };
}

// Resolved Reference
export interface ResolvedReference {
  value: any;
  type: string;
  originalReference?: string;
  originalPath?: string;
  isResolved: boolean;
  resolvedFrom?: string;
}

// Diagnosis result
export interface DiagnosisResult {
  unresolvedReferences: ReferenceError[];
  suggestedFixes: Array<{
    path: string;
    original: string;
    suggested: string;
  }>;
  resolvedCount: number;
  unresolvedCount: number;
}

// Visual token interface
export interface VisualToken {
  path: string;
  type: string;
  value: any;
  originalValue?: any;
  referencedValue?: any;
  referencedType?: string;
  resolvedFrom?: string;
}