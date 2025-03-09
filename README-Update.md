# Figma Token Manager: Color Format Enhancement

## Overview

The Figma Token Manager now includes enhanced color transformation capabilities, allowing designers and developers to export design tokens with colors in various formats, including:

- **HEX** (`#ffffff`)
- **RGB** (`rgb(255, 255, 255)`)
- **RGBA** (`rgba(255, 255, 255, 1)`)
- **HSL** (`hsl(0deg, 0%, 100%)`)
- **HSLA** (`hsla(0deg, 0%, 100%, 1)`)

This feature is inspired by and compatible with Style Dictionary's color transformation system.

## Features

### Color Format Selection

The plugin interface now includes radio buttons for selecting your preferred color format. This setting will apply to all color tokens during export.

### Color Preview Panel

A new color preview panel shows visual representations of all color tokens in your document. This makes it easier to:

- Quickly scan all colors in your design system
- Preview how colors will be exported in different formats
- Copy color values directly to your clipboard

### Format Conversions

The plugin handles format conversions between different color spaces, ensuring accurate representation regardless of which format you choose.

## Usage

1. Select your preferred color format using the radio buttons in the "Color Format" section
2. Enable "Show color previews" to see a visual representation of your color tokens
3. Click on any color in the preview panel to:
   - See all format variations
   - Copy values to clipboard
   - Change the default format

## Implementation Details

### Color Format Transformation

The color transformation utilities are based on the same principles as Style Dictionary's color transforms, ensuring compatibility with design systems that use Style Dictionary for token processing.

### Design Token Community Group (DTCG) Compliance

All color transformations maintain compatibility with DTCG token standards. The `$type` property remains set to `color` regardless of the format used for the value.

## Technical Benefits

- **Consistency**: Ensures consistent color format across all tokens
- **Developer Experience**: Provides colors in the format most useful for your implementation
- **Workflow Integration**: Simplifies integration with CSS, SCSS, JavaScript, and other environments

## Example

A color token originally defined in Figma can be exported in any of these formats:

```json
// HEX format
{
  "colors": {
    "primary": {
      "$value": "#0366D6",
      "$type": "color"
    }
  }
}

// RGB format
{
  "colors": {
    "primary": {
      "$value": "rgb(3, 102, 214)",
      "$type": "color"
    }
  }
}

// HSL format
{
  "colors": {
    "primary": {
      "$value": "hsl(212deg, 97%, 43%)",
      "$type": "color"
    }
  }
}
```

## Coming Soon

Future enhancements for color transformations may include:
- Color token versioning and change detection
- Custom transform function definitions
- Additional color formats and modifiers