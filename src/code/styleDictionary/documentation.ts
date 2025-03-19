/**
 * Documentation Generator for Style Dictionary
 * 
 * Generates documentation for the transformed tokens
 */

import { StyleDictionaryToken } from './transformer';

/**
 * Options for documentation generation
 */
export interface DocumentationOptions {
  title?: string;
  includeCode?: boolean;
  includeTables?: boolean;
  includePreview?: boolean;
  selectedFormats?: string[];
}

/**
 * Generate documentation in Markdown format
 * 
 * @param tokens The tokens to document
 * @param collectionName The name of the collection
 * @param options Documentation options
 * @param platforms Selected platforms for documentation based on user selection
 * @returns Markdown documentation
 */
export function generateMarkdownDocumentation(
  tokens: Record<string, StyleDictionaryToken>,
  collectionName: string,
  options: DocumentationOptions = {},
  platforms: string[] = ['web', 'ios', 'android']
): string {
  const { 
    title = `${collectionName} Design Tokens`, 
    includeCode = true,
    includeTables = true,
    includePreview = true,
    selectedFormats = ['css', 'scss', 'js', 'ios', 'android']
  } = options;
  
  let markdown = `# ${title}\n\n`;
  markdown += `Generated design tokens from Figma for collection "${collectionName}".\n\n`;
  
  // Group tokens by type
  const tokensByType: Record<string, Record<string, StyleDictionaryToken>> = {};
  
  Object.entries(tokens).forEach(([path, token]) => {
    const type = token.type || 'other';
    
    if (!tokensByType[type]) {
      tokensByType[type] = {};
    }
    
    tokensByType[type][path] = token;
  });
  
  // Document all tokens in tables without type headers
  if (includeTables) {
    // Create a combined reference table for all tokens
    markdown += `## Token Reference\n\n`;
    markdown += `| Token Name | Type | Value | Description |\n`;
    markdown += `|------------|------|-------|-------------|\n`;
    
    // Process each type
    Object.entries(tokensByType).forEach(([type, typeTokens]) => {
      Object.entries(typeTokens).forEach(([path, token]) => {
        const formattedPath = path.replace(/\./g, '-');
        const value = typeof token.value === 'object' 
          ? JSON.stringify(token.value) 
          : token.value;
        const description = token.description || '';
        
        markdown += `| \`${formattedPath}\` | ${type} | \`${value}\` | ${description} |\n`;
      });
    });
    
    markdown += '\n';
  }
  
  // Implementation guide - only show examples for selected formats
  markdown += `## Implementation Guide\n\n`;
  
  // Extract real token examples for usage
  let colorExample = 'color-primary';
  let dimensionExample = 'spacing-medium';
  let borderRadiusExample = 'border-radius-medium';
  let backgroundExample = 'color-background';
  
  // Find real tokens for examples
  Object.entries(tokens).forEach(([path, token]) => {
    const formattedPath = path.replace(/\./g, '-');
    // Find primary color
    if (token.type === 'color' && (path.includes('primary') || path.includes('brand'))) {
      colorExample = formattedPath;
    }
    // Find spacing
    if (token.type === 'dimension' && path.includes('spacing')) {
      dimensionExample = formattedPath;
    }
    // Find border radius
    if (token.type === 'dimension' && path.includes('radius')) {
      borderRadiusExample = formattedPath;
    }
    // Find background color
    if (token.type === 'color' && path.includes('background')) {
      backgroundExample = formattedPath;
    }
  });
  
  // Web formats
  if ((platforms.includes('web') || platforms.includes('all')) && selectedFormats.includes('css')) {
    markdown += `### CSS Custom Properties (Variables)\n\n`;
    markdown += '```css\n';
    markdown += `/* Import the CSS variables file */\n`;
    markdown += `@import 'path/to/${collectionName}.css';\n\n`;
    markdown += `/* Use the variables in your CSS */\n`;
    markdown += `.my-element {\n`;
    markdown += `  color: var(--${colorExample});\n`;
    markdown += `  background-color: var(--${backgroundExample});\n`;
    markdown += `  padding: var(--${dimensionExample});\n`;
    markdown += `  border-radius: var(--${borderRadiusExample});\n`;
    markdown += `}\n`;
    markdown += '```\n\n';
  }
  
  if ((platforms.includes('web') || platforms.includes('all')) && selectedFormats.includes('scss')) {
    markdown += `### SCSS Variables\n\n`;
    markdown += '```scss\n';
    markdown += `// Import the SCSS variables file\n`;
    markdown += `@import 'path/to/${collectionName}.scss';\n\n`;
    markdown += `// Use the variables in your SCSS\n`;
    markdown += `.my-element {\n`;
    markdown += `  color: $${colorExample};\n`;
    markdown += `  background-color: $${backgroundExample};\n`;
    markdown += `  padding: $${dimensionExample};\n`;
    markdown += `  border-radius: $${borderRadiusExample};\n`;
    markdown += `}\n`;
    markdown += '```\n\n';
  }
  
  if ((platforms.includes('web') || platforms.includes('all')) && selectedFormats.includes('js')) {
    markdown += `### JavaScript Usage\n\n`;
    markdown += '```javascript\n';
    markdown += `// Import the tokens\n`;
    markdown += `import { tokens } from 'path/to/${collectionName}.js';\n\n`;
    markdown += `// Use the tokens in your JavaScript\n`;
    const jsColorPath = colorExample.split('-').join('.');
    const jsSpacingPath = dimensionExample.split('-').join('.');
    const jsBackgroundPath = backgroundExample.split('-').join('.');
    
    markdown += `// Access tokens by their path\n`;
    markdown += `const primaryColor = tokens.${jsColorPath}; // ${tokenValueByPath(tokens, jsColorPath)}\n`;
    markdown += `const mediumSpacing = tokens.${jsSpacingPath}; // ${tokenValueByPath(tokens, jsSpacingPath)}\n\n`;
    markdown += `// Create a dynamic style\n`;
    markdown += `element.style.backgroundColor = tokens.${jsBackgroundPath}; // ${tokenValueByPath(tokens, jsBackgroundPath)}\n`;
    markdown += '```\n\n';
  }
  
  // iOS implementation examples
  if ((platforms.includes('ios') || platforms.includes('all')) && selectedFormats.includes('ios')) {
    markdown += `### iOS (Swift) Implementation\n\n`;
    
    let colorExamplePath = '';
    let dimensionExamplePath = '';
    
    // Find real tokens for examples
    Object.entries(tokens).forEach(([path, token]) => {
      if (token.type === 'color' && !colorExamplePath) {
        colorExamplePath = path;
      }
      if (token.type === 'dimension' && !dimensionExamplePath) {
        dimensionExamplePath = path;
      }
    });
    
    // Format the paths for Swift
    const swiftColorPath = colorExamplePath.split('.').map(part => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('.');
    
    const swiftDimensionPath = dimensionExamplePath.split('.').map(part => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('.');
    
    markdown += '```swift\n';
    markdown += `// Import the generated Swift file\n`;
    markdown += `import ${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}Tokens\n\n`;
    markdown += `// Use the color tokens in your Swift code\n`;
    if (colorExamplePath) {
      markdown += `let myColor = TokenColors.${swiftColorPath} // ${tokenValueByPath(tokens, colorExamplePath)}\n`;
    }
    if (dimensionExamplePath) {
      markdown += `let mySize = TokenDimensions.${swiftDimensionPath} // ${tokenValueByPath(tokens, dimensionExamplePath)}\n`;
    }
    markdown += `\n// Use in SwiftUI\n`;
    markdown += `Text("Hello World")\n`;
    if (colorExamplePath) {
      markdown += `  .foregroundColor(TokenColors.${swiftColorPath})\n`;
    }
    if (dimensionExamplePath) {
      markdown += `  .padding(TokenDimensions.${swiftDimensionPath})\n`;
    }
    markdown += '```\n\n';
  }
  
  // Android implementation examples
  if ((platforms.includes('android') || platforms.includes('all')) && selectedFormats.includes('android')) {
    markdown += `### Android Implementation\n\n`;
    
    // Find real tokens for examples
    let colorRef = '@color/color_primary';
    let dimensionRef = '@dimen/spacing_medium';
    
    Object.entries(tokens).forEach(([path, token]) => {
      const name = path.replace(/\./g, '_');
      if (token.type === 'color' && (path.includes('primary') || path.includes('brand'))) {
        colorRef = `@color/${name}`;
      }
      if (token.type === 'dimension' && path.includes('spacing')) {
        dimensionRef = `@dimen/${name}`;
      }
    });
    
    markdown += '```xml\n';
    markdown += `<!-- In your layout XML -->\n`;
    markdown += `<TextView\n`;
    markdown += `    android:layout_width="match_parent"\n`;
    markdown += `    android:layout_height="wrap_content"\n`;
    markdown += `    android:textColor="${colorRef}"\n`;
    markdown += `    android:padding="${dimensionRef}" />\n\n`;
    
    markdown += `<!-- Using in styles -->\n`;
    markdown += `<style name="AppTheme" parent="Theme.MaterialComponents.Light">\n`;
    markdown += `    <item name="colorPrimary">${colorRef}</item>\n`;
    markdown += `    <item name="android:textSize">${dimensionRef}</item>\n`;
    markdown += `</style>\n`;
    markdown += '```\n\n';
  }
  
  return markdown;
}

/**
 * Helper function to safely get a token value by path
 */
function tokenValueByPath(tokens: Record<string, StyleDictionaryToken>, path: string): string {
  try {
    const token = tokens[path];
    if (token && token.value !== undefined) {
      return String(token.value);
    }
    
    // Try with dashes
    const dashPath = path.replace(/\./g, '-');
    const dashToken = tokens[dashPath];
    if (dashToken && dashToken.value !== undefined) {
      return String(dashToken.value);
    }
    
    return '[value not found]';
  } catch (err) {
    return '[value not found]';
  }
}

/**
 * Generate documentation in HTML format
 * 
 * @param tokens The tokens to document
 * @param collectionName The name of the collection
 * @param options Documentation options
 * @returns HTML documentation
 */
export function generateHtmlDocumentation(
  tokens: Record<string, StyleDictionaryToken>,
  collectionName: string,
  options: DocumentationOptions = {}
): string {
  const { 
    title = `${collectionName} Design Tokens`, 
    includeCode = true,
    includeTables = true,
    includePreview = true,
    selectedFormats = ['css', 'scss', 'js', 'ios', 'android']
  } = options;
  
  // Start with an HTML template
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1, h2, h3 {
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
    }
    th, td {
      text-align: left;
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      background-color: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-size: 0.9rem;
    }
    pre {
      background-color: #f5f5f5;
      padding: 1rem;
      border-radius: 5px;
      overflow-x: auto;
    }
    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .color-sample {
      border: 1px solid #eee;
      border-radius: 5px;
      overflow: hidden;
    }
    .color-preview {
      height: 100px;
    }
    .color-info {
      padding: 0.5rem;
      background: white;
    }
    .color-name {
      font-weight: bold;
      font-family: monospace;
    }
    .color-value {
      color: #666;
      font-size: 0.9rem;
      font-family: monospace;
    }
    .token-description {
      color: #666;
      font-style: italic;
    }
    .token-type {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
      padding: 0.2rem 0.5rem;
      border-radius: 3px;
      margin-right: 0.5rem;
      color: white;
    }
    .token-type-color { background-color: #4CAF50; }
    .token-type-dimension { background-color: #2196F3; }
    .token-type-string { background-color: #FFC107; }
    .token-type-number { background-color: #9C27B0; }
    .token-type-other { background-color: #607D8B; }
    .token-section {
      border: 1px solid #eee;
      border-radius: 5px;
      margin-bottom: 2rem;
      overflow: hidden;
    }
    .token-section-header {
      background-color: #f9f9f9;
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }
    .token-section-content {
      padding: 1rem;
    }
    .usage-tabs {
      display: flex;
      border-bottom: 1px solid #eee;
    }
    .usage-tab {
      padding: 0.5rem 1rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
    .usage-tab.active {
      border-bottom: 2px solid #2196F3;
      font-weight: bold;
    }
    .usage-content {
      display: none;
      padding: 1rem;
    }
    .usage-content.active {
      display: block;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Generated design tokens from Figma for collection "${collectionName}".</p>
`;
  
  // Group tokens by type
  const tokensByType: Record<string, Record<string, StyleDictionaryToken>> = {};
  
  Object.entries(tokens).forEach(([path, token]) => {
    const type = token.type || 'other';
    
    if (!tokensByType[type]) {
      tokensByType[type] = {};
    }
    
    tokensByType[type][path] = token;
  });
  
  // Document each type
  Object.entries(tokensByType).forEach(([type, typeTokens]) => {
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    
    html += `<div class="token-section">
  <div class="token-section-header">
    <h2>${capitalizedType} Tokens</h2>
    <p>Total: ${Object.keys(typeTokens).length} tokens</p>
  </div>
  <div class="token-section-content">`;
    
    if (includePreview && type === 'color') {
      // Add color preview grid
      html += `<div class="color-grid">`;
      
      Object.entries(typeTokens).forEach(([path, token]) => {
        const formattedPath = path.replace(/\./g, '-');
        const colorValue = token.value;
        const description = token.description || '';
        
        html += `<div class="color-sample">
      <div class="color-preview" style="background-color: ${colorValue};"></div>
      <div class="color-info">
        <div class="color-name">${formattedPath}</div>
        <div class="color-value">${colorValue}</div>
        ${description ? `<div class="token-description">${description}</div>` : ''}
      </div>
    </div>`;
      });
      
      html += `</div>`;
    }
    
    if (includeTables) {
      // Create a reference table
      html += `<table>
    <thead>
      <tr>
        <th>Token Name</th>
        <th>Value</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>`;
      
      Object.entries(typeTokens).forEach(([path, token]) => {
        const formattedPath = path.replace(/\./g, '-');
        const value = typeof token.value === 'object' 
          ? JSON.stringify(token.value) 
          : token.value;
        const description = token.description || '';
        
        html += `<tr>
        <td><code>${formattedPath}</code></td>
        <td><code>${value}</code></td>
        <td>${description}</td>
      </tr>`;
      });
      
      html += `</tbody>
  </table>`;
    }
    
    html += `</div></div>`;
  });
  
  // Build tabs based on selected formats
  const tabsHtml = [];
  const tabContentsHtml = [];
  
  if (selectedFormats.includes('css')) {
    tabsHtml.push(`<div class="usage-tab ${tabsHtml.length === 0 ? 'active' : ''}" onclick="showTab('css')">CSS</div>`);
    tabContentsHtml.push(`
  <div id="css" class="usage-content ${tabsHtml.length === 1 ? 'active' : ''}">
    <h3>CSS Custom Properties (Variables)</h3>
    <pre><code>/* Import the CSS variables file */
@import 'path/to/${collectionName}.css';

/* Use the variables in your CSS */
.my-element {
  color: var(--color-primary);
  background-color: var(--color-background);
  padding: var(--spacing-medium);
  border-radius: var(--border-radius-medium);
}</code></pre>
  </div>`);
  }
  
  if (selectedFormats.includes('scss')) {
    tabsHtml.push(`<div class="usage-tab ${tabsHtml.length === 0 ? 'active' : ''}" onclick="showTab('scss')">SCSS</div>`);
    tabContentsHtml.push(`
  <div id="scss" class="usage-content ${tabsHtml.length === 1 ? 'active' : ''}">
    <h3>SCSS Variables</h3>
    <pre><code>// Import the SCSS variables file
@import 'path/to/${collectionName}.scss';

// Use the variables in your SCSS
.my-element {
  color: $color-primary;
  background-color: $color-background;
  padding: $spacing-medium;
  border-radius: $border-radius-medium;
}</code></pre>
  </div>`);
  }
  
  if (selectedFormats.includes('js')) {
    tabsHtml.push(`<div class="usage-tab ${tabsHtml.length === 0 ? 'active' : ''}" onclick="showTab('js')">JavaScript</div>`);
    tabContentsHtml.push(`
  <div id="js" class="usage-content ${tabsHtml.length === 1 ? 'active' : ''}">
    <h3>JavaScript Usage</h3>
    <pre><code>// Import the tokens
import { tokens } from 'path/to/${collectionName}.js';

// Use the tokens in your JavaScript
const primaryColor = tokens.color.primary;
const mediumSpacing = tokens.spacing.medium;

// Create a dynamic style
element.style.backgroundColor = tokens.color.background;
element.style.padding = tokens.spacing.large;</code></pre>
  </div>`);
  }

  if (tokensByType['color'] && selectedFormats.includes('ios')) {
    tabsHtml.push(`<div class="usage-tab ${tabsHtml.length === 0 ? 'active' : ''}" onclick="showTab('swift')">iOS (Swift)</div>`);
    tabContentsHtml.push(`
  <div id="swift" class="usage-content ${tabsHtml.length === 1 ? 'active' : ''}">
    <h3>iOS (Swift) Usage</h3>
    <pre><code>// Import the generated Swift file
import StyleDictionary

// Use the color tokens in your Swift code
let primaryColor = StyleDictionary.Color.primary
let backgroundColor = StyleDictionary.Color.background

// Apply to a UIView
myView.backgroundColor = StyleDictionary.Color.background</code></pre>
  </div>`);
  }

  if (tokensByType['dimension'] && selectedFormats.includes('android')) {
    tabsHtml.push(`<div class="usage-tab ${tabsHtml.length === 0 ? 'active' : ''}" onclick="showTab('android')">Android</div>`);
    tabContentsHtml.push(`
  <div id="android" class="usage-content ${tabsHtml.length === 1 ? 'active' : ''}">
    <h3>Android Usage</h3>
    <pre><code>&lt;!-- In your layout XML --&gt;
&lt;TextView
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="@color/color_primary"
    android:padding="@dimen/spacing_medium" /&gt;</code></pre>
  </div>`);
  }

  // Only add the implementation section if there are formats to show
  if (tabsHtml.length > 0) {
    html += `<div class="token-section">
  <div class="token-section-header">
    <h2>Implementation Guide</h2>
  </div>
  <div class="usage-tabs">
    ${tabsHtml.join('\n    ')}
  </div>
  ${tabContentsHtml.join('\n  ')}
</div>`;
  }

  html += `
<script>
function showTab(tabId) {
  // Hide all content sections
  const contents = document.getElementsByClassName('usage-content');
  for (let i = 0; i < contents.length; i++) {
    contents[i].classList.remove('active');
  }
  
  // Remove active class from all tabs
  const tabs = document.getElementsByClassName('usage-tab');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('active');
  }
  
  // Show the selected content and mark its tab as active
  document.getElementById(tabId).classList.add('active');
  
  // Find and activate the tab that corresponds to this content
  const tabElements = document.querySelectorAll('.usage-tab');
  for (let i = 0; i < tabElements.length; i++) {
    if (tabElements[i].getAttribute('onclick').includes(tabId)) {
      tabElements[i].classList.add('active');
    }
  }
}
</script>
</body>
</html>`;

  return html;
}