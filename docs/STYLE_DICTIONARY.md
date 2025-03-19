# Style Dictionary Integration

This document explains how the Figma Token Manager integrates with [Style Dictionary](https://styledictionary.com/) to transform design tokens into platform-specific formats.

## Overview

Style Dictionary is a build system that allows you to define design tokens once and export them to multiple platforms and formats. The Figma Token Manager's Style Dictionary integration transforms Figma variables into a format that can be used by Style Dictionary, enabling you to export your design tokens for use across web, iOS, and Android platforms.

## Export Options

When exporting tokens using the Style Dictionary format, you can configure the following options:

### Platforms

- **Web** - Generate output formats for web development (CSS, SCSS, JS)
- **iOS** - Generate Swift files for iOS development
- **Android** - Generate XML resource files for Android development

### Web Formats

- **CSS Variables** - CSS custom properties with `:root` selector
- **SCSS Variables** - SASS/SCSS variables using `$` prefix
- **JavaScript** - JavaScript module exporting token objects
- **JSON** - Transformed token JSON format

### Options

- **Convert pixel values to REM** - Transform dimension values from pixels to relative em units
- **REM Base Size** - Base font size for REM calculations (default: 16)
- **Color Format** - Choose between HEX, RGB, RGBA, or HSL color formats
- **Include Documentation** - Generate comprehensive documentation in HTML and Markdown

## Output Files

The Style Dictionary export generates the following files for each collection and mode:

```
collection_mode.css                  # CSS variables
collection_mode.scss                 # SCSS variables
collection_mode.js                   # JavaScript module
collection_mode.json                 # JSON format
collection_mode.swift                # iOS Swift file
collection_mode_colors.xml           # Android colors XML
collection_mode_dimens.xml           # Android dimensions XML
collection_mode_documentation.md     # Markdown documentation
collection_mode_documentation.html   # HTML documentation
```

## Format Examples

### CSS Variables

```css
:root {
  --color-primary: #0366D6;
  --color-secondary: #6F42C1;
  --spacing-small: 8px;
  --spacing-medium: 16px;
  --spacing-large: 24px;
}
```

### SCSS Variables

```scss
$color-primary: #0366D6;
$color-secondary: #6F42C1;
$spacing-small: 8px;
$spacing-medium: 16px;
$spacing-large: 24px;
```

### JavaScript

```javascript
export const tokens = {
  color: {
    primary: "#0366D6",
    secondary: "#6F42C1"
  },
  spacing: {
    small: "8px",
    medium: "16px",
    large: "24px"
  }
};
```

### iOS (Swift)

```swift
import UIKit

public class StyleDictionary {
  public struct Color {
    public static let primary = UIColor(red: 0.01, green: 0.4, blue: 0.84, alpha: 1.0)
    public static let secondary = UIColor(red: 0.44, green: 0.26, blue: 0.76, alpha: 1.0)
  }
  
  public struct Spacing {
    public static let small = 8.0
    public static let medium = 16.0
    public static let large = 24.0
  }
}
```

### Android XML (colors.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="color_primary">#0366D6</color>
  <color name="color_secondary">#6F42C1</color>
</resources>
```

### Android XML (dimens.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <dimen name="spacing_small">8dp</dimen>
  <dimen name="spacing_medium">16dp</dimen>
  <dimen name="spacing_large">24dp</dimen>
</resources>
```

## Transformations

The Style Dictionary integration applies the following transformations to your tokens:

### Reference Resolution

References between tokens (e.g., `{colors.primary.500}`) are resolved before export. This ensures that all token values are fully expanded in the exported files.

### Value Transformations

- **Dimensions** - Can be converted from pixels to rem units
- **Colors** - Can be transformed to different formats (HEX, RGB, RGBA, HSL)

### Name Transformations

- **Web formats** - Token paths are transformed to kebab-case (e.g., `color.primary` → `color-primary`)
- **iOS** - Token paths are transformed to camel case with capitalized type groups (e.g., `Color.primary`)
- **Android** - Token paths are transformed to snake_case (e.g., `color_primary`)

## Documentation

The generated documentation provides:

- Complete token listings with values and descriptions
- Visual previews for color tokens
- Usage examples for each platform
- Tables for easy reference
- Interactive tabs in the HTML version

## Implementation Details

The Style Dictionary integration consists of the following core components:

1. **Transformer** - Transforms Figma tokens to Style Dictionary format
2. **Transforms** - Applies value transformations (rem conversion, color formats)
3. **Formats** - Generates platform-specific output formats
4. **Documentation** - Creates documentation files in Markdown and HTML

These are implemented in the `/src/code/styleDictionary/` directory.