# Figma Token Manager

A powerful Figma plugin for managing design variables as standardized design tokens, featuring bidirectional synchronization, advanced reference resolution, and comprehensive export options.

## Overview

Figma Token Manager bridges the gap between Figma Variables and design token systems. It allows designers and developers to extract Figma variables as standardized design tokens, edit them using a JSON interface, and synchronize changes back to Figma. The plugin supports the Design Tokens Community Group (DTCG) format specification, providing robust reference resolution and visual token previews.

## Key Features

### Variable Management
- **Bidirectional Sync**: Extract Figma variables to JSON and update Figma from edited JSON
- **Smart Rename Detection**: Intelligently detect renamed tokens, collections, and groups
- **Collection & Mode Management**: Organize tokens hierarchically by collection and mode
- **Reference Resolution**: Support for token references with dot and slash notation

### Visual Interface
- **Dual View Mode**: Switch between visual preview and JSON editor interfaces
- **Interactive Token Grid**: Browse tokens organized by categories with visual previews
- **Token Details Panel**: View comprehensive information about selected tokens
- **Reference Diagnostics**: Identify and fix broken token references

### Export Capabilities
- **ZIP Export**: Download all tokens as a ZIP file with organized JSON files
- **Structured Output**: Export separate files for each collection and mode
- **Multiple Color Formats**: Choose between HEX, RGB, RGBA, HSL, or HSLA formats
- **Metadata Inclusion**: Optional metadata with export timestamps and document info

## Getting Started

### Installation

1. Open Figma and navigate to the "Plugins" menu
2. Click "Development" > "Import plugin from manifest"
3. Select the `manifest.json` file from this repository

### Basic Usage

1. **Extract Variables**: When you first run the plugin, it automatically extracts all Figma variables
2. **Browse Tokens**: Use the visual interface to explore your design tokens by collection and category
3. **Edit Tokens**: Switch to JSON view to make detailed edits to token structures and values
4. **Save to Figma**: Click the "Save to Figma" button to update your Figma variables

### Working with the JSON Editor

The JSON editor provides a powerful interface for editing your design tokens:

1. Switch to JSON view using the toggle in the header
2. Edit the JSON structure directly with syntax highlighting and line numbers
3. The editor validates your JSON as you type, highlighting errors
4. Click "Save to Figma" to synchronize your changes back to Figma variables

### Exporting Tokens

To export your tokens as a ZIP file:

1. Click the "Export" button in the sidebar
2. Select the collections and modes you want to export
3. Choose your preferred export format:
   - **DTCG (Design Tokens Community Group)** - Default format
   - **Legacy** - Simple key-value format
   - **Style Dictionary** - Multi-platform design token system

4. Configure additional export options:
   - Include complete file with all tokens
   - Use flat structure (no nested directories)
   
5. The plugin generates a ZIP file containing:
   - A complete `tokens.json` file with all tokens (if selected)
   - Individual collection files (e.g., `colors.json`, `spacing.json`)
   - Individual mode files within folders (e.g., `colors/light.json`, `colors/dark.json`)
   - A metadata file with export information
   - Platform-specific files when using Style Dictionary export

## Token Format

### DTCG-Compliant Format (Default)

```json
{
  "colors": {
    "primary": {
      "500": {
        "$value": "#0366D6",
        "$type": "color",
        "$description": "Primary brand color"
      }
    }
  }
}
```

### Supported Token Types

- `color`: Color values in various formats
- `number`: Numeric values
- `dimension`: Measurements with units
- `fontFamily`: Font family names
- `fontWeight`: Font weight values
- `spacing`: Spacing and layout measurements
- `borderRadius`: Corner radius values
- `borderWidth`: Border width values
- `opacity`: Opacity values
- `lineHeight`: Line height values
- `string`: Text strings

### Token References

The plugin supports referencing tokens using either dot or slash notation:

```json
{
  "colors": {
    "primary": {
      "500": {
        "$value": "#0366D6",
        "$type": "color"
      },
      "300": {
        "$value": "{colors.primary.500}",
        "$type": "color"
      }
    }
  }
}
```

## Advanced Features

### Smart Rename Detection

The plugin includes sophisticated algorithms to detect renamed tokens:

