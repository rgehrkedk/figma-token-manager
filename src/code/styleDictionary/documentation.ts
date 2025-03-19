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
}

/**
 * Generate documentation in Markdown format
 * 
 * @param tokens The tokens to document
 * @param collectionName The name of the collection
 * @param modeName The name of the mode
 * @param options Documentation options
 * @returns Markdown documentation
 */
export function generateMarkdownDocumentation(
  tokens: Record<string, StyleDictionaryToken>,
  collectionName: string,
  modeName: string,
  options: DocumentationOptions = {}
): string {
  const { 
    title = `${collectionName} - ${modeName} Design Tokens`, 
    includeCode = true,
    includeTables = true,
    includePreview = true
  } = options;
  
  let markdown = `# ${title}\n\n`;
  markdown += `Generated design tokens from Figma for collection "${collectionName}" and mode "${modeName}".\n\n`;
  
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
    markdown += `## ${capitalizedType} Tokens\n\n`;
    
    if (includeTables) {
      // Create a reference table
      markdown += `| Token Name | Value | Description |\n`;
      markdown += `|------------|-------|-------------|\n`;
      
      Object.entries(typeTokens).forEach(([path, token]) => {
        const formattedPath = path.replace(/\./g, '-');
        const value = typeof token.value === 'object' 
          ? JSON.stringify(token.value) 
          : token.value;
        const description = token.description || '';
        
        markdown += `| \`${formattedPath}\` | \`${value}\` | ${description} |\n`;
      });
      
      markdown += '\n';
    }
    
    if (includeCode && type === 'color') {
      // Add CSS variable usage example for colors
      markdown += `### CSS Variables Usage Example\n\n`;
      markdown += '```css\n';
      markdown += `.my-element {\n`;
      
      Object.entries(typeTokens).forEach(([path, token], index) => {
        if (index < 5) { // Limit to 5 examples to avoid overly long docs
          const formattedPath = path.replace(/\./g, '-');
          markdown += `  color: var(--${formattedPath});\n`;
        }
      });
      
      markdown += `}\n`;
      markdown += '```\n\n';
    }
    
    if (includePreview && type === 'color') {
      // Add color preview section
      markdown += `### Color Preview\n\n`;
      markdown += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">\n';
      
      Object.entries(typeTokens).forEach(([path, token]) => {
        const formattedPath = path.replace(/\./g, '-');
        const colorValue = token.value;
        
        markdown += `  <div style="border: 1px solid #ccc; border-radius: 4px; padding: 10px; display: flex; flex-direction: column;">\n`;
        markdown += `    <div style="background-color: ${colorValue}; height: 40px; border-radius: 4px;"></div>\n`;
        markdown += `    <div style="margin-top: 10px; font-family: monospace;">${formattedPath}</div>\n`;
        markdown += `    <div style="color: #666; font-size: 12px;">${colorValue}</div>\n`;
        markdown += `  </div>\n`;
      });
      
      markdown += '</div>\n\n';
    }
    
    if (includeCode && type === 'dimension') {
      // Add CSS variable usage example for dimensions
      markdown += `### Dimension Usage Example\n\n`;
      markdown += '```css\n';
      markdown += `.my-element {\n`;
      
      let exampleCount = 0;
      const exampleProperties = ['padding', 'margin', 'gap', 'border-radius', 'font-size'];
      
      Object.entries(typeTokens).forEach(([path, token]) => {
        if (exampleCount < exampleProperties.length) {
          const formattedPath = path.replace(/\./g, '-');
          markdown += `  ${exampleProperties[exampleCount]}: var(--${formattedPath});\n`;
          exampleCount++;
        }
      });
      
      markdown += `}\n`;
      markdown += '```\n\n';
    }
  });
  
  // Add a general usage section
  markdown += `## Usage Information\n\n`;
  
  markdown += `### CSS Custom Properties (Variables)\n\n`;
  markdown += '```css\n';
  markdown += `/* Import the CSS variables file */\n`;
  markdown += `@import 'path/to/${collectionName}_${modeName}.css';\n\n`;
  markdown += `/* Use the variables in your CSS */\n`;
  markdown += `.my-element {\n`;
  markdown += `  color: var(--color-primary);\n`;
  markdown += `  background-color: var(--color-background);\n`;
  markdown += `  padding: var(--spacing-medium);\n`;
  markdown += `  border-radius: var(--border-radius-medium);\n`;
  markdown += `}\n`;
  markdown += '```\n\n';
  
  // Add SCSS usage
  markdown += `### SCSS Variables\n\n`;
  markdown += '```scss\n';
  markdown += `// Import the SCSS variables file\n`;
  markdown += `@import 'path/to/${collectionName}_${modeName}.scss';\n\n`;
  markdown += `// Use the variables in your SCSS\n`;
  markdown += `.my-element {\n`;
  markdown += `  color: $color-primary;\n`;
  markdown += `  background-color: $color-background;\n`;
  markdown += `  padding: $spacing-medium;\n`;
  markdown += `  border-radius: $border-radius-medium;\n`;
  markdown += `}\n`;
  markdown += '```\n\n';
  
  // Add JavaScript usage
  markdown += `### JavaScript Usage\n\n`;
  markdown += '```javascript\n';
  markdown += `// Import the tokens\n`;
  markdown += `import { tokens } from 'path/to/${collectionName}_${modeName}.js';\n\n`;
  markdown += `// Use the tokens in your JavaScript\n`;
  markdown += `const primaryColor = tokens.color.primary;\n`;
  markdown += `const mediumSpacing = tokens.spacing.medium;\n\n`;
  markdown += `// Create a dynamic style\n`;
  markdown += `element.style.backgroundColor = tokens.color.background;\n`;
  markdown += `element.style.padding = tokens.spacing.large;\n`;
  markdown += '```\n';
  
  return markdown;
}

