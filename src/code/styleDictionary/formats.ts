/**
 * Style Dictionary Format Definitions
 * 
 * Defines output formats for the Style Dictionary integration
 */

import { StyleDictionaryToken } from './transformer';

// Define format options
export type FormatType = 
  | 'css' 
  | 'scss' 
  | 'js' 
  | 'json' 
  | 'ios-swift' 
  | 'android-xml';

/**
 * Generate CSS custom properties (variables) format
 * 
 * @param tokens The tokens to format
 * @returns Formatted CSS
 */
export function formatCssVariables(tokens: Record<string, StyleDictionaryToken>): string {
  let css = `:root {\n`;
  
  Object.entries(tokens).forEach(([name, token]) => {
    // Format the variable name as kebab-case
    const varName = name.replace(/\./g, '-').toLowerCase();
    
    // Format the value based on token type
    let formattedValue = formatTokenValue(token, 'css');
    
    css += `  --${varName}: ${formattedValue};\n`;
  });
  
  css += `}\n`;
  return css;
}

/**
 * Generate SCSS variables format
 * 
 * @param tokens The tokens to format
 * @returns Formatted SCSS
 */
export function formatScssVariables(tokens: Record<string, StyleDictionaryToken>): string {
  let scss = `// Generated SCSS Variables\n\n`;
  
  Object.entries(tokens).forEach(([name, token]) => {
    // Format the variable name as kebab-case
    const varName = name.replace(/\./g, '-').toLowerCase();
    
    // Format the value based on token type
    let formattedValue = formatTokenValue(token, 'scss');
    
    // Add description as comment if available
    if (token.description) {
      scss += `// ${token.description}\n`;
    }
    
    scss += `$${varName}: ${formattedValue};\n\n`;
  });
  
  return scss;
}

/**
 * Generate JavaScript object format
 * 
 * @param tokens The tokens to format
 * @returns Formatted JavaScript
 */
export function formatJavaScript(tokens: Record<string, StyleDictionaryToken>): string {
  let js = `// Generated JavaScript Token File\n\n`;
  js += `export const tokens = {\n`;
  
  // Group tokens by their top-level category
  const categories: Record<string, Record<string, StyleDictionaryToken>> = {};
  
  Object.entries(tokens).forEach(([name, token]) => {
    const parts = name.split('.');
    const category = parts[0];
    const subpath = parts.slice(1).join('.');
    
    if (!categories[category]) {
      categories[category] = {};
    }
    
    categories[category][subpath] = token;
  });
  
  // Output each category
  Object.entries(categories).forEach(([category, categoryTokens], categoryIndex) => {
    js += `  ${safeJsKey(category)}: {\n`;
    
    // Convert nested token structure to JS object
    js += formatNestedTokens(categoryTokens, 4);
    
    // Close the category object
    js += `  }${categoryIndex < Object.keys(categories).length - 1 ? ',' : ''}\n`;
  });
  
  js += `};\n`;
  return js;
}

/**
 * Format nested tokens as a JavaScript object structure
 */
function formatNestedTokens(tokens: Record<string, StyleDictionaryToken>, indent: number = 0): string {
  let result = '';
  const indentStr = ' '.repeat(indent);
  
  // Group tokens by their next level
  const groups: Record<string, any> = {};
  const directTokens: Record<string, StyleDictionaryToken> = {};
  
  Object.entries(tokens).forEach(([path, token]) => {
    const parts = path.split('.');
    
    if (parts.length > 1) {
      // This is a nested token
      const groupKey = parts[0];
      const remainingPath = parts.slice(1).join('.');
      
      if (!groups[groupKey]) {
        groups[groupKey] = {};
      }
      
      groups[groupKey][remainingPath] = token;
    } else {
      // This is a direct token at this level
      directTokens[path] = token;
    }
  });
  
  // Output direct tokens first
  Object.entries(directTokens).forEach(([key, token], index) => {
    // Format the value based on token type
    let formattedValue = formatTokenValue(token, 'js');
    
    // Add description as comment if available
    if (token.description) {
      result += `${indentStr}// ${token.description}\n`;
    }
    
    result += `${indentStr}${safeJsKey(key)}: ${formattedValue},\n`;
  });
  
  // Output nested groups
  Object.entries(groups).forEach(([groupKey, groupTokens], index) => {
    result += `${indentStr}${safeJsKey(groupKey)}: {\n`;
    
    // Recursively format nested tokens
    result += formatNestedTokens(groupTokens, indent + 2);
    
    result += `${indentStr}},\n`;
  });
  
  return result;
}

/**
 * Generate iOS Swift format
 * 
 * @param tokens The tokens to format
 * @returns Formatted Swift code
 */