- **Token Renaming**: Detect when a token has been renamed (e.g., "50" to "500")
- **Group Renaming**: Identify when a token group path has changed (e.g., "colors/primary" to "colors/brand")
- **Collection Renaming**: Handle renamed collections without data loss

### Metadata Support

The export includes a metadata file with:

- Export date and time
- Document name and ID
- Plugin version
- Export settings

## Project Structure

```
figma-token-manager/
├── package.json           # NPM dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── webpack.config.js      # Webpack configuration
├── manifest.json          # Plugin configuration file
├── README.md              # Documentation
├── src/                   # Source code directory
│   ├── code/              # Main plugin logic
│   │   ├── index.ts       # Plugin entry point 
│   │   ├── updateVariablesHandler.ts  # Handler for updating Figma variables
│   │   ├── exportHandler.ts  # Handler for exporting tokens
│   │   ├── extractors/    # Token extraction modules
│   │   ├── formatters/    # Value formatting utilities
│   │   └── types.ts       # TypeScript type definitions
│   ├── ui/                # UI components
│   │   ├── index.ts       # UI entry point
│   │   ├── components/    # UI component modules
│   │   │   ├── header.ts       # Header with view toggle
│   │   │   ├── sidebarPanel.ts # Sidebar navigation and controls
│   │   │   ├── TokenGrid.ts    # Visual token display grid
│   │   │   ├── jsonViewIntegration.ts # JSON editor integration
│   │   │   └── tokenDetailsPanel.ts   # Token details display
│   │   ├── styles/        # CSS styles
│   │   └── utilities/     # Helper functions
│   └── ui.html            # User interface HTML structure
└── dist/                  # Build output directory
```

## Development

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Figma desktop app

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Import the plugin in Figma (Plugins > Development > Import plugin from manifest)
5. Select the `manifest.json` file from your project

### Building for Production

```bash
npm run build
```

This creates optimized production files in the `dist/` directory.

## Troubleshooting

### Common Issues

**The plugin is slow with large variable sets**
- The performance depends on the number of variables in your document
- Consider working with smaller subsets of variables if possible

**JSON references aren't resolving correctly**
- Check that references use the correct format: `{collection.group.token}` or `{collection/group/token}`
- Ensure the referenced token exists and is correctly defined

**Changes aren't being applied to Figma**
- Review the warning/error messages in the interface
- Check that your JSON is valid with no syntax errors
- Ensure you're targeting the correct collections and modes

## Style Dictionary Export

Style Dictionary is a powerful tool for transforming design tokens into various platform-specific formats. When selecting the Style Dictionary export format, you can configure the following options:

### Platforms
- **Web (CSS, SCSS, JS)** - Generate web-focused output formats
- **iOS (Swift)** - Generate Swift files for iOS development
- **Android (XML)** - Generate XML resource files for Android

### Web Formats
- **CSS Variables** - CSS custom properties (variables)
- **SCSS Variables** - SASS/SCSS variables
- **JavaScript** - JavaScript module exporting token objects
- **JSON** - Structured JSON format

### Options
- **Convert pixel values to REM** - Transform dimension values from pixels to relative em units
- **REM Base Size** - Base font size for REM calculations (default: 16)
- **Color Format** - Choose between HEX, RGB, RGBA, or HSL color formats
- **Include Documentation** - Generate comprehensive documentation in HTML and Markdown

### Output Structure

The Style Dictionary export generates the following files for each collection and mode:

```
collection_mode.css            # CSS variables
collection_mode.scss           # SCSS variables
collection_mode.js             # JavaScript module
collection_mode.json           # JSON format
collection_mode.swift          # iOS Swift file
collection_mode_colors.xml     # Android colors XML
collection_mode_dimens.xml     # Android dimensions XML
collection_mode_documentation.md  # Markdown docs
collection_mode_documentation.html # HTML docs
```

## Future Enhancements

- Import from external token files (JSON, YAML)
- Token version history and change tracking
- Performance optimizations for large token sets
- Visual token creation and editing interface

## License

MIT

## Credits

Developed by [Your Name/Organization]

Inspired by the Design Tokens Community Group (DTCG) specification.