/**
 * Generate documentation in HTML format
 * 
 * @param tokens The tokens to document
 * @param collectionName The name of the collection
 * @param modeName The name of the mode 
 * @param options Documentation options
 * @returns HTML documentation
 */
export function generateHtmlDocumentation(
  tokens: Record<string, StyleDictionaryToken>,
  collectionName: string,
  modeName: string,
  options: DocumentationOptions = {}
): string {
  const { 
    title = `${collectionName} - ${modeName} Design Tokens`, 
    includeCode = true,
    includeTables = true,
    includePreview = true
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
  <p>Generated design tokens from Figma for collection "${collectionName}" and mode "${modeName}".</p>
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
  
  // Add a general usage section with tabs
  html += `<div class="token-section">
  <div class="token-section-header">
    <h2>Usage Information</h2>
  </div>
  <div class="usage-tabs">
    <div class="usage-tab active" onclick="showTab('css')">CSS</div>
    <div class="usage-tab" onclick="showTab('scss')">SCSS</div>
    <div class="usage-tab" onclick="showTab('js')">JavaScript</div>
    ${tokensByType['color'] ? '<div class="usage-tab" onclick="showTab(\'swift\')">iOS (Swift)</div>' : ''}
    ${tokensByType['dimension'] ? '<div class="usage-tab" onclick="showTab(\'android\')">Android</div>' : ''}
  </div>
  
  <div id="css" class="usage-content active">
    <h3>CSS Custom Properties (Variables)</h3>
    <pre><code>/* Import the CSS variables file */
@import 'path/to/${collectionName}_${modeName}.css';

/* Use the variables in your CSS */
.my-element {
  color: var(--color-primary);
  background-color: var(--color-background);
  padding: var(--spacing-medium);
  border-radius: var(--border-radius-medium);
}</code></pre>
  </div>
  
  <div id="scss" class="usage-content">
    <h3>SCSS Variables</h3>
    <pre><code>// Import the SCSS variables file
@import 'path/to/${collectionName}_${modeName}.scss';

// Use the variables in your SCSS
.my-element {
  color: $color-primary;
  background-color: $color-background;
  padding: $spacing-medium;
  border-radius: $border-radius-medium;
}</code></pre>
  </div>
  
  <div id="js" class="usage-content">
    <h3>JavaScript Usage</h3>
    <pre><code>// Import the tokens
import { tokens } from 'path/to/${collectionName}_${modeName}.js';

// Use the tokens in your JavaScript
const primaryColor = tokens.color.primary;
const mediumSpacing = tokens.spacing.medium;

// Create a dynamic style
element.style.backgroundColor = tokens.color.background;
element.style.padding = tokens.spacing.large;</code></pre>
  </div>`;

  if (tokensByType['color']) {
    html += `<div id="swift" class="usage-content">
    <h3>iOS (Swift) Usage</h3>
    <pre><code>// Import the generated Swift file
import StyleDictionary

// Use the color tokens in your Swift code
let primaryColor = StyleDictionary.Color.primary
let backgroundColor = StyleDictionary.Color.background

// Apply to a UIView
myView.backgroundColor = StyleDictionary.Color.background</code></pre>
  </div>`;
  }

  if (tokensByType['dimension']) {
    html += `<div id="android" class="usage-content">
    <h3>Android Usage</h3>
    <pre><code>&lt;!-- In your layout XML --&gt;
&lt;TextView
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="@color/color_primary"
    android:padding="@dimen/spacing_medium" /&gt;</code></pre>
  </div>`;
  }

  html += `</div>

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