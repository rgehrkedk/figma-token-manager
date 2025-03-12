# Figma Token Manager - Repository Structure

```
figma-token-manager/
├── package.json
├── src/
│   ├── code.ts
│   └── ui/
│       ├── components/
│       │   ├── collectionModes.ts
│       │   └── tokenPreview.ts
│       ├── debug-helpers.js
│       ├── styles/
│       │   ├── components/
│       │   │   ├── jsonPreview.css
│       │   │   ├── preview.css
│       │   │   └── tabs.css
│       │   └── layout.css
│       ├── typings.d.ts
│       └── utilities/
│           └── styleReferences.ts
```

This structure shows the main files in the project:

1. `package.json` - Project configuration and dependencies
2. `src/code.ts` - The main plugin code that runs in Figma
3. `src/ui/` - User interface related files
   - `components/` - Reusable UI components
   - `styles/` - CSS stylesheets for the UI
   - `utilities/` - Helper functions and utilities
   - `debug-helpers.js` - Debugging tools
