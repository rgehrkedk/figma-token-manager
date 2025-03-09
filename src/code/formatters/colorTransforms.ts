/**
 * Color transformation utilities inspired by Style Dictionary
 */

// Type for color object
interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// Type for HSL color
interface HSLColor {
  h: number;
  s: number;
  l: number;
  a?: number;
}

/**
 * Available color formats
 */
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

/**
 * Converts RGBA object (Figma format) to hex string
 */
export function rgbaToHex({ r, g, b, a = 1 }: RGBColor): string {
  const red = Math.round(r * 255).toString(16).padStart(2, '0');
  const green = Math.round(g * 255).toString(16).padStart(2, '0');
  const blue = Math.round(b * 255).toString(16).padStart(2, '0');
  
  if (a !== undefined && a < 1) {
    const alpha = Math.round(a * 255).toString(16).padStart(2, '0');
    return `#${red}${green}${blue}${alpha}`;
  }
  
  return `#${red}${green}${blue}`;
}

/**
 * Converts RGBA object to RGB/RGBA string
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
        return rgbaToHex(color);
      case 'rgb':
      case 'rgba':
        return rgbaToRgb(color);
      case 'hsl':
      case 'hsla':
        return rgbaToHsl(color);
      default:
        return rgbaToHex(color);
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
  
  // Build a reference map of all token paths for resolving references
  const tokenReferenceMap = new Map<string, { value: any, type: string }>();
  
  // First pass: collect all token paths and their values
  function collectTokens(obj: any, path: string = '') {
    if (!obj || typeof obj !== 'object') return;
    
    // If it's a DTCG token with $value and $type
    if (obj.$value !== undefined && obj.$type !== undefined) {
      tokenReferenceMap.set(path, { value: obj.$value, type: obj.$type });
      return;
    }
    
    // For nested objects
    if (!Array.isArray(obj)) {
      for (const key in obj) {
        const newPath = path ? `${path}.${key}` : key;
        collectTokens(obj[key], newPath);
      }
    }
  }
  
  // Second pass: process and transform color values
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
  
  // Build the reference map
  for (const collection in result) {
    for (const mode in result[collection]) {
      collectTokens(result[collection][mode], `${collection}.${mode}`);
    }
  }
  
  // Process the entire token set
  for (const collection in result) {
    for (const mode in result[collection]) {
      result[collection][mode] = processTokenValue(result[collection][mode]);
    }
  }
  
  return result;
}