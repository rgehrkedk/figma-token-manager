/**
 * Types for Export Dialog components
 */

/**
 * Token interfaces for type safety
 */
export interface DTCGToken {
  $value: any;
  $type: string;
  $description?: string;
  $resolvedFrom?: string;
  $originalValue?: any;
  [key: string]: any;
}

export interface TokenGroup {
  [key: string]: DTCGToken | TokenGroup;
}

export interface TokenMode {
  [key: string]: DTCGToken | TokenGroup;
}

export interface TokenCollection {
  [modeName: string]: TokenMode;
}

export interface TokenData {
  [collectionName: string]: TokenCollection;
}

/**
 * Export dialog options interface
 */
export interface ExportDialogOptions {
  tokenData: TokenData;
  onExport: (options: ExportOptions) => void;
  onCancel: () => void;
}

/**
 * Export options interface
 */
export interface ExportOptions {
  selectedCollections: Record<string, boolean>;
  selectedModes: Record<string, Record<string, boolean>>;
  includeCompleteFile: boolean;
  flattenStructure: boolean;
  format: 'dtcg' | 'legacy' | 'style-dictionary';
  styleDictionary?: {
    platforms: string[];
    formats: string[];
    useRem?: boolean;
    remBaseFontSize?: number;
    colorFormat?: 'hex' | 'rgb' | 'rgba' | 'hsl';
    includeDocumentation?: boolean;
  };
}