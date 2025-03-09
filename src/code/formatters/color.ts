/**
 * Formats RGBA color object to hex string
 */
export function formatRGBAToHex(color: { r: number; g: number; b: number; a?: number }): string {
    const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
    
    if ('a' in color && color.a !== undefined && color.a !== 1) {
      const a = Math.round(color.a * 255).toString(16).padStart(2, '0');
      return `#${r}${g}${b}${a}`;
    }
    
    return `#${r}${g}${b}`;
  }
  
  /**
   * Maps Figma variable types to DTCG token types
   */
  export function mapToDTCGType(figmaType: string, value: any): string {
    switch (figmaType) {
      case 'COLOR':
        return 'color';
      case 'FLOAT':
        // Heuristic - if the value ends with px, rem, em, etc., it's likely a dimension
        if (typeof value === 'number') {
          return 'number';
        } else if (typeof value === 'string' && 
                  (value.endsWith('px') || value.endsWith('rem') || 
                   value.endsWith('em') || value.endsWith('%'))) {
          return 'dimension';
        }
        return 'number';
      case 'STRING':
        return 'string';
      case 'BOOLEAN':
        return 'boolean';
      default:
        // For unknown types, try to infer from value
        if (typeof value === 'number') {
          return 'number';
        } else if (typeof value === 'string') {
          // Try to detect if it's a dimension or color
          if (value.startsWith('#') || value.startsWith('rgb')) {
            return 'color';
          } else if (value.match(/\d+(\.\d+)?(px|rem|em|%)/)) {
            return 'dimension';
          } else if (value.startsWith('{') && value.endsWith('}')) {
            return 'reference'; // Specifically mark references
          }
          return 'string';
        } else if (typeof value === 'boolean') {
          return 'boolean';
        }
        return 'string'; // Default fallback
    }
  }
  
  /**
   * Helper to create a proper DTCG token object
   */
  export function createDTCGToken(value: any, type: string, description: string = ''): any {
    const token: any = {
      $value: value,
      $type: type
    };
    
    if (description) {
      token.$description = description;
    }
    
    return token;
  }