export function formatIOSSwift(tokens: Record<string, StyleDictionaryToken>): string {
  let swift = `// Generated Swift Token File\n\n`;
  swift += `import UIKit\n\n`;
  swift += `public class StyleDictionary {\n`;
  
  // Group tokens by their top-level category
  const categories: Record<string, Record<string, StyleDictionaryToken>> = {};
  
  Object.entries(tokens).forEach(([name, token]) => {
    const parts = name.split('.');
    const category = parts[0];
    const subpath = parts.slice(1).join('.');
    
    if (!categories[category]) {
      categories[category] = {};
    }
    
    categories[category][subpath] = token;
  });
  
  // Output each category as a nested struct
  Object.entries(categories).forEach(([category, categoryTokens]) => {
    // Capitalize first letter for Swift types
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    
    swift += `  public struct ${categoryName} {\n`;
    
    // Convert nested token structure to Swift properties
    formatSwiftTokens(categoryTokens, swift, 4);
    
    // Close the category struct
    swift += `  }\n\n`;
  });
  
  swift += `}\n`;
  return swift;
}

/**
 * Generate Android XML format
 * 
 * @param tokens The tokens to format
 * @param type The type of Android resources ('colors' or 'dimens')
 * @returns Formatted XML
 */
export function formatAndroidXml(tokens: Record<string, StyleDictionaryToken>, type: 'colors' | 'dimens' = 'colors'): string {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<resources>\n`;
  
  Object.entries(tokens).forEach(([name, token]) => {
    // Only include tokens of the appropriate type
    if ((type === 'colors' && token.type === 'color') ||
        (type === 'dimens' && (token.type === 'dimension' || token.type === 'size'))) {
      
      // Format the name as android_compatible_name
      const resourceName = name.replace(/\./g, '_').toLowerCase();
      
      // Format the value based on token type
      let formattedValue = formatTokenValue(token, type === 'colors' ? 'android-color' : 'android-dimen');
      
      // Add description as comment if available
      if (token.description) {
        xml += `  <!-- ${token.description} -->\n`;
      }
      
      if (type === 'colors') {
        xml += `  <color name="${resourceName}">${formattedValue}</color>\n`;
      } else {
        xml += `  <dimen name="${resourceName}">${formattedValue}</dimen>\n`;
      }
    }
  });
  
  xml += `</resources>\n`;
  return xml;
}

/**
 * Format Swift tokens with proper indentation and types
 */
function formatSwiftTokens(tokens: Record<string, StyleDictionaryToken>, output: string, indent: number = 0): string {
  const indentStr = ' '.repeat(indent);
  
  // Group tokens by their next level
  const groups: Record<string, any> = {};
  const directTokens: Record<string, StyleDictionaryToken> = {};
  
  Object.entries(tokens).forEach(([path, token]) => {
    const parts = path.split('.');
    
    if (parts.length > 1) {
      // This is a nested token
      const groupKey = parts[0];
      const remainingPath = parts.slice(1).join('.');
      
      if (!groups[groupKey]) {
        groups[groupKey] = {};
      }
      
      groups[groupKey][remainingPath] = token;
    } else {
      // This is a direct token at this level
      directTokens[path] = token;
    }
  });
  
  // Output direct tokens first
  Object.entries(directTokens).forEach(([key, token]) => {
    // Determine Swift type based on token type
    let swiftType: string;
    let formattedValue: string;
    
    switch (token.type) {
      case 'color':
        swiftType = 'UIColor';
        formattedValue = formatSwiftColor(token.value);
        break;
      case 'dimension':
      case 'size':
        swiftType = 'CGFloat';
        formattedValue = formatSwiftDimension(token.value);
        break;
      case 'string':
        swiftType = 'String';
        formattedValue = `"${token.value}"`;
        break;
      default:
        swiftType = 'Any';
        formattedValue = formatSwiftValue(token.value);
        break;
    }
    
    // Add description as comment if available
    if (token.description) {
      output += `${indentStr}// ${token.description}\n`;
    }
    
    // Create property with proper Swift syntax
    output += `${indentStr}public static let ${safeSwiftKey(key)}: ${swiftType} = ${formattedValue}\n`;
  });
  
  // Output nested groups
  Object.entries(groups).forEach(([groupKey, groupTokens]) => {
    // Capitalize first letter for Swift types
    const groupTypeName = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
    
    output += `${indentStr}public struct ${groupTypeName} {\n`;
    
    // Recursively format nested tokens
    formatSwiftTokens(groupTokens, output, indent + 2);
    
    output += `${indentStr}}\n`;
  });
  
  return output;
}

/**
 * Format a token value based on its type and target format
 */
