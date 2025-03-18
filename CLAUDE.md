# Figma Token Manager - Development Guidelines

## Commands
- `npm run build` - Build the plugin for production
- `npm run dev` - Run development server with hot-reloading

## Code Style Guidelines
- **Imports**: Use path aliases (`@ui/`, `@code/`, `@components/`, `@utilities/`)
- **Types**: Define interfaces with descriptive names in PascalCase (`TokenData`, `PluginSettings`)
- **Error Handling**: Always catch errors with type checking, use template for messages: `${error instanceof Error ? error.message : "Unknown error"}`
- **Naming Conventions**:
  - Interfaces/Types: PascalCase (`VisualToken`, `ColorFormat`)
  - Variables/Functions: camelCase (`handleUpdateVariables`, `currentColorFormat`)
  - Constants: camelCase or UPPER_SNAKE_CASE for true constants
- **Documentation**: Add JSDoc comments for functions and interfaces
- **Console Messages**: Use descriptive console.log/error messages for debugging
- **Component Structure**: Follow component-based organization in UI code
- **CSS**: Use separate CSS files for components in `styles/components/`

## Project Organization
- `src/code/` - Plugin backend logic
- `src/ui/` - User interface components and logic
- `src/ui/components/` - UI component modules
- `src/ui/utilities/` - Helper functions