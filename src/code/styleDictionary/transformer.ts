/**
 * Style Dictionary Transformer
 * 
 * Transforms token data from Figma format to Style Dictionary format
 * and handles the generation of platform-specific token files.
 */

import { TokenData, DTCGToken } from '../types';
import { resolveReferences } from '../formatters/tokenResolver';

// Define the Style Dictionary minimal types needed
export interface StyleDictionaryToken {
  value: any;
  type?: string;
  description?: string;
  original?: any;
  attributes?: Record<string, any>;
}

// Define platform output options
export type OutputPlatform = 'web' | 'ios' | 'android';

// Define output format options
export type OutputFormat = 'css' | 'scss' | 'js' | 'json' | 'ios' | 'android';

// Options for StyleDictionary generation
export interface StyleDictionaryOptions {
  platforms: OutputPlatform[];
  useRem?: boolean;
  remSize?: number;
  includeDocumentation?: boolean;
}

/**
 * Transforms Figma token data to Style Dictionary format
 * 
 * @param tokenData The token data from Figma
 * @param options Style Dictionary transformation options
 * @returns Transformed token data in Style Dictionary format
 */
export function transformToStyleDictionary(tokenData: TokenData): Record<string, StyleDictionaryToken> {
  // First, resolve all references in the token data
  const resolvedTokens = resolveReferences(tokenData);
  
  // Create a flat dictionary of tokens in Style Dictionary format
  const styleDictionaryTokens: Record<string, StyleDictionaryToken> = {};
  
  // Process each collection
  Object.entries(resolvedTokens).forEach(([collection, collectionData]) => {
    // Process all modes
    Object.entries(collectionData).forEach(([modeName, modeData]) => {
      processTokens(modeData, collection, modeName, styleDictionaryTokens);
    });
  });
  
  return styleDictionaryTokens;
}

/**
 * Process tokens recursively and convert to Style Dictionary format
 * 
 * @param tokenObj The token object to process
 * @param collection The collection name
 * @param mode The mode name
 * @param result The result object to store processed tokens
 */
function processTokens(
  tokenObj: any, 
  collection: string,
  mode: string,
  result: Record<string, StyleDictionaryToken> = {},
  path: string = ''
): Record<string, StyleDictionaryToken> {
  if (!tokenObj || typeof tokenObj !== 'object') {
    return result;
  }
  
  // Process DTCG format tokens ($value, $type)
  if (tokenObj.$value !== undefined && tokenObj.$type !== undefined) {
    // Create a key that includes the collection, mode, and path
    // Format: collection.mode.path (or just collection.mode if no path)
    const key = path ? `${collection}.${mode}.${path}` : `${collection}.${mode}`;
    
    // Convert to Style Dictionary format
    result[key] = {
      value: tokenObj.$value,
      type: tokenObj.$type,
      description: tokenObj.$description,
      original: tokenObj.$originalValue || tokenObj.$value,
      attributes: {
        collection,
        mode,
        path,
        resolvedFrom: tokenObj.$resolvedFrom
      }
    };
    
    return result;
  }
  
  // Process nested objects recursively
  Object.entries(tokenObj).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      const newPath = path ? `${path}.${key}` : key;
      processTokens(value, collection, mode, result, newPath);
    }
  });
  
  return result;
}

/**
 * Generate a Style Dictionary configuration object
 * 
 * @param tokens The transformed token data
 * @param options Style Dictionary options
 * @returns Style Dictionary configuration
 */
export function generateStyleDictionaryConfig(
  tokens: Record<string, StyleDictionaryToken>, 
  options: StyleDictionaryOptions
): any {
  const config = {
    tokens,
    platforms: {}
  };
  
  // Configure platforms based on options
  if (options.platforms.includes('web')) {
    config.platforms['web'] = {
      transformGroup: 'web',
      buildPath: 'dist/web/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            showFileHeader: false
          }
        },
        {
          destination: 'tokens.scss',
          format: 'scss/variables',
          options: {
            showFileHeader: false
          }
        },
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
          options: {
            showFileHeader: false
          }
        }
      ],
      transforms: ['name/cti/kebab', 'size/rem']
    };
  }
  
  if (options.platforms.includes('ios')) {
    config.platforms['ios'] = {
      transformGroup: 'ios',
      buildPath: 'dist/ios/',
      files: [
        {
          destination: 'StyleDictionary.swift',
          format: 'ios-swift/class.swift',
          className: 'StyleDictionary',
          options: {
            showFileHeader: false
          }
        }
      ]
    };
  }
  
  if (options.platforms.includes('android')) {
    config.platforms['android'] = {
      transformGroup: 'android',
      buildPath: 'dist/android/',
      files: [
        {
          destination: 'colors.xml',
          format: 'android/colors',
          options: {
            showFileHeader: false
          }
        },
        {
          destination: 'dimens.xml',
          format: 'android/dimens',
          options: {
            showFileHeader: false
          }
        }
      ]
    };
  }
  
  return config;
}

