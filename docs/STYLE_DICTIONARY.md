# Style Dictionary Integration

This document explains how the Figma Token Manager integrates with [Style Dictionary](https://styledictionary.com/) to transform design tokens into platform-specific formats.

## Overview

Style Dictionary is a build system that allows you to define design tokens once and export them to multiple platforms and formats. The Figma Token Manager's Style Dictionary integration transforms Figma variables into a format that can be used by Style Dictionary, enabling you to export your design tokens for use across web, iOS, and Android platforms.

## Known Issues and Improvement Areas

The following issues have been identified in the current implementation and their status:

### Documentation Issues

1. **Missing iOS Swift Color Implementation**: The Swift code generation assumes the existence of a `UIColor(hex:)` extension that isn't provided in the documentation, which would cause Swift compilation errors.

2. **Inconsistency in Platform Format Options**: There are inconsistencies in how format types are defined between different files (`index.ts` vs `transformer.ts`).

3. **No Example Implementation of UIColor Extensions**: The Swift code references non-standard initializers without providing the required extensions.

### Implementation Gaps

1. **Missing JavaScript Module Export Type**: No TypeScript type generation for better type safety in TypeScript projects.

2. **Limited Android Support**: Android XML generation is limited to colors and dimensions, with no support for other resource types.

3. **Incomplete Swift Implementation**: The Swift color code generation uses placeholder values instead of properly converting colors.

### User Experience Issues

1. **Style Dictionary Platforms vs. Formats Confusion**: ✅ FIXED - The redesigned UI now clearly shows which formats belong to which platforms.

2. **Missing Documentation Examples**: There aren't clear visual examples of what the generated documentation looks like.

3. **Compact and Difficult UI**: ✅ FIXED - The export dialog has been completely redesigned with a more user-friendly interface that features a step-by-step workflow, better organization, and clearer visual hierarchy.

### Technical Issues

1. **Redundant Code**: Duplicate implementations for generating platform outputs exist in different files.

2. **Incomplete Code References**: Some function parameters aren't properly documented.

3. **No Error Handling for Invalid Color Values**: Color transformation functions lack comprehensive error handling.

## Redesigned Export Dialog

A new, improved export dialog has been created to address the user experience issues:

### Key Improvements

1. **Tabbed Interface**: Organizes the export process into three clear steps:
   - Content Selection: Choose collections and modes to export
   - Format Selection: Select between DTCG, Legacy, or Style Dictionary formats
   - Advanced Options: Configure format-specific options

2. **Token Counter**: Shows exactly how many tokens will be exported based on your selections.

3. **Better Format Descriptions**: Visual examples and tag-based benefits for each format.

4. **Platform-Specific Options**: Clear organization of platform selection and associated formats.

5. **Improved Collection Browsing**: Search functionality and expandable collection cards with mode selection.

6. **Responsive Design**: Adapts to various screen sizes.

### Using the Redesigned Dialog

To use the redesigned export dialog, import from the redesign package:

```typescript
// Instead of
import { showExportDialog } from '../components/exportDialog';

// Use
import { showExportDialog } from '../components/redesign';
```

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