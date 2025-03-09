# Figma Token Manager

A lightweight Figma plugin for exporting design variables as standardized design tokens, optimized for performance and Figma's plugin environment.

## Overview

Figma Token Manager extracts variables from your Figma document and exports them as structured design tokens, compatible with the Design Tokens Community Group (DTCG) format specification. The plugin is designed to maintain a small footprint while providing a modern, intuitive interface for managing token exports.

## Features

- **Dual-Mode Token Preview**: Toggle between visual representation and JSON code view
- **Collection & Mode Management**: Hierarchical organization of tokens by collection and mode
- **Multiple Export Options**:
  - DTCG-compliant format with proper type definitions
  - Legacy format for simpler integration needs
  - Export as single file or multiple files (one per collection/mode)
- **Reference Resolution**: Proper handling of variable references and aliases
- **Visual Token Inspection**: Preview colors, dimensions, and other token types before export

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
│   │   ├── extractors/    # Token extraction modules
│   │   ├── formatters/    # Value formatting utilities
│   │   └── types.ts       # TypeScript type definitions
│   ├── ui/                # UI components
│   │   ├── index.ts       # UI entry point
│   │   ├── components/    # UI component modules
│   │   └── styles.css     # Lightweight CSS styles
│   └── ui.html            # User interface HTML structure
└── dist/                  # Build output directory
```

## Design Decisions

The plugin is built with specific constraints in mind to ensure optimal performance in Figma's plugin environment:

- **Lightweight**: Minimal dependencies and optimized bundle size
- **Vanilla Implementation**: Custom CSS and JavaScript without heavy frameworks
- **Figma-Native Feel**: UI that follows Figma's design patterns and expectations
- **Performance First**: Optimized for speed in Figma's sandboxed environment

## Token Export Format

### DTCG Format (Default)

```json
{
  "colors": {
    "primary": {
      "base": {
        "$value": "#0366D6",
        "$type": "color"
      }
    }
  }
}
```

### Legacy Format

```json
{
  "colors": {
    "primary": {
      "base": "#0366D6"
    }
  }
}
```

## Development

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```

### Development Workflow

1. Start the development server with hot reloading:
   ```bash
   npm run dev
   ```
2. Import the plugin in Figma (Plugins > Development > Import plugin from manifest)
3. Select the `manifest.json` file from your project

### Building for Distribution

```bash
npm run build
```

This will create optimized production files in the `dist/` directory.

## Deployment

To package the plugin for distribution:

```bash
mkdir -p plugin-export
cp manifest.json plugin-export/
cp -r dist plugin-export/
cd plugin-export
zip -r ../figma-token-manager.zip .
```

## Limitations

- Figma plugin environment restrictions apply (sandbox limitations)
- Limited network access (domains must be specified in manifest)
- Performance depends on the size and complexity of the Figma document

## Future Enhancements

- Additional export formats (CSS variables, SCSS, etc.)
- Token importing capabilities
- Enhanced visual token preview options
- Performance optimizations for large token sets

## License

MIT