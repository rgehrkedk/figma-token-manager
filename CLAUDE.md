# Figma Token Manager - Development Guidelines

## Commands
- `npm run build` - Build the plugin for production


## Code Style Guidelines
- **Imports**: Use path aliases (`@ui/`, `@code/`, `@components/`, `@utilities/`)
- **Types**: Define interfaces with descriptive names in PascalCase (`TokenData`, `DTCGToken`)
- **Error Handling**: Always catch errors with type checking, use template for messages: `${error instanceof Error ? error.message : "Unknown error"}`
- **Naming Conventions**:
  - Interfaces/Types: PascalCase (`VisualToken`, `ColorFormat`)
  - Variables/Functions: camelCase (`handleUpdateVariables`, `currentColorFormat`)
  - Constants: camelCase or UPPER_SNAKE_CASE for true constants
- **Documentation**: Add JSDoc comments for functions and interfaces
- **Console Messages**: Use descriptive console.log/error messages for debugging
- **Component Structure**: Follow component-based organization in UI code
- **CSS**: Use separate CSS files for components in `styles/components/`
- **TypeScript**: Use type annotations for parameters, return values, and variables

## Project Organization
- `src/code/` - Plugin backend logic
  - `extractors/` - Extracts tokens from Figma variables
  - `formatters/` - Handles formatting of token values
  - `styleDictionary/` - Style Dictionary integration
  - `utilities/` - Backend helper functions
- `src/ui/` - User interface components and logic
  - `components/` - UI component modules
  - `reference/` - Token reference resolution
  - `styles/` - CSS styling including component styles
  - `templates/` - UI templates for various views
  - `utilities/` - Frontend helper functions

## Core Features
- Extract design tokens from Figma variables and collections
- Handle DTCG-compliant tokens with proper type information
- Support references between tokens with validation and resolution
- Transform colors between formats (hex, RGB/RGBA, HSL/HSLA)
- Provide visual and JSON editing interfaces
- Update Figma variables from edited tokens
- Export tokens in multiple formats (DTCG, legacy, Style Dictionary)

## Token Types
- Colors (with multiple format options)
- Typography
- Spacing/dimensions
- Numbers
- Strings
- Boolean values
- References between tokens