# Exporting Tokens Guide

This guide explains how to export your design tokens from the Figma Token Manager plugin.

## Basic Export

1. Open the Figma Token Manager plugin
2. Click the **Export** button in the sidebar
3. The Export Dialog will appear

## Export Dialog Options

The Export Dialog provides several options for customizing your export:

### Collections & Modes

- Select which **Collections** you want to export (e.g., Colors, Typography, Spacing)
- For each collection, choose which **Modes** to include (e.g., Light, Dark)

### Export Format

Choose one of the following export formats:

- **Design Token Community Group (DTCG)** - The default format following the DTCG specification
- **Legacy Format** - A simplified key-value format for easier consumption
- **Style Dictionary** - Multi-platform format with additional transformation options

### Basic Options

- **Include complete file with all tokens** - Creates a single `tokens.json` file with all selected tokens
- **Use flat structure** - Places all files in the root directory instead of organizing into subfolders

## Style Dictionary Export

When you select "Style Dictionary" as your export format, additional options will appear:

### Platforms

Select which platforms you want to generate files for:

- **Web (CSS, SCSS, JS)** - Web-focused output formats
- **iOS (Swift)** - Swift code for iOS development
- **Android (XML)** - XML resources for Android development

### Web Formats

If you selected Web, choose which output formats to include:

- **CSS Variables** - CSS custom properties
- **SCSS Variables** - SASS/SCSS variables
- **JavaScript** - JS module with token objects
- **JSON** - Structured JSON format

### Additional Options

- **Convert pixel values to REM** - Transform dimension values to relative em units
- **REM Base Size** - Set the base font size for REM calculations (default: 16)
- **Color Format** - Choose between HEX, RGB, RGBA, or HSL color formats
- **Include Documentation** - Generate documentation in HTML and Markdown

## Completing the Export

1. After selecting your options, click the **Export** button
2. The plugin will generate a ZIP file with your tokens
3. The ZIP file will be automatically downloaded to your computer
4. Extract the ZIP to access your exported token files

## Output Structure

The ZIP file will contain:

- **For DTCG/Legacy formats:**
  - A complete `tokens.json` file (if selected)
  - Individual collection files (e.g., `colors.json`)
  - Individual mode files (e.g., `colors/light.json`, `colors/dark.json`)
  
- **For Style Dictionary format:**
  - Platform-specific files for each collection/mode:
    - CSS variables (e.g., `colors_light.css`)
    - SCSS variables (e.g., `colors_light.scss`)
    - JavaScript modules (e.g., `colors_light.js`)
    - Swift files (e.g., `colors_light.swift`)
    - Android XML files (e.g., `colors_light_colors.xml`, `colors_light_dimens.xml`)
  - Documentation files in HTML and Markdown formats

## Using Exported Files

### Web Development

1. Copy the CSS or SCSS files to your project
2. Import them in your styles:
   ```css
   @import 'path/to/colors_light.css';
   ```

### iOS Development

1. Add the Swift files to your Xcode project
2. Import and use the generated classes:
   ```swift
   import UIKit
   
   let primaryColor = StyleDictionary.Color.primary
   ```

### Android Development

1. Copy the XML files to your Android project's resources directory
2. Use the resources in your layouts:
   ```xml
   <TextView
       android:textColor="@color/color_primary"
       android:padding="@dimen/spacing_medium" />
   ```

## Next Steps

For more detailed information about Style Dictionary integration, see [STYLE_DICTIONARY.md](./STYLE_DICTIONARY.md).