/**
 * Creates a basic Style Dictionary platform-specific transform
 * 
 * @param styleDictionaryTokens The tokens in Style Dictionary format
 * @param platform The target platform
 * @param format The output format
 * @returns The transformed output
 */
export function createPlatformOutput(
  styleDictionaryTokens: Record<string, StyleDictionaryToken>,
  platform: OutputPlatform,
  format: OutputFormat
): string {
  // Basic implementation that would be replaced with actual Style Dictionary transforms
  if (platform === 'web') {
    if (format === 'css') {
      return generateCSSVariables(styleDictionaryTokens);
    } else if (format === 'scss') {
      return generateSCSSVariables(styleDictionaryTokens);
    } else if (format === 'js') {
      return generateJSVariables(styleDictionaryTokens);
    }
  } else if (platform === 'ios') {
    return generateIOSOutput(styleDictionaryTokens);
  } else if (platform === 'android') {
    return generateAndroidOutput(styleDictionaryTokens);
  }
  
  // Fallback to JSON format
  return JSON.stringify(styleDictionaryTokens, null, 2);
}

/**
 * Generate CSS variables from tokens
 */
function generateCSSVariables(tokens: Record<string, StyleDictionaryToken>): string {
  let css = ':root {\n';
  
  Object.entries(tokens).forEach(([path, token]) => {
    const name = path.replace(/\./g, '-').toLowerCase();
    let value = token.value;
    
    // Handle different token types
    if (token.type === 'color') {
      // Ensure color values have a proper format
      if (typeof value === 'string' && !value.startsWith('#') && !value.startsWith('rgb')) {
        value = `#${value}`;
      }
    } else if (token.type === 'dimension') {
      // Convert dimension values to px if they don't have units
      if (typeof value === 'number') {
        value = `${value}px`;
      }
    }
    
    css += `  --${name}: ${value};\n`;
  });
  
  css += '}\n';
  return css;
}

/**
 * Generate SCSS variables from tokens
 */
function generateSCSSVariables(tokens: Record<string, StyleDictionaryToken>): string {
  let scss = '';
  
  Object.entries(tokens).forEach(([path, token]) => {
    const name = path.replace(/\./g, '-').toLowerCase();
    let value = token.value;
    
    // Handle different token types
    if (token.type === 'color') {
      // Ensure color values have a proper format
      if (typeof value === 'string' && !value.startsWith('#') && !value.startsWith('rgb')) {
        value = `#${value}`;
      }
    } else if (token.type === 'dimension') {
      // Convert dimension values to px if they don't have units
      if (typeof value === 'number') {
        value = `${value}px`;
      }
    }
    
    scss += `$${name}: ${value};\n`;
  });
  
  return scss;
}

/**
 * Generate JavaScript variables from tokens
 */
function generateJSVariables(tokens: Record<string, StyleDictionaryToken>): string {
  let js = 'export const tokens = {\n';
  
  // Process tokens by category
  const categories: Record<string, Record<string, any>> = {};
  
  Object.entries(tokens).forEach(([path, token]) => {
    const parts = path.split('.');
    const category = parts[0];
    const key = parts.slice(1).join('_');
    
    if (!categories[category]) {
      categories[category] = {};
    }
    
    categories[category][key] = token.value;
  });
  
  // Output each category
  Object.entries(categories).forEach(([category, values], index) => {
    js += `  ${category}: {\n`;
    
    Object.entries(values).forEach(([key, value], valueIndex) => {
      // Format the value based on its type
      const formattedValue = typeof value === 'string' ? `"${value}"` : value;
      js += `    ${key}: ${formattedValue}${valueIndex < Object.keys(values).length - 1 ? ',' : ''}\n`;
    });
    
    js += `  }${index < Object.keys(categories).length - 1 ? ',' : ''}\n`;
  });
  
  js += '};\n';
  return js;
}