function formatTokenValue(token: StyleDictionaryToken, format: string): string {
  const { value, type } = token;
  
  switch (type) {
    case 'color':
      if (format === 'css' || format === 'scss') {
        return formatCssColor(value);
      } else if (format === 'js') {
        return formatJsColor(value);
      } else if (format === 'android-color') {
        return formatAndroidColor(value);
      }
      break;
      
    case 'dimension':
    case 'size':
      if (format === 'css' || format === 'scss') {
        return formatCssDimension(value);
      } else if (format === 'js') {
        return formatJsDimension(value);
      } else if (format === 'android-dimen') {
        return formatAndroidDimension(value);
      }
      break;
      
    case 'string':
      if (format === 'js') {
        return `"${value}"`;
      }
      break;
  }
  
  // Default formatting if no specific formatter matches
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

// Helper functions for formatting specific token types

function formatCssColor(value: any): string {
  if (typeof value === 'string') {
    // Ensure color has # prefix if it's a hex color
    if (/^[0-9a-f]{3,8}$/i.test(value)) {
      return `#${value}`;
    }
    return value;
  }
  return String(value);
}

function formatJsColor(value: any): string {
  if (typeof value === 'string') {
    return `"${formatCssColor(value)}"`;
  }
  return JSON.stringify(value);
}

function formatAndroidColor(value: any): string {
  if (typeof value === 'string') {
    // Ensure color has # prefix
    if (!value.startsWith('#')) {
      return `#${value}`;
    }
    return value;
  }
  return String(value);
}

function formatCssDimension(value: any): string {
  if (typeof value === 'number') {
    // Default to pixels for CSS dimensions
    return `${value}px`;
  } else if (typeof value === 'string') {
    // If it already has a unit, use as is
    if (/^[0-9]+(\.[0-9]+)?(px|rem|em|%|vh|vw|vmin|vmax)$/.test(value)) {
      return value;
    }
    // Otherwise assume pixels
    return `${value}px`;
  }
  return String(value);
}

function formatJsDimension(value: any): string {
  if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value === 'string') {
    return `"${value}"`;
  }
  return JSON.stringify(value);
}

function formatAndroidDimension(value: any): string {
  if (typeof value === 'number') {
    // Default to dp for Android dimensions
    return `${value}dp`;
  } else if (typeof value === 'string') {
    // If it already has a unit, use as is
    if (/^[0-9]+(\.[0-9]+)?(dp|sp|px)$/.test(value)) {
      return value;
    }
    // Otherwise assume dp
    return `${value}dp`;
  }
  return String(value);
}

function formatSwiftColor(value: any): string {
  // Basic implementation - would need more sophisticated color parsing for production
  if (typeof value === 'string') {
    if (value.startsWith('#')) {
      return `UIColor(hex: "${value}")`;
    } else if (value.startsWith('rgb')) {
      return `UIColor(named: "${value}")`;
    }
  }
  return `UIColor.black`;
}

function formatSwiftDimension(value: any): string {
  if (typeof value === 'number') {
    return value.toString();
  }
  return `0`;
}

function formatSwiftValue(value: any): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value === 'boolean') {
    return value.toString();
  }
  return `nil`;
}

/**
 * Ensure JavaScript object keys are valid
 */
function safeJsKey(key: string): string {
  // Replace invalid characters and ensure it's a valid JS identifier
  const sanitized = key.replace(/[^a-zA-Z0-9_$]/g, '_');
  
  // If it starts with a number, prefix with underscore
  if (/^[0-9]/.test(sanitized)) {
    return `_${sanitized}`;
  }
  
  return sanitized;
}

/**
 * Ensure Swift property names are valid
 */
function safeSwiftKey(key: string): string {
  // Replace invalid characters and ensure it's a valid Swift identifier
  const sanitized = key.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // If it starts with a number, prefix with underscore
  if (/^[0-9]/.test(sanitized)) {
    return `_${sanitized}`;
  }
  
  // Swift keywords that need to be escaped
  const keywords = [
    'class', 'struct', 'enum', 'protocol', 'extension', 'let', 'var',
    'func', 'if', 'else', 'switch', 'case', 'default', 'for', 'while',
    'do', 'break', 'continue', 'return', 'throw', 'try', 'catch',
    'import', 'typealias', 'associatedtype', 'init', 'self', 'super',
    'subscript', 'convenience', 'dynamic', 'final', 'indirect', 'lazy',
    'mutating', 'nonmutating', 'optional', 'override', 'required', 'static',
    'unowned', 'weak', 'internal', 'private', 'public', 'open', 'fileprivate'
  ];
  
  // If the sanitized key is a Swift keyword, prefix with underscore
  if (keywords.includes(sanitized)) {
    return `_${sanitized}`;
  }
  
  return sanitized;
}