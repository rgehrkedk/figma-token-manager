# Figma Design Token Export Plugin

A Figma plugin to extract design variables from your Figma file and export them as structured JSON design tokens.

## Features

- Extracts all variables from the current Figma file
- Maintains variable collection and mode structure
- Converts Figma variables to a structured JSON format
- Allows selective export of collections
- Provides a preview of the JSON structure before export
- Handles aliased variables (references between variables)

## Installation and Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/figma-token-manager.git
   cd figma-token-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. Load the plugin in Figma:
   - Open Figma Desktop
   - Go to Plugins > Development > Import plugin from manifest...
   - Select the `manifest.json` file from the project directory

### Development Workflow

- Run `npm run dev` for development mode with automatic rebuilding
- Make changes to the code in the `src` directory
- Refresh the plugin in Figma to see changes

## Usage

1. Open a Figma file containing variables
2. Run the plugin from Plugins > Design Token Export
3. The plugin will automatically extract all variables
4. Choose which collections to include in the export
5. Preview the extracted tokens
6. Click "Download JSON" to save the tokens as a JSON file

## Structure

The plugin extracts variables and maintains their hierarchical structure:

```
{
  "globals": {
    "mode1": {
      "colors": {
        "primary": "#0066ff",
        "secondary": "#ff6600"
      },
      "spacing": {
        "small": "8px",
        "medium": "16px",
        "large": "24px"
      }
    }
  },
  "brand": {
    "brand1": { ... },
    "brand2": { ... },
    ...
  },
  "theme": {
    "light": { ... },
    "dark": { ... }
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
