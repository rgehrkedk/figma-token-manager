/**
 * Comprehensive color utilities for token management
 * Combines functionality from color.ts and colorTransforms.ts
 */

// Type for color format options
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

// Type for color object
export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// Type for HSL color
export interface HSLColor {
  h: number;
  s: number;
  l: number;
  a?: number;
}

/**
 * Formats RGBA color object to hex string
 * (Basic version from color.ts)
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

/**
 * Converts RGBA object to RGB/RGBA string
 * (Enhanced version from colorTransforms.ts)
 */
export function rgbaToRgb({ r, g, b, a = 1 }: RGBColor): string {
  const red = Math.round(r * 255);
  const green = Math.round(g * 255);
  const blue = Math.round(b * 255);
  
  if (a !== undefined && a < 1) {
    return `rgba(${red}, ${green}, ${blue}, ${a.toFixed(2)})`;
  }
  
  return `rgb(${red}, ${green}, ${blue})`;
}

/**
 * Converts RGBA to HSL/HSLA string
 */
export function rgbaToHsl({ r, g, b, a = 1 }: RGBColor): string {
  // Convert RGB to HSL
  const hslColor = rgbToHslObject({ r, g, b, a });
  
  if (a !== undefined && a < 1) {
    return `hsla(${Math.round(hslColor.h)}deg, ${Math.round(hslColor.s)}%, ${Math.round(hslColor.l)}%, ${hslColor.a?.toFixed(2)})`;
  }
  
  return `hsl(${Math.round(hslColor.h)}deg, ${Math.round(hslColor.s)}%, ${Math.round(hslColor.l)}%)`;
}

/**
 * Converts RGB to HSL object for further manipulation
 */
function rgbToHslObject({ r, g, b, a = 1 }: RGBColor): HSLColor {
  // Figma's colors are already in 0-1 range
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / delta + 2) * 60;
        break;
      case b:
        h = ((r - g) / delta + 4) * 60;
        break;
    }
  }
  
  return {
    h,
    s: s * 100,
    l: l * 100,
    a
  };
}

/**
 * Converts a hex string to RGBA object
 */
export function hexToRgba(hex: string): RGBColor {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle shorthand hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Handle hex with alpha
  let alpha = 1;
  if (hex.length === 8) {
    alpha = parseInt(hex.slice(6, 8), 16) / 255;
    hex = hex.substring(0, 6);
  }
  
  const bigint = parseInt(hex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  
  return { r, g, b, a: alpha };
}

/**
 * Transforms a color value to requested format
 */
export function transformColorToFormat(color: any, format: ColorFormat): string {
  // If it's already a string, check if it's a hex code
  if (typeof color === 'string') {
    if (color.startsWith('#')) {
      const rgbaColor = hexToRgba(color);
      
      switch (format) {
        case 'hex':
          return color;
        case 'rgb':
        case 'rgba':
          return rgbaToRgb(rgbaColor);
        case 'hsl':
        case 'hsla':
          return rgbaToHsl(rgbaColor);
      }
    }
    
    // For any other string format, return as is
    return color;
  }
  
  // If it's a Figma color object
  if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
    switch (format) {
      case 'hex':
        return formatRGBAToHex(color);
      case 'rgb':
      case 'rgba':
        return rgbaToRgb(color);
      case 'hsl':
      case 'hsla':
        return rgbaToHsl(color);
      default:
        return formatRGBAToHex(color);
    }
  }
  
  // For any other case, return as is
  return color;
}

/**
 * Formats all color tokens in a token set based on the specified format
 */
export function formatAllColors(tokens: any, format: ColorFormat): any {
  // Deep clone to avoid modifying the original
  const result = JSON.parse(JSON.stringify(tokens));
  
  // Process all tokens in the data structure
  function processTokenValue(obj: any): any {
    // For DTCG format tokens
    if (obj && typeof obj === 'object' && obj.$value !== undefined) {
      if (obj.$type === 'color') {
        // Handle reference values (values that start with '{' and end with '}')
        if (typeof obj.$value === 'string' && obj.$value.startsWith('{') && obj.$value.endsWith('}')) {
          // This is a reference, don't transform it
          return obj;
        }
        obj.$value = transformColorToFormat(obj.$value, format);
      }
      return obj;
    }
    
    // For non-token objects
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const key in obj) {
        obj[key] = processTokenValue(obj[key]);
      }
    }
    
    return obj;
  }
  
  // Process the entire token set
  for (const collection in result) {
    for (const mode in result[collection]) {
      result[collection][mode] = processTokenValue(result[collection][mode]);
    }
  }
  
  return result;
}