# Figma Token Manager - DTCG Edition

A Figma plugin that exports design variables as structured design tokens, fully compliant with the [Design Tokens Community Group (DTCG)](https://www.designtokens.org/) format specification. This plugin ensures proper type definitions, reference handling, and compatibility with token transformation tools like Style Dictionary.

## Key Features

- **DTCG Format Compliance**: Generates tokens with proper `$value` and `$type` fields following the DTCG specification
- **Separate Files Export**: Option to export each collection/mode as a separate file for easier management
- **Multiple Format Support**: Export in either DTCG format or a simplified legacy format
- **Reference Resolution**: Properly resolves variable references and aliases
- **Reference Validation**: Identifies and attempts to fix broken references
- **Type Inference**: Automatically detects and assigns correct token types (color, dimension, etc.)
- **Collection & Mode Filtering**: Select which collections and modes to include in the export
- **Flat Structure Option**: Generate a flat token structure for easier reference resolution
- **Preview & Validation**: View your tokens and validate references before exporting

## Usage

1. Run the plugin from Figma's plugins menu
2. The plugin will automatically extract all variables from your document
3. Choose your export options:
   - **Format**: DTCG Format (recommended) or Legacy Format
   - **Export Method**: Single combined file or separate files by collection/mode (default)
   - **Reference Validation**: Enable to verify and fix references
   - **Structure**: Nested (preserves original structure) or Flat (easier for reference resolution)
4. Select collections and modes to include
5. Preview the JSON structure before export
6. Click "Validate References" to check for potential problems
7. Click "Download JSON" to export the tokens

## Export Formats

### DTCG Format (Default)

The DTCG format structures tokens with `$value` and `$type` properties:

```json
{
  "colors": {
    "light": {
      "brand": {
        "primary": {
          "$value": "#0366D6",
          "$type": "color"
        }
      }
    }
  }
}
```

Benefits:
- Full compatibility with DTCG specification
- Works with Style Dictionary and other token transformation tools
- Explicit type definitions for every token
- Properly formatted reference syntax

### Legacy Format (Simple JSON)

A simplified format with direct values:

```json
{
  "colors": {
    "light": {
      "brand": {
        "primary": "#0366D6"
      }
    }
  }
}
```

## Reference Handling

References to other variables are represented in the format `{path/to/token}`. The plugin automatically:

1. **Resolves Aliases**: Converts Figma's internal variable references to path-based references
2. **Validates References**: Checks if all referenced tokens exist in the exported set
3. **Fixes References**: Attempts to correct broken references when possible
4. **Identifies Problems**: Shows a list of unresolved references that need attention

## DTCG Format Compliance

This plugin ensures that all tokens adhere to the DTCG specification:

1. **Required Fields**: All tokens include both `$value` and `$type` properties
2. **Proper Types**: Types are automatically determined based on the token value
3. **References**: Reference tokens are properly marked with type `reference`
4. **Color Format**: Colors are exported in hex format (#RRGGBB or #RRGGBBAA)
5. **Dimensions**: Values with units are properly identified as dimensions

## Type Definitions

The plugin automatically assigns these token types:

- `color`: For color values (#RRGGBB, rgba, etc.)
- `dimension`: For values with units (px, rem, em, %, etc.)
- `number`: For numeric values without units
- `string`: For text values
- `boolean`: For true/false values
- `reference`: For references to other tokens

## Resolving Reference Issues

If you encounter broken references:

1. Make sure all referenced tokens are included in your selected collections/modes
2. Try using the "Flat Structure" option for simpler reference paths
3. Ensure your variable naming in Figma follows a consistent pattern
4. Use "Validate References" to identify problematic references

## Development

To modify or enhance the plugin:

1. Clone the repository
2. Install dependencies: `npm install`
3. Make your changes to the source files
4. Build the plugin: `npm run build`
5. Test the plugin in Figma

## Building & Distribution

1. Build the plugin:
   ```bash
   npm run build
   ```

2. Package for distribution:
   ```bash
   mkdir -p plugin-export
   cp manifest.json plugin-export/
   cp -r dist plugin-export/
   cd plugin-export
   zip -r ../figma-token-manager.zip .
   ```

3. Import into Figma:
   - In Figma Desktop: Plugins > Development > Import plugin from manifest...
   - Select the manifest.json file from the extracted folder
   - Run the plugin: Plugins > Development > Design Token Export