/**
 * Component for managing visual token preview functionality
 */

import { ColorFormat } from '../../code/formatters/colorTransforms';

// Interface for generic token
export interface VisualToken {
  path: string;
  type: string;
  value: any;
  originalValue?: any;
}

/**
 * Shows a visual token preview for the given token data
 */
export function showVisualTokenPreview(
  tokenData: any, 
  containerElement: HTMLElement,
  colorFormat: ColorFormat
): void {
  // Extract all visual tokens
  const visualTokens = extractVisualTokens(tokenData);
  
  // Remove existing preview if present
  const existingPreview = document.querySelector('.token-preview-container');
  if (existingPreview) {
    existingPreview.remove();
  }
  
  // Generate and add preview panel
  const previewHtml = generateVisualTokenPreview(visualTokens, colorFormat);
  const previewContainer = document.createElement('div');
  previewContainer.className = 'token-preview-wrapper';
  previewContainer.innerHTML = previewHtml;
  
  // Add after the given container
  containerElement.parentNode?.insertBefore(
    previewContainer, 
    containerElement.nextSibling
  );
  
  // Setup interactive features
  setupTokenPreviewInteractions(previewContainer);
}

/**
 * Extracts all types of tokens from token data
 */
function extractVisualTokens(tokenData: any): VisualToken[] {
  const visualTokens: VisualToken[] = [];
  
  function processTokens(obj: any, path: string = '') {
    if (!obj || typeof obj !== 'object') return;
    
    // Process DTCG format tokens
    if (obj.$value !== undefined && obj.$type !== undefined) {
      visualTokens.push({
        path: path,
        type: obj.$type,
        value: obj.$value,
        originalValue: obj.$value
      });
      return;
    }
    
    // Process nested objects
    for (const key in obj) {
      const newPath = path ? `${path}/${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null) {
        processTokens(value, newPath);
      } else {
        // Try to infer type for non-DTCG tokens
        const inferredType = inferTokenType(value);
        if (inferredType) {
          visualTokens.push({
            path: newPath,
            type: inferredType,
            value: value,
            originalValue: value
          });
        }
      }
    }
  }
  
  // Process all collections and modes
  for (const collection in tokenData) {
    for (const mode in tokenData[collection]) {
      processTokens(tokenData[collection][mode], `${collection}/${mode}`);
    }
  }
  
  return visualTokens;
}

/**
 * Infer token type from its value
 */
function inferTokenType(value: any): string | null {
  if (typeof value === 'string') {
    // Color check
    if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
      return 'color';
    }
    // Dimension check
    else if (/^-?\d*\.?\d+(px|rem|em|%|vh|vw|vmin|vmax|pt|pc|in|cm|mm)$/.test(value)) {
      return 'dimension';
    }
    // Font family check
    else if (value.includes(',') && 
             (value.includes('sans-serif') || 
              value.includes('serif') || 
              value.includes('monospace'))) {
      return 'fontFamily';
    }
    // Font weight check
    else if (/^(normal|bold|lighter|bolder|\d{3})$/.test(value)) {
      return 'fontWeight';
    }
    // Duration check
    else if (/^-?\d*\.?\d+(s|ms)$/.test(value)) {
      return 'duration';
    }
    // Simple shadow check
    else if (value.includes('px') && value.includes('rgba')) {
      return 'shadow';
    }
  } else if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  }
  
  return 'string';
}

/**
 * Generate HTML for a visual token preview
 */
function generateVisualTokenPreview(tokens: VisualToken[], colorFormat: ColorFormat): string {
  if (tokens.length === 0) {
    return '<div class="token-preview-container"><div class="token-preview-heading">No tokens found</div></div>';
  }
  
  // Group tokens by type
  const tokensByType: Record<string, VisualToken[]> = {};
  
  tokens.forEach(token => {
    if (!tokensByType[token.type]) {
      tokensByType[token.type] = [];
    }
    tokensByType[token.type].push(token);
  });
  
  let html = '<div class="token-preview-container">';
  html += '<div class="token-preview-heading">Visual Token Preview</div>';
  
  // Process color tokens first if they exist
  if (tokensByType['color']) {
    html += generateColorTokensPreview(tokensByType['color']);
  }
  
  // Process dimension tokens
  if (tokensByType['dimension']) {
    html += generateDimensionTokensPreview(tokensByType['dimension']);
  }
  
  // Process typography-related tokens
  const typographyTypes = ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing'];
  let hasTypographyTokens = false;
  
  for (const type of typographyTypes) {
    if (tokensByType[type] && tokensByType[type].length > 0) {
      hasTypographyTokens = true;
      break;
    }
  }
  
  if (hasTypographyTokens) {
    html += '<div class="token-preview-heading">Typography Tokens</div>';
    
    for (const type of typographyTypes) {
      if (tokensByType[type]) {
        html += generateTypographyTokensPreview(tokensByType[type], type);
      }
    }
  }
  
  // Process duration/timing tokens
  if (tokensByType['duration']) {
    html += generateDurationTokensPreview(tokensByType['duration']);
  }
  
  // Process shadow tokens
  if (tokensByType['shadow']) {
    html += generateShadowTokensPreview(tokensByType['shadow']);
  }
  
  // Add a catch-all for other token types
  const processedTypes = new Set([
    'color', 'dimension', 'fontFamily', 'fontWeight', 'fontSize',
    'lineHeight', 'letterSpacing', 'duration', 'shadow'
  ]);
  
  let hasOtherTokens = false;
  for (const type in tokensByType) {
    if (!processedTypes.has(type)) {
      hasOtherTokens = true;
      break;
    }
  }
  
  if (hasOtherTokens) {
    html += '<div class="token-preview-heading">Other Tokens</div>';
    
    for (const type in tokensByType) {
      if (!processedTypes.has(type)) {
        html += generateGenericTokensPreview(tokensByType[type], type);
      }
    }
  }
  
  html += '</div>';
  return html;
}

/**
 * Generate HTML for color tokens
 */
function generateColorTokensPreview(tokens: VisualToken[]): string {
  let html = '<div class="token-preview-heading">Color Tokens</div>';
  
  // Group by collection
  const tokensByCollection: Record<string, VisualToken[]> = {};
  
  tokens.forEach(token => {
    const pathParts = token.path.split('/');
    if (pathParts.length >= 2) {
      const collection = pathParts[0];
      
      if (!tokensByCollection[collection]) {
        tokensByCollection[collection] = [];
      }
      
      tokensByCollection[collection].push(token);
    }
  });
  
  // Generate preview for each collection
  for (const collection in tokensByCollection) {
    html += `<div class="token-preview-subheading">${collection}</div>`;
    
    tokensByCollection[collection].forEach(token => {
      // Check if this is a reference token (value starts with { and ends with })
      const isReference = typeof token.value === 'string' && 
                         token.value.startsWith('{') && 
                         token.value.endsWith('}');
      
      let displayColor: string;
      let additionalClasses = '';
      
      if (isReference) {
        // For reference tokens, add reference indicator class and set a fallback color
        displayColor = '#cccccc'; // Fallback color for references
        additionalClasses = 'reference-token';
      } else {
        // For regular colors
        displayColor = token.value;
        
        // Determine if transparent
        const isTransparent = String(token.value).includes('rgba') || 
                             String(token.value).includes('hsla') || 
                             (String(token.value).startsWith('#') && String(token.value).length === 9);
        
        if (isTransparent) {
          additionalClasses = 'transparent';
        }
      }
      
      // Extract path without collection/mode
      const displayPath = token.path.split('/').slice(2).join('/');
      
      html += `
        <div class="token-preview-item color-preview-item" data-token-path="${token.path}" data-token-value="${token.value}" data-token-type="${token.type}">
          <div class="color-swatch ${additionalClasses}" style="background-color: ${displayColor}">
            ${isReference ? '<div class="reference-icon">↗</div>' : ''}
          </div>
          <div class="token-info">
            <div class="token-path">${displayPath}</div>
            <div class="token-value">
              ${token.value}
              ${isReference ? '<span class="reference-label">Reference</span>' : ''}
            </div>
          </div>
        </div>
      `;
    });
  }
  
  return html;
}

/**
 * Generate HTML for dimension tokens
 */
function generateDimensionTokensPreview(tokens: VisualToken[]): string {
  let html = '<div class="token-preview-heading">Dimension Tokens</div>';
  
  // Group by collection
  const tokensByCollection: Record<string, VisualToken[]> = {};
  
  tokens.forEach(token => {
    const pathParts = token.path.split('/');
    if (pathParts.length >= 2) {
      const collection = pathParts[0];
      
      if (!tokensByCollection[collection]) {
        tokensByCollection[collection] = [];
      }
      
      tokensByCollection[collection].push(token);
    }
  });
  
  // Generate preview for each collection
  for (const collection in tokensByCollection) {
    html += `<div class="token-preview-subheading">${collection}</div>`;
    
    tokensByCollection[collection].forEach(token => {
      // Extract path without collection/mode
      const displayPath = token.path.split('/').slice(2).join('/');
      
      // Try to represent dimension visually as a bar
      const size = String(token.value).replace(/[^0-9.]/g, '');
      // Cap at 200px for visualization purposes
      const visualSize = Math.min(parseFloat(size), 200);
      
      html += `
        <div class="token-preview-item dimension-preview-item" data-token-path="${token.path}" data-token-value="${token.value}" data-token-type="${token.type}">
          <div class="dimension-swatch">
            <div class="dimension-bar" style="width: ${visualSize}px"></div>
          </div>
          <div class="token-info">
            <div class="token-path">${displayPath}</div>
            <div class="token-value">${token.value}</div>
          </div>
        </div>
      `;
    });
  }
  
  return html;
}

/**
 * Generate HTML for typography tokens
 */
function generateTypographyTokensPreview(tokens: VisualToken[], typographyType: string): string {
  let html = `<div class="token-preview-subheading">${formatTypeName(typographyType)}</div>`;
  
  tokens.forEach(token => {
    // Extract path without collection/mode
    const pathParts = token.path.split('/');
    const displayPath = pathParts.slice(2).join('/');
    
    // Create appropriate visualization based on typography type
    let visualElement = '';
    
    switch(typographyType) {
      case 'fontFamily':
        visualElement = `<div class="font-family-sample" style="font-family: ${token.value}">Aa</div>`;
        break;
      case 'fontWeight':
        visualElement = `<div class="font-weight-sample" style="font-weight: ${token.value}">Aa</div>`;
        break;
      case 'fontSize':
        // Scale down very large font sizes for preview
        const fontSize = String(token.value);
        const sizeValue = parseFloat(fontSize);
        const unit = fontSize.replace(/[0-9.]/g, '');
        const displaySize = sizeValue > 32 ? `${Math.min(32, sizeValue)}${unit}` : fontSize;
        
        visualElement = `<div class="font-size-sample" style="font-size: ${displaySize}">Aa</div>`;
        break;
      case 'lineHeight':
        visualElement = `
          <div class="line-height-sample">
            <div style="line-height: ${token.value}">Line 1<br>Line 2<br>Line 3</div>
          </div>
        `;
        break;
      case 'letterSpacing':
        visualElement = `<div class="letter-spacing-sample" style="letter-spacing: ${token.value}">Spacing</div>`;
        break;
      default:
        visualElement = `<div class="typography-sample">${token.value}</div>`;
    }
    
    html += `
      <div class="token-preview-item typography-preview-item" data-token-path="${token.path}" data-token-value="${token.value}" data-token-type="${token.type}">
        ${visualElement}
        <div class="token-info">
          <div class="token-path">${displayPath}</div>
          <div class="token-value">${token.value}</div>
        </div>
      </div>
    `;
  });
  
  return html;
}

/**
 * Generate HTML for duration tokens
 */
function generateDurationTokensPreview(tokens: VisualToken[]): string {
  let html = '<div class="token-preview-heading">Duration Tokens</div>';
  
  tokens.forEach(token => {
    // Extract path without collection/mode
    const pathParts = token.path.split('/');
    const displayPath = pathParts.slice(2).join('/');
    
    // Convert duration to milliseconds for animation
    let durationMs = 1000; // Default 1s
    const durationValue = String(token.value);
    
    if (durationValue.includes('ms')) {
      durationMs = parseFloat(durationValue);
    } else if (durationValue.includes('s')) {
      durationMs = parseFloat(durationValue) * 1000;
    }
    
    // Cap at 5s for preview
    const animationDuration = Math.min(durationMs / 1000, 5);
    
    html += `
      <div class="token-preview-item duration-preview-item" data-token-path="${token.path}" data-token-value="${token.value}" data-token-type="${token.type}">
        <div class="duration-swatch">
          <div class="duration-bar" style="animation-duration: ${animationDuration}s"></div>
        </div>
        <div class="token-info">
          <div class="token-path">${displayPath}</div>
          <div class="token-value">${token.value}</div>
        </div>
      </div>
    `;
  });
  
  return html;
}

/**
 * Generate HTML for shadow tokens
 */
function generateShadowTokensPreview(tokens: VisualToken[]): string {
  let html = '<div class="token-preview-heading">Shadow Tokens</div>';
  
  tokens.forEach(token => {
    // Extract path without collection/mode
    const pathParts = token.path.split('/');
    const displayPath = pathParts.slice(2).join('/');
    
    html += `
      <div class="token-preview-item shadow-preview-item" data-token-path="${token.path}" data-token-value="${token.value}" data-token-type="${token.type}">
        <div class="shadow-swatch">
          <div class="shadow-box" style="box-shadow: ${token.value}"></div>
        </div>
        <div class="token-info">
          <div class="token-path">${displayPath}</div>
          <div class="token-value">${token.value}</div>
        </div>
      </div>
    `;
  });
  
  return html;
}

/**
 * Generate HTML for generic token types
 */
function generateGenericTokensPreview(tokens: VisualToken[], type: string): string {
  let html = `<div class="token-preview-subheading">${formatTypeName(type)} Tokens</div>`;
  
  tokens.forEach(token => {
    // Extract path without collection/mode
    const pathParts = token.path.split('/');
    const displayPath = pathParts.slice(2).join('/');
    
    html += `
      <div class="token-preview-item generic-preview-item" data-token-path="${token.path}" data-token-value="${token.value}" data-token-type="${token.type}">
        <div class="generic-swatch">
          <div class="generic-indicator">${type.charAt(0).toUpperCase()}</div>
        </div>
        <div class="token-info">
          <div class="token-path">${displayPath}</div>
          <div class="token-value">${token.value}</div>
        </div>
      </div>
    `;
  });
  
  return html;
}

/**
 * Format type name for display (camelCase to Title Case with spaces)
 */
function formatTypeName(type: string): string {
  return type
    // Add space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Uppercase first letter
    .replace(/^./, str => str.toUpperCase())
    // Trim leading space if exists
    .trim();
}

/**
 * Setup interactions for token preview (click handling)
 */
function setupTokenPreviewInteractions(previewContainer: HTMLElement): void {
  // Add click handler for token preview items
  previewContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const tokenItem = target.closest('.token-preview-item') as HTMLElement;
    
    if (tokenItem) {
      const tokenPath = tokenItem.dataset.tokenPath || '';
      const tokenValue = tokenItem.dataset.tokenValue || '';
      const tokenType = tokenItem.dataset.tokenType || '';
      
      showTokenDetailPanel(tokenItem, tokenPath, tokenValue, tokenType);
    }
  });
}

/**
 * Show detailed token information in a popup panel
 */
function showTokenDetailPanel(
  anchorElement: HTMLElement, 
  tokenPath: string, 
  tokenValue: string, 
  tokenType: string
): void {
  // Remove any existing panels
  document.querySelectorAll('.token-detail-panel').forEach(panel => {
    panel.remove();
  });
  
  // Create a new panel
  const panel = document.createElement('div');
  panel.className = 'token-detail-panel';
  
  // Position it near the clicked token
  const rect = anchorElement.getBoundingClientRect();
  panel.style.top = `${rect.bottom + window.scrollY + 8}px`;
  panel.style.left = `${rect.left + window.scrollX}px`;
  
  // Check if this is a reference token
  const isReference = typeof tokenValue === 'string' && 
                     tokenValue.startsWith('{') && 
                     tokenValue.endsWith('}');
  
  // Extract the reference path if it's a reference
  const referencePath = isReference 
    ? tokenValue.substring(1, tokenValue.length - 1) 
    : '';
  
  // Format the token path into CSS variable name
  const cssVariable = `--${tokenPath.split('/').slice(2).join('-').toLowerCase()}`;
  
  // Generate CSS usage example
  const cssUsage = getCssUsageExample(tokenType, cssVariable);
  
  // Generate SCSS variable name
  const scssVariable = `${tokenPath.split('/').slice(2).join('-').toLowerCase()}`;
  
  // Generate appropriate visualization
  let visualization;
  if (isReference) {
    visualization = `
      <div class="reference-visualization">
        <div class="reference-arrow">⟶</div>
        <div class="reference-target">${referencePath}</div>
      </div>
    `;
  } else {
    visualization = getTokenVisualization(tokenType, tokenValue);
  }
  
  // Create the main content section
  let content = `
    <div class="token-detail-header">
      <div class="token-detail-title">${formatTokenTitle(tokenPath)}</div>
      <div class="token-detail-close">&times;</div>
    </div>
    
    <div class="token-detail-content">
      <div class="token-detail-row">
        <div class="token-detail-label">Path:</div>
        <div class="token-detail-value">${tokenPath}</div>
      </div>
      <div class="token-detail-row">
        <div class="token-detail-label">Type:</div>
        <div class="token-detail-value">${formatTypeName(tokenType)}</div>
      </div>
      <div class="token-detail-row">
        <div class="token-detail-label">Value:</div>
        <div class="token-detail-value">
          ${tokenValue}
          <button class="token-copy-button" data-copy-value="${tokenValue}">Copy</button>
          ${isReference ? '<span class="reference-label">Reference</span>' : ''}
        </div>
      </div>
  `;
  
  // Add reference-specific information if applicable
  if (isReference) {
    content += `
      <div class="token-detail-row">
        <div class="token-detail-label">References:</div>
        <div class="token-detail-value">${referencePath}</div>
      </div>
    `;
  }
  
  content += `
    </div>
    
    <div class="token-visualization">
      ${visualization}
    </div>
  `;
  
  // Add usage examples
  content += `
    <div class="token-usage-label">CSS Variable:</div>
    <div class="token-detail-row">
      <div class="token-detail-value">
        ${cssVariable}
        <button class="token-copy-button" data-copy-value="${cssVariable}">Copy</button>
      </div>
    </div>
    
    <div class="token-usage-label">CSS Usage:</div>
    <div class="token-detail-row">
      <div class="token-detail-value">
        ${cssUsage}
        <button class="token-copy-button" data-copy-value="${cssUsage}">Copy</button>
      </div>
    </div>
    
    <div class="token-usage-label">SCSS Variable:</div>
    <div class="token-detail-row">
      <div class="token-detail-value">
        ${scssVariable}
        <button class="token-copy-button" data-copy-value="${scssVariable}">Copy</button>
      </div>
    </div>
  `;
  
  panel.innerHTML = content;
  document.body.appendChild(panel);
  
  // Add copy button functionality
  panel.querySelectorAll('.token-copy-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const copyBtn = e.currentTarget as HTMLButtonElement;
      const value = copyBtn.dataset.copyValue || '';
      
      // Copy to clipboard
      navigator.clipboard.writeText(value).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 1000);
      });
      
      e.stopPropagation(); // Prevent event from bubbling up
    });
  });
  
  // Add close button functionality
  const closeBtn = panel.querySelector('.token-detail-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.remove();
    });
  }
  
  // Close when clicking outside
  document.addEventListener('click', function closePanel(e) {
    if (!panel.contains(e.target as Node) && 
        !anchorElement.contains(e.target as Node)) {
      panel.remove();
      document.removeEventListener('click', closePanel);
    }
  });
}

/**
 * Format a token path into a readable title
 */
function formatTokenTitle(path: string): string {
  const parts = path.split('/');
  if (parts.length < 3) return path;
  
  const collection = parts[0];
  const mode = parts[1];
  const tokenName = parts[parts.length - 1];
  const categories = parts.slice(2, -1).join('/');
  
  return `<strong>${tokenName}</strong> <span style="color: #666; font-size: 10px;">(${collection}/${mode}${categories ? '/' + categories : ''})</span>`;
}

/**
 * Generate token visualization based on type
 */
function getTokenVisualization(type: string, value: string): string {
  // Check if this is a reference
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    const referencePath = value.substring(1, value.length - 1);
    return `
      <div class="reference-visualization">
        <div class="reference-arrow">⟶</div>
        <div class="reference-target">${referencePath}</div>
      </div>
    `;
  }

  // Handle regular token types
  switch(type) {
    case 'color':
      return `<div style="width: 100%; height: 30px; background-color: ${value}; border-radius: 4px;"></div>`;
    
    case 'dimension':
      const size = String(value).replace(/[^0-9.]/g, '');
      // Cap at 100% width for visualization purposes
      const visualSize = Math.min(parseFloat(size), 100);
      return `<div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                <div style="width: ${visualSize}%; height: 100%; background: #0366d6;"></div>
              </div>`;
    
    case 'fontFamily':
      return `<div style="font-family: ${value}; font-size: 16px; text-align: center;">The quick brown fox jumps over the lazy dog</div>`;
    
    case 'fontWeight':
      return `<div style="font-weight: ${value}; font-size: 16px; text-align: center;">The quick brown fox jumps over the lazy dog</div>`;
    
    case 'fontSize':
      const fontSize = Math.min(parseFloat(value), 24) + 'px';
      return `<div style="font-size: ${fontSize}; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">The quick brown fox jumps over the lazy dog</div>`;
    
    case 'lineHeight':
      return `<div style="line-height: ${value}; font-size: 12px; text-align: center;">Line 1<br>Line 2</div>`;
    
    case 'letterSpacing':
      return `<div style="letter-spacing: ${value}; font-size: 14px; text-align: center;">THE QUICK BROWN FOX</div>`;
    
    case 'shadow':
      return `<div style="width: 60px; height: 30px; margin: 0 auto; background: white; border-radius: 4px; box-shadow: ${value};"></div>`;
    
    default:
      return `<div style="text-align: center; color: #666;">${value}</div>`;
  }
}

/**
 * Generate CSS usage example based on token type
 */
function getCssUsageExample(type: string, variable: string): string {
  switch(type) {
    case 'color':
      return `color: var(${variable});`;
    case 'dimension':
      return `margin: var(${variable});`;
    case 'fontFamily':
      return `font-family: var(${variable});`;
    case 'fontWeight':
      return `font-weight: var(${variable});`;
    case 'fontSize':
      return `font-size: var(${variable});`;
    case 'lineHeight':
      return `line-height: var(${variable});`;
    case 'letterSpacing':
      return `letter-spacing: var(${variable});`;
    case 'shadow':
      return `box-shadow: var(${variable});`;
    default:
      return `/* Custom property: */ var(${variable});`;
  }
}