/**
 * Generate iOS Swift code from tokens
 */
function generateIOSOutput(tokens: Record<string, StyleDictionaryToken>): string {
  let swift = 'import UIKit\n\npublic class StyleDictionary {\n';
  
  // Process tokens by category
  const categories: Record<string, Record<string, any>> = {};
  
  Object.entries(tokens).forEach(([path, token]) => {
    const parts = path.split('.');
    const category = parts[0];
    const key = parts.slice(1).join('_');
    
    if (!categories[category]) {
      categories[category] = {};
    }
    
    categories[category][key] = token;
  });
  
  // Output each category as a nested struct
  Object.entries(categories).forEach(([category, values]) => {
    swift += `  public struct ${category.charAt(0).toUpperCase() + category.substring(1)} {\n`;
    
    Object.entries(values).forEach(([key, token]) => {
      const { value, type } = token as StyleDictionaryToken;
      
      // Format the value based on its type
      let formattedValue: string;
      let swiftType: string;
      
      if (type === 'color') {
        swiftType = 'UIColor';
        // Basic color conversion - would need more sophisticated parsing for production
        formattedValue = `UIColor(red: 0, green: 0, blue: 0, alpha: 1.0)`;
      } else if (type === 'dimension') {
        swiftType = 'CGFloat';
        formattedValue = typeof value === 'number' ? value.toString() : '0';
      } else {
        swiftType = 'String';
        formattedValue = typeof value === 'string' ? `"${value}"` : value.toString();
      }
      
      swift += `    public static let ${key}: ${swiftType} = ${formattedValue}\n`;
    });
    
    swift += '  }\n\n';
  });
  
  swift += '}\n';
  return swift;
}

/**
 * Generate Android XML from tokens
 */
function generateAndroidOutput(tokens: Record<string, StyleDictionaryToken>): string {
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n';
  
  Object.entries(tokens).forEach(([path, token]) => {
    const name = path.replace(/\./g, '_').toLowerCase();
    const { value, type } = token;
    
    if (type === 'color') {
      // Basic color formatting - would need more sophisticated parsing for production
      let colorValue = value;
      if (typeof colorValue === 'string' && !colorValue.startsWith('#')) {
        colorValue = `#${colorValue}`;
      }
      xml += `  <color name="${name}">${colorValue}</color>\n`;
    } else if (type === 'dimension') {
      // Format dimension values for Android
      let dimensionValue = value;
      if (typeof dimensionValue === 'number') {
        dimensionValue = `${dimensionValue}dp`;
      }
      xml += `  <dimen name="${name}">${dimensionValue}</dimen>\n`;
    } else {
      // Other values as string resources
      xml += `  <string name="${name}">${value}</string>\n`;
    }
  });
  
  xml += '</resources>\n';
  return xml;
}

/**
 * Generate documentation for tokens
 * 
 * @param tokens The tokens in Style Dictionary format
 * @param collectionName The name of the collection
 * @param modeName The name of the mode
 * @returns Documentation in Markdown format
 */
export function generateDocumentation(
  tokens: Record<string, StyleDictionaryToken>,
  collectionName: string,
  modeName: string
): string {
  // Generate documentation in Markdown format
  let markdown = `# ${collectionName} - ${modeName} Tokens\n\n`;
  
  // Group tokens by type
  const tokensByType: Record<string, StyleDictionaryToken[]> = {};
  
  Object.entries(tokens).forEach(([path, token]) => {
    const type = token.type || 'other';
    
    if (!tokensByType[type]) {
      tokensByType[type] = [];
    }
    
    tokensByType[type].push({
      ...token,
      // Add path to token for documentation
      attributes: {
        ...token.attributes,
        path
      }
    });
  });
  
  // Document each type of token
  Object.entries(tokensByType).forEach(([type, tokens]) => {
    markdown += `## ${type.charAt(0).toUpperCase() + type.slice(1)} Tokens\n\n`;
    
    // Create a table for this type
    markdown += `| Name | Value | Description |\n`;
    markdown += `|------|-------|-------------|\n`;
    
    tokens.forEach(token => {
      const path = token.attributes?.path || '';
      const name = path.replace(/\./g, '-');
      const value = typeof token.value === 'object' 
        ? JSON.stringify(token.value) 
        : token.value;
      const description = token.description || '';
      
      markdown += `| \`${name}\` | \`${value}\` | ${description} |\n`;
    });
    
    markdown += '\n';
  });
  
  return markdown;
}