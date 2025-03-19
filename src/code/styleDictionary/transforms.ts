/**
 * Style Dictionary Transforms
 * 
 * Defines transforms for Style Dictionary tokens
 */

/**
 * Transform size values to rem units
 * 
 * @param value The pixel value to transform to rem
 * @param baseFontSize The base font size to use for rem calculation (default: 16)
 * @returns The value in rem units
 */
export function transformSizeToRem(value: number | string, baseFontSize: number = 16): string {
  // If value is already a string with a unit (like '1rem'), don't convert
  if (typeof value === 'string' && /[a-z%]+$/.test(value)) {
    return value;
  }
  
  // Convert the value to a number
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Calculate rem value using the base font size
  const remValue = numValue / baseFontSize;
  
  // Format the rem value (limit to 4 decimal places, remove trailing zeros)
  return `${remValue.toFixed(4).replace(/\.?0+$/, '')}rem`;
}

/**
 * Transform color values to different formats
 */
export interface ColorTransformOptions {
  format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';
}

/**
 * Parse a color string into component parts
 * 
 * @param color The color string to parse
 * @returns The color components or null if invalid
 */
function parseColor(color: string): { r: number, g: number, b: number, a: number } | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    // Remove # character
    const hex = color.substring(1);
    
    // Parse different hex formats
    if (hex.length === 3) {
      // #RGB format
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b, a: 1 };
    } else if (hex.length === 6) {
      // #RRGGBB format
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return { r, g, b, a: 1 };
    } else if (hex.length === 8) {
      // #RRGGBBAA format
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const a = parseInt(hex.substring(6, 8), 16) / 255;
      return { r, g, b, a };
    }
    return null;
  }
  
  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*(?:\.\d+)?))?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
    return { r, g, b, a };
  }
  
  // Handle hsl/hsla colors (basic support)
  const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*(\d*(?:\.\d+)?))?\)/);
  if (hslMatch) {
    // Convert HSL to RGB (simplified algorithm)
    const h = parseInt(hslMatch[1], 10) / 360;
    const s = parseInt(hslMatch[2], 10) / 100;
    const l = parseInt(hslMatch[3], 10) / 100;
    const a = hslMatch[4] ? parseFloat(hslMatch[4]) : 1;
    
    // HSL to RGB conversion
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a
    };
  }
  
  return null;
}

/**
 * Transform a color value to the specified format
 * 
 * @param value The color value to transform
 * @param options Color transformation options
 * @returns The transformed color string
 */
export function transformColor(value: string, options: ColorTransformOptions): string {
  const { format } = options;
  
  // Parse the color value
  const color = parseColor(value);
  if (!color) {
    // If we can't parse the color, return it as is
    return value;
  }
  
  const { r, g, b, a } = color;
  
  // Transform to the specified format
  switch (format) {
    case 'hex':
      if (a < 1) {
        // If alpha < 1, use 8-digit hex
        const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alphaHex}`;
      } else {
        // Use 6-digit hex for opaque colors
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
      
    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`;
      
    case 'rgba':
      return `rgba(${r}, ${g}, ${b}, ${a})`;
      
    case 'hsl':
    case 'hsla':
      // Convert RGB to HSL
      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;
      
      const max = Math.max(rNorm, gNorm, bNorm);
      const min = Math.min(rNorm, gNorm, bNorm);
      const l = (max + min) / 2;
      
      let h = 0;
      let s = 0;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case rNorm:
            h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
            break;
          case gNorm:
            h = (bNorm - rNorm) / d + 2;
            break;
          case bNorm:
            h = (rNorm - gNorm) / d + 4;
            break;
        }
        
        h /= 6;
      }
      
      const hDeg = Math.round(h * 360);
      const sPercent = Math.round(s * 100);
      const lPercent = Math.round(l * 100);
      
      if (format === 'hsl' || a === 1) {
        return `hsl(${hDeg}, ${sPercent}%, ${lPercent}%)`;
      } else {
        return `hsla(${hDeg}, ${sPercent}%, ${lPercent}%, ${a})`;
      }
  }
  
  // Default fallback
  return value;
}