# Style Dictionary Implementation Guide

This document provides a technical overview of how the Style Dictionary integration is implemented in the Figma Token Manager. It's intended for developers who want to understand, modify, or extend the Style Dictionary functionality.

## Architecture Overview

The Style Dictionary integration consists of five main components, all located in the `/src/code/styleDictionary/` directory:

1. **index.ts** - Main entry point that orchestrates the Style Dictionary processing workflow
2. **transformer.ts** - Transforms Figma token data to Style Dictionary format
3. **transforms.ts** - Applies transformations to token values (e.g., rem conversion, color formats)
4. **formats.ts** - Generates platform-specific output formats (CSS, SCSS, JS, Swift, XML)
5. **documentation.ts** - Creates documentation in Markdown and HTML formats

The integration is tied into the main export workflow through the `exportHandler.ts` file, which handles the UI interactions and ZIP file generation.

## Component Details

### index.ts

The main module that:
- Defines interfaces for export options and outputs
- Provides the `processWithStyleDictionary` function that orchestrates the workflow
- Applies transformations based on user options
- Generates platform-specific outputs

```typescript
// Key function
export function processWithStyleDictionary(
  tokenData: TokenData,
  collectionName: string,
  modeName: string,
  options: StyleDictionaryExportOptions
): StyleDictionaryOutput[]
```

### transformer.ts

Transforms Figma tokens to Style Dictionary format by:
- Resolving references between tokens
- Converting to a flat dictionary structure with token paths as keys
- Preserving original token attributes and metadata

```typescript
// Key function
export function transformToStyleDictionary(
  tokenData: TokenData
): Record<string, StyleDictionaryToken>
```

### transforms.ts

Applies value transformations to tokens:
- `transformSizeToRem` - Converts pixel values to rem units
- `transformColor` - Converts colors between different formats (HEX, RGB, RGBA, HSL)

```typescript
// Key functions
export function transformSizeToRem(
  value: number | string, 
  baseFontSize: number = 16
): string

export function transformColor(
  value: string, 
  options: ColorTransformOptions
): string
```

### formats.ts

Generates platform-specific output formats:
- `formatCssVariables` - CSS custom properties
- `formatScssVariables` - SCSS variables
- `formatJavaScript` - JavaScript module
- `formatIOSSwift` - Swift class
- `formatAndroidXml` - Android XML resources

```typescript
// Key functions
export function formatCssVariables(
  tokens: Record<string, StyleDictionaryToken>
): string

export function formatScssVariables(
  tokens: Record<string, StyleDictionaryToken>
): string

export function formatJavaScript(
  tokens: Record<string, StyleDictionaryToken>
): string

export function formatIOSSwift(
  tokens: Record<string, StyleDictionaryToken>
): string

export function formatAndroidXml(
  tokens: Record<string, StyleDictionaryToken>, 
  type: 'colors' | 'dimens' = 'colors'
): string
```

### documentation.ts

Creates comprehensive documentation:
- `generateMarkdownDocumentation` - Markdown format
- `generateHtmlDocumentation` - HTML format with interactive elements

```typescript
// Key functions
export function generateMarkdownDocumentation(
  tokens: Record<string, StyleDictionaryToken>,
  collectionName: string,
  modeName: string,
  options?: DocumentationOptions
): string

export function generateHtmlDocumentation(
  tokens: Record<string, StyleDictionaryToken>,
  collectionName: string,
  modeName: string,
  options?: DocumentationOptions
): string
```

## Data Flow

1. **UI Selection**: User selects Style Dictionary format and options in the export dialog
2. **Export Handler**: The options are passed to `exportVariablesToZip` in `exportHandler.ts`
3. **Style Dictionary Processing**: 
   - `processWithStyleDictionary` is called for each collection/mode
   - Tokens are transformed to Style Dictionary format
   - Values are transformed according to user options
   - Platform-specific outputs are generated
4. **ZIP Creation**: All outputs are added to a ZIP file
5. **Download**: The ZIP file is sent to the UI for download

## Key Interfaces

### StyleDictionaryExportOptions

```typescript
export interface StyleDictionaryExportOptions {
  platforms: StyleDictionaryPlatform[];
  formats: StyleDictionaryFormat[];
  useRem?: boolean;
  remBaseFontSize?: number;
  colorFormat?: 'hex' | 'rgb' | 'rgba' | 'hsl';
  includeDocumentation?: boolean;
}
```

### StyleDictionaryOutput

```typescript
export interface StyleDictionaryOutput {
  fileName: string;
  content: string;
  format: string;
}
```

### StyleDictionaryToken

```typescript
export interface StyleDictionaryToken {
  value: any;
  type?: string;
  description?: string;
  original?: any;
  attributes?: Record<string, any>;
}
```

## Customization Guide

### Adding a New Platform

To add a new platform (e.g., Flutter):

1. Update the `StyleDictionaryPlatform` type in `index.ts`:
   ```typescript
   export type StyleDictionaryPlatform = 'web' | 'ios' | 'android' | 'flutter' | 'all';
   ```

2. Create a new formatter function in `formats.ts`:
   ```typescript
   export function formatFlutterDart(tokens: Record<string, StyleDictionaryToken>): string {
     // Implementation
   }
   ```

3. Update the `processWithStyleDictionary` function in `index.ts` to include the new platform:
   ```typescript
   // Handle Flutter platform
   if (platforms.includes('flutter') || platforms.includes('all')) {
     outputs.push({
       fileName: `${collectionName}_${modeName}.dart`,
       content: formatFlutterDart(transformedTokens),
       format: 'dart'
     });
   }
   ```

4. Update the UI in `exportDialog.ts` to include the new platform option.

### Adding a New Transformation

To add a new transformation (e.g., font size scaling):

1. Add a new function in `transforms.ts`:
   ```typescript
   export function transformFontSize(
     value: number | string, 
     scaleFactor: number = 1.0
   ): string {
     // Implementation
   }
   ```

2. Update the `applyTransformations` function in `index.ts` to apply the new transformation:
   ```typescript
   // Apply transformations
   Object.entries(tokens).forEach(([key, token]) => {
     // ...existing transformations...
     
     // Apply font size scaling if enabled
     else if (token.type === 'fontSizes' && options.scaleFonts) {
       transformedTokens[key].value = transformFontSize(
         token.value, 
         options.fontScaleFactor
       );
     }
   });
   ```

3. Update the `StyleDictionaryExportOptions` interface to include the new options.
4. Update the UI in `exportDialog.ts` to include the new options.

## Best Practices

1. **Maintain backward compatibility** - When making changes, ensure they don't break existing functionality
2. **Follow the existing patterns** - Keep the code style and architecture consistent
3. **Add documentation** - Document new features and update existing documentation
4. **Add error handling** - Use try/catch blocks and provide fallbacks
5. **Test thoroughly** - Test changes with various token structures and options

## Debugging Tips

1. **Console Logging**: Add strategic console.log statements to trace the flow:
   ```typescript
   console.log('Processing with Style Dictionary:', {
     collectionName,
     modeName,
     options,
     tokenCount: Object.keys(sdTokens).length
   });
   ```

2. **Inspect Generated Files**: Review the generated files in the ZIP to ensure they match expectations

3. **Check Token Transformation**: Log a sample token before and after transformation to verify changes:
   ```typescript
   console.log('Before transformation:', JSON.stringify(tokens['color.primary'], null, 2));
   console.log('After transformation:', JSON.stringify(transformedTokens['color.primary'], null, 2));
   ```

4. **UI Debugging**: Use the browser's dev tools to inspect the export dialog and verify the options are correctly captured