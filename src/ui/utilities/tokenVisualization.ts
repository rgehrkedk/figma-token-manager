/**
 * Utilities for token visualization preview
 */

import { ColorFormat } from '../../code/formatters/colorTransforms';

// Interface for generic token
export interface VisualToken {
  path: string;
  type: string; // color, dimension, typography, etc.
  value: any;
  originalValue?: any;
}

/**
 * Extracts all types of tokens from token data
 */
export function extractVisualTokens(tokenData: any): VisualToken[] {
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
    // Likely a scale factor or unitless value
    return 'number';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  }
  
  // Default if we can't determine a specific type
  return 'string';
}

/**
 * Generate HTML for a visual token preview
 */
export function generateVisualTokenPreview(tokens: VisualToken[], colorFormat: ColorFormat): string {
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
    html += generateColorTokensPreview(tokensByType['color'], colorFormat);
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
function generateColorTokensPreview(tokens: VisualToken[], colorFormat: ColorFormat): string {
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
      // Determine if transparent
      const isTransparent = String(token.value).includes('rgba') || 
                           String(token.value).includes('hsla') || 
                           (String(token.value).startsWith('#') && String(token.value).length === 9);
      
      // Extract path without collection
      const displayPath = token.path.split('/').slice(2).join('/');
      
      html += `
        <div class="token-preview-item color-preview-item" data-token-path="${token.path}" data-token-value="${token.value}" data-token-type="${token.type}">
          <div class="color-swatch ${isTransparent ? 'transparent' : ''}" style="background-color: ${token.value}"></div>
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
      // Extract path without collection
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
    // Extract path without collection
    const pathParts = token.path.split('/');
    const collection = pathParts[0];
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
    // Extract path without collection
    const pathParts = token.path.split('/');
    const collection = pathParts[0];
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
    // Extract path without collection
    const pathParts = token.path.split('/');
    const collection = pathParts[0];
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
    // Extract path without collection
    const pathParts = token.path.split('/');
    const collection = pathParts[0];
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