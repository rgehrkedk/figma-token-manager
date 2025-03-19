# Figma Token Manager - Quickstart Guide

This guide will help you get started with the Figma Token Manager plugin and explore its Style Dictionary export feature.

## Installation

1. Open Figma and navigate to the plugins menu
2. Search for "Figma Token Manager" and install the plugin
3. Alternatively, you can load the plugin from a manifest file:
   - Click on "Plugins" > "Development" > "Import plugin from manifest..."
   - Select the `manifest.json` file from this repository

## Basic Usage

### Running the Plugin

1. Open a Figma document that contains variables
2. Go to "Plugins" > "Figma Token Manager"
3. The plugin will extract all variables from your document and display them

### Exploring Tokens

1. Use the sidebar to navigate between different collections (e.g., colors, typography, spacing)
2. The main panel shows a visual representation of your tokens
3. Click on any token to view its details in the right panel

### Editing Tokens

1. Switch to JSON view using the toggle in the header
2. Edit the JSON structure directly
3. Click "Save to Figma" to update your Figma variables with the changes

## Exporting Tokens

### Basic Export

1. Click the "Export" button in the sidebar
2. By default, all collections and modes will be selected
3. Choose your export format:
   - **DTCG** (Design Token Community Group) - Default format
   - **Legacy** - Simple key-value format
   - **Style Dictionary** - Multi-platform format (see below)
4. Click "Export" to download a ZIP file with your tokens

### Style Dictionary Export

1. In the export dialog, select "Style Dictionary" as the format
2. Additional options will appear for Style Dictionary export

#### Platforms

Select which platforms you want to generate files for:

- **Web** - CSS, SCSS, and JavaScript files
- **iOS** - Swift files
- **Android** - XML resource files

#### Web Formats

If you selected Web, choose which formats to include:

- **CSS Variables** - CSS custom properties
- **SCSS Variables** - SASS/SCSS variables
- **JavaScript** - JS module with token objects
- **JSON** - Structured JSON format

#### Additional Options

- **Convert pixel values to REM** - Transform dimensions to relative units
- **REM Base Size** - Set the base font size (default: 16)
- **Color Format** - Choose HEX, RGB, RGBA, or HSL
- **Include Documentation** - Generate comprehensive docs

### Working with the Exported Files

After exporting, you'll get a ZIP file containing:

1. **For Web Developers:**
   - CSS files with variables
   - SCSS files with variables
   - JavaScript modules

   ```css
   /* Example CSS usage */
   .button {
     background-color: var(--color-primary);
     padding: var(--spacing-medium);
   }
   ```

2. **For iOS Developers:**
   - Swift files with a StyleDictionary class

   ```swift
   // Example Swift usage
   let button = UIButton()
   button.backgroundColor = StyleDictionary.Color.primary
   button.contentEdgeInsets = UIEdgeInsets(
     top: StyleDictionary.Spacing.small,
     left: StyleDictionary.Spacing.medium,
     bottom: StyleDictionary.Spacing.small,
     right: StyleDictionary.Spacing.medium
   )
   ```

3. **For Android Developers:**
   - XML files with colors and dimensions

   ```xml
   <!-- Example Android usage -->
   <Button
       android:background="@color/color_primary"
       android:padding="@dimen/spacing_medium" />
   ```

4. **Documentation:**
   - Markdown files with token listings and examples
   - HTML files with interactive documentation

## Example Workflow

Here's a complete workflow example:

1. **Design in Figma:**
   - Create your design system using Figma variables
   - Organize variables into collections and modes

2. **Export Tokens:**
   - Run the Figma Token Manager plugin
   - Click "Export" and select "Style Dictionary" format
   - Choose platforms and options based on your project needs

3. **Implement in Code:**
   - Extract the ZIP file into your project
   - Import the appropriate files for your platform
   - Use the tokens in your code

4. **Update the Design:**
   - Make changes to your Figma variables
   - Re-export using the same settings
   - Update the files in your project

## Additional Resources

- [Full Documentation](./README.md)
- [Style Dictionary Documentation](./STYLE_DICTIONARY.md)
- [Export Guide](./EXPORT_GUIDE.md)
- [Implementation Details](./STYLE_DICTIONARY_IMPLEMENTATION.md)

## Troubleshooting

- **Empty export**: Make sure you've selected at least one collection and mode
- **Missing platforms**: Verify that you've selected the correct platforms in the Style Dictionary options
- **Reference errors**: Check if your token references are correctly defined
- **Slow export**: Large token sets may take longer to process