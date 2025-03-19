/**
 * Style Dictionary Integration
 * 
 * Main module for Style Dictionary integration with the Figma Token Manager
 */

import { transformToStyleDictionary, StyleDictionaryToken } from './transformer';
import { transformSizeToRem, transformColor } from './transforms';
import { generateMarkdownDocumentation, generateHtmlDocumentation } from './documentation';
import { formatCssVariables, formatScssVariables, formatJavaScript, formatIOSSwift, formatAndroidXml } from './formats';
import { TokenData } from '../types';

// Define platform options for Style Dictionary
export type StyleDictionaryPlatform = 'web' | 'ios' | 'android' | 'all';

// Define format options
export type StyleDictionaryFormat = 'css' | 'scss' | 'js' | 'json' | 'ios-swift' | 'android-xml';

// Export options interface
export interface StyleDictionaryExportOptions {
  platforms: StyleDictionaryPlatform[];
  formats: StyleDictionaryFormat[];
  useRem?: boolean;
  remBaseFontSize?: number;
  colorFormat?: 'hex' | 'rgb' | 'rgba' | 'hsl';
  includeDocumentation?: boolean;
}

// Interface for a generated output file
export interface StyleDictionaryOutput {
  fileName: string;
  content: string;
  format: string;
}

/**
 * Process tokens through Style Dictionary
 * 
 * @param tokenData The token data from Figma
 * @param collectionName The name of the collection
 * @param modeName The name of the mode
 * @param options Style Dictionary export options
 * @returns Generated output files
 */
export function processWithStyleDictionary(
  tokenData: TokenData,
  collectionName: string,
  modeName: string,
  options: StyleDictionaryExportOptions
): StyleDictionaryOutput[] {
  const outputs: StyleDictionaryOutput[] = [];
  
  try {
    // Get the specific mode data
    const modeData = tokenData[collectionName]?.[modeName];
    if (!modeData) {
      console.error(`Mode ${modeName} not found in collection ${collectionName}`);
      return outputs;
    }
    
    console.log(`Processing collection '${collectionName}', mode '${modeName}' with Style Dictionary`);
    
    // Transform to Style Dictionary format
    const sdTokens = transformToStyleDictionary({ [collectionName]: { [modeName]: modeData } });
    
    // Filter tokens to only include those from this collection and mode
    const filteredTokens: Record<string, StyleDictionaryToken> = {};
    Object.entries(sdTokens).forEach(([key, token]) => {
      if (
        token.attributes?.collection === collectionName && 
        token.attributes?.mode === modeName
      ) {
        // Create a simplified key without collection and mode prefix for output formats
        const simplifiedKey = token.attributes?.path || '';
        filteredTokens[simplifiedKey] = token;
      }
    });
    
    // Apply transformations based on options
    const transformedTokens = applyTransformations(filteredTokens, options);
    
    // Generate outputs based on selected platforms and formats
    const { platforms, formats, includeDocumentation = true } = options;
    
    // Handle web platform
    if (platforms.includes('web') || platforms.includes('all')) {
      // Generate CSS variables
      if (formats.includes('css')) {
        outputs.push({
          fileName: `${collectionName}_${modeName}.css`,
          content: formatCssVariables(transformedTokens),
          format: 'css'
        });
      }
      
      // Generate SCSS variables
      if (formats.includes('scss')) {
        outputs.push({
          fileName: `${collectionName}_${modeName}.scss`,
          content: formatScssVariables(transformedTokens),
          format: 'scss'
        });
      }
      
      // Generate JavaScript module
      if (formats.includes('js')) {
        outputs.push({
          fileName: `${collectionName}_${modeName}.js`,
          content: formatJavaScript(transformedTokens),
          format: 'js'
        });
      }
      
      // Generate JSON format
      if (formats.includes('json')) {
        outputs.push({
          fileName: `${collectionName}_${modeName}.json`,
          content: JSON.stringify(transformedTokens, null, 2),
          format: 'json'
        });
      }
    }
    
    // Handle iOS platform
    if (platforms.includes('ios') || platforms.includes('all')) {
      outputs.push({
        fileName: `${collectionName}_${modeName}.swift`,
        content: formatIOSSwift(transformedTokens),
        format: 'swift'
      });
    }
    
    // Handle Android platform
    if (platforms.includes('android') || platforms.includes('all')) {
      // Generate colors.xml
      outputs.push({
        fileName: `${collectionName}_${modeName}_colors.xml`,
        content: formatAndroidXml(transformedTokens, 'colors'),
        format: 'xml'
      });
      
      // Generate dimens.xml
      outputs.push({
        fileName: `${collectionName}_${modeName}_dimens.xml`,
        content: formatAndroidXml(transformedTokens, 'dimens'),
        format: 'xml'
      });
    }
    
    // Generate documentation if requested
    if (includeDocumentation) {
      // Create documentation options object with selected formats
      const docOptions = {
        title: `${collectionName} Design Tokens`,
        selectedFormats: formats
      };
      
      // Generate markdown documentation
      outputs.push({
        fileName: `${collectionName}_documentation.md`,
        content: generateMarkdownDocumentation(transformedTokens, collectionName, docOptions, platforms),
        format: 'md'
      });
      
      // Generate HTML documentation
      outputs.push({
        fileName: `${collectionName}_documentation.html`,
        content: generateHtmlDocumentation(transformedTokens, collectionName, docOptions),
        format: 'html'
      });
    }
    
    console.log(`Generated ${outputs.length} output files for ${collectionName}/${modeName}`);
    
    return outputs;
  } catch (error) {
    console.error(`Error processing Style Dictionary for ${collectionName}/${modeName}:`, error);
    return outputs;
  }
}

/**
 * Apply transformations to tokens based on options
 * 
 * @param tokens The tokens to transform
 * @param options Transformation options
 * @returns Transformed tokens
 */
function applyTransformations(tokens: Record<string, any>, options: StyleDictionaryExportOptions): Record<string, any> {
  const { useRem = false, remBaseFontSize = 16, colorFormat = 'hex' } = options;
  
  // Clone tokens to avoid modifying the original
  const transformedTokens: Record<string, any> = {};
  
  // Apply transformations
  Object.entries(tokens).forEach(([key, token]) => {
    // Start with the original token
    transformedTokens[key] = { ...token };
    
    // Apply type-specific transformations
    if (token.type === 'dimension' && useRem) {
      // Transform dimension values to rem
      transformedTokens[key].value = transformSizeToRem(token.value, remBaseFontSize);
    } else if (token.type === 'color' && colorFormat !== 'hex') {
      // Transform color values to the specified format
      transformedTokens[key].value = transformColor(token.value, { format: colorFormat });
    }
  });
  
  return transformedTokens;
}