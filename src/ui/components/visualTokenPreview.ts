/**
 * Visual Token Preview Component
 * Displays tokens in a visual format rather than raw JSON
 * Updated to use consolidated token resolver
 */

import { ColorFormat } from '../../code/formatters/colorUtils';
import { 
  buildTokenReferenceMap, 
  resolveTokenReference,
  TokenReferenceMap,
  VisualToken
} from '../../code/formatters/tokenResolver';

interface TokenPreviewConfig {
  containerId: string;
  onTokenClick?: (tokenPath: string, tokenValue: any) => void;
}

interface TokenGroup {
  type: string;
  name: string;
  tokens: VisualToken[];
}

/**
 * Setup the visual token preview component
 */
export function setupVisualTokenPreview(config: TokenPreviewConfig) {
  const container = document.getElementById(config.containerId);
  if (!container) {
    console.error(`Container ${config.containerId} not found`);
    return {
      update: () => {},
      clear: () => {}
    };
  }
  
  /**
   * Update the visual preview with token data
   */
  function updatePreview(tokenData: any) {
    // Clear existing content
    if (container) {
      container.innerHTML = '';
    }
    
    if (!tokenData || Object.keys(tokenData).length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No tokens to display. Select collections and modes to view tokens.';
      if (container) {
        container.appendChild(emptyMessage);
      }
      return;
    }
    
    // Build reference map for resolution
    const referenceMap = buildTokenReferenceMap(tokenData);
    
    // Extract visual tokens
    const visualTokens = extractVisualTokens(tokenData);
    
    // Resolve references
    const { resolvedTokens } = resolveReferences(visualTokens, referenceMap);
    
    // Process tokens into groups by type
    const tokenGroups = processTokensIntoGroups(resolvedTokens);
    
    // Build UI for each token group
    tokenGroups.forEach(group => {
      const groupContainer = createTokenGroupElement(group, config.onTokenClick);
      if (container) {
        container.appendChild(groupContainer);
      }
    });
  }
  
  /**
   * Extract visual tokens from token data
   */
  function extractVisualTokens(tokenData: any): VisualToken[] {
    const tokens: VisualToken[] = [];
    
    function processTokens(obj: any, path: string = '') {
      if (!obj || typeof obj !== 'object') return;
      
      // Process DTCG format tokens
      if (obj.$value !== undefined && obj.$type !== undefined) {
        tokens.push({
          path,
          type: obj.$type,
          value: obj.$value,
          originalValue: obj.$originalValue || obj.$value
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
            tokens.push({
              path: newPath,
              type: inferredType,
              value,
              originalValue: value
            });
          }
        }
      }
    }
    
    // Process each collection and mode
    for (const collection in tokenData) {
      for (const mode in tokenData[collection]) {
        processTokens(tokenData[collection][mode], `${collection}/${mode}`);
      }
    }
    
    return tokens;
  }
  
  /**
   * Resolve references in tokens
   */
  function resolveReferences(
    tokens: VisualToken[],
    referenceMap: TokenReferenceMap
  ): { resolvedTokens: VisualToken[]; numResolved: number; numUnresolved: number } {
    let numResolved = 0;
    let numUnresolved = 0;
    
    const resolvedTokens = tokens.map(token => {
      // Check if this is a reference
      if (typeof token.value === 'string' && 
          token.value.startsWith('{') && 
          token.value.endsWith('}')) {
        
        // Resolve the reference
        const resolved = resolveTokenReference(token.value, referenceMap);
        
        if (resolved.isResolved) {
          numResolved++;
          return {
            ...token,
            referencedValue: resolved.value,
            referencedType: resolved.type,
            resolvedFrom: resolved.resolvedFrom
          };
        } else {
          numUnresolved++;
        }
      }
      
      return token;
    });
    
    return { resolvedTokens, numResolved, numUnresolved };
  }
  
  /**
   * Process tokens into groups by type
   */
  function processTokensIntoGroups(tokens: VisualToken[]): TokenGroup[] {
    const groups: { [key: string]: TokenGroup } = {
      color: { type: 'color', name: 'Colors', tokens: [] },
      dimension: { type: 'dimension', name: 'Dimensions', tokens: [] },
      fontFamily: { type: 'fontFamily', name: 'Font Families', tokens: [] },
      fontWeight: { type: 'fontWeight', name: 'Font Weights', tokens: [] },
      fontSize: { type: 'fontSize', name: 'Font Sizes', tokens: [] },
      lineHeight: { type: 'lineHeight', name: 'Line Heights', tokens: [] },
      letterSpacing: { type: 'letterSpacing', name: 'Letter Spacing', tokens: [] },
      duration: { type: 'duration', name: 'Durations', tokens: [] },
      shadow: { type: 'shadow', name: 'Shadows', tokens: [] },
      number: { type: 'number', name: 'Numbers', tokens: [] },
      string: { type: 'string', name: 'Strings', tokens: [] },
      other: { type: 'other', name: 'Other Tokens', tokens: [] }
    };
    
    // Sort tokens into groups
    tokens.forEach(token => {
      if (groups[token.type]) {
        groups[token.type].tokens.push(token);
      } else {
        groups.other.tokens.push(token);
      }
    });
    
    // Convert the groups object to an array and remove empty groups
    return Object.values(groups).filter(group => group.tokens.length > 0);
  }
  
  /**
   * Create a DOM element for a token group
   */
  function createTokenGroupElement(
    group: TokenGroup, 
    onTokenClick?: (tokenPath: string, tokenValue: any) => void
  ): HTMLElement {
    const groupElement = document.createElement('div');
    groupElement.className = 'token-preview-container';
    
    const heading = document.createElement('div');
    heading.className = 'token-preview-heading';
    heading.textContent = group.name;
    groupElement.appendChild(heading);
    
    const tokensGrid = document.createElement('div');
    tokensGrid.className = 'token-preview-items-grid';
    
    group.tokens.forEach(token => {
      const tokenElement = createTokenElement(token, onTokenClick);
      tokensGrid.appendChild(tokenElement);
    });
    
    groupElement.appendChild(tokensGrid);
    return groupElement;
  }
  
  /**
   * Create a DOM element for a token
   */
  function createTokenElement(
    token: VisualToken,
    onTokenClick?: (tokenPath: string, tokenValue: any) => void
  ): HTMLElement {
    const tokenElement = document.createElement('div');
    tokenElement.className = 'token-preview-item';
    tokenElement.dataset.path = token.path;
    tokenElement.dataset.type = token.type;
    
    // Check if this is a reference
    const isReference = typeof token.value === 'string' && 
                      token.value.startsWith('{') && 
                      token.value.endsWith('}');
    
    if (isReference) {
      tokenElement.classList.add('reference-token');
    }
    
    // Add click handler
    if (onTokenClick) {
      tokenElement.addEventListener('click', () => {
        onTokenClick(token.path, token.value);
      });
    }
    
    // Add token visualization
    const visualElement = createTokenVisualization(token);
    tokenElement.appendChild(visualElement);
    
    // Add token info
    const infoElement = document.createElement('div');
    infoElement.className = 'token-info';
    
    // Create display path without collection/mode parts
    const pathParts = token.path.split('/');
    const displayPath = pathParts.length > 2 ? pathParts.slice(2).join('/') : token.path;
    
    // Token path
    const pathElement = document.createElement('div');
    pathElement.className = 'token-path';
    pathElement.textContent = displayPath;
    
    // Add reference indicator if needed
    if (isReference) {
      const refLabel = document.createElement('span');
      refLabel.className = 'reference-label';
      refLabel.textContent = 'ref';
      pathElement.appendChild(refLabel);
    }
    
    infoElement.appendChild(pathElement);
    
    // Token value
    const valueElement = document.createElement('div');
    valueElement.className = 'token-value';
    
    // Display value
    valueElement.textContent = String(token.value);
    
    // Add resolved value if it's a reference with resolved value
    if (isReference && token.referencedValue) {
      const resolvedElement = document.createElement('span');
      resolvedElement.className = 'resolved-value';
      resolvedElement.textContent = String(token.referencedValue);
      valueElement.appendChild(resolvedElement);
    }
    
    infoElement.appendChild(valueElement);
    tokenElement.appendChild(infoElement);
    
    return tokenElement;
  }
  
  /**
   * Create a visual representation of a token based on its type
   */
  function createTokenVisualization(token: VisualToken): HTMLElement {
    const isReference = typeof token.value === 'string' && 
                      token.value.startsWith('{') && 
                      token.value.endsWith('}');
    
    // Determine the value to display
    const displayValue = isReference && token.referencedValue 
                       ? token.referencedValue 
                       : token.value;
    
    switch (token.type) {
      case 'color':
        return createColorSwatch(displayValue, isReference);
      case 'dimension':
        return createDimensionSwatch(displayValue, isReference);
      case 'fontFamily':
        return createFontFamilySample(displayValue, isReference);
      case 'fontWeight':
        return createFontWeightSample(displayValue, isReference);
      case 'fontSize':
        return createFontSizeSample(displayValue, isReference);
      case 'lineHeight':
        return createLineHeightSample(displayValue, isReference);
      case 'letterSpacing':
        return createLetterSpacingSample(displayValue, isReference);
      case 'duration':
        return createDurationSwatch(displayValue, isReference);
      case 'shadow':
        return createShadowSwatch(displayValue, isReference);
      default:
        return createGenericSwatch(token.type, isReference);
    }
  }
  
  /**
   * Create a color swatch for color tokens
   */
  function createColorSwatch(color: any, isReference: boolean): HTMLElement {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    
    // Apply the color
    try {
      swatch.style.backgroundColor = color;
    } catch (error) {
      console.warn('Invalid color value:', color);
    }
    
    // Add reference icon if needed
    if (isReference) {
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon';
      refIcon.textContent = '↗';
      swatch.appendChild(refIcon);
    }
    
    return swatch;
  }
  
  /**
   * Create a dimension swatch
   */
  function createDimensionSwatch(value: any, isReference: boolean): HTMLElement {
    const swatch = document.createElement('div');
    swatch.className = 'dimension-swatch';
    
    // Create dimension bar
    const bar = document.createElement('div');
    bar.className = 'dimension-bar';
    
    // Try to extract a size value
    if (typeof value === 'string') {
      const match = value.match(/^(\d+(\.\d+)?)/);
      if (match) {
        const size = parseFloat(match[1]);
        bar.style.width = `${Math.min(size, 100)}%`;
      }
    } else if (typeof value === 'number') {
      bar.style.width = `${Math.min(value, 100)}%`;
    }
    
    swatch.appendChild(bar);
    
    // Add reference icon if needed
    if (isReference) {
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      swatch.appendChild(refIcon);
    }
    
    return swatch;
  }
  
  /**
   * Create a font family sample
   */
  function createFontFamilySample(value: any, isReference: boolean): HTMLElement {
    const sample = document.createElement('div');
    sample.className = 'font-family-sample';
    sample.textContent = 'Aa';
    
    try {
      sample.style.fontFamily = String(value);
    } catch (error) {
      console.warn('Invalid font family:', value);
    }
    
    // Add reference icon if needed
    if (isReference) {
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      sample.appendChild(refIcon);
    }
    
    return sample;
  }
  
  /**
   * Create a font weight sample
   */
  function createFontWeightSample(value: any, isReference: boolean): HTMLElement {
    const sample = document.createElement('div');
    sample.className = 'font-weight-sample';
    sample.textContent = 'Aa';
    
    try {
      sample.style.fontWeight = String(value);
    } catch (error) {
      console.warn('Invalid font weight:', value);
    }
    
    // Add reference icon if needed
    if (isReference) {
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      sample.appendChild(refIcon);
    }
    
    return sample;
  }
  
  /**
   * Create a font size sample
   */
  function createFontSizeSample(value: any, isReference: boolean): HTMLElement {
    const sample = document.createElement('div');
    sample.className = 'font-size-sample';
    sample.textContent = 'Aa';
    
    // Use a scaled version for display to prevent huge samples
    let displaySize = String(value);
    if (typeof value === 'string' && /^\d/.test(value)) {
      const size = parseFloat(value);
      const unit = value.replace(/[\d.]/g, '');
      displaySize = `${Math.min(size, 24)}${unit}`;
    }
    
    try {
      sample.style.fontSize = displaySize;
    } catch (error) {
      console.warn('Invalid font size:', value);
    }
    
    // Add reference icon if needed
    if (isReference) {
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      sample.appendChild(refIcon);
    }
    
    return sample;
  }
  
  /**
   * Create a line height sample
   */
  function createLineHeightSample(value: any, isReference: boolean): HTMLElement {
    const sample = document.createElement('div');
    sample.className = 'line-height-sample';
    
    const text = document.createElement('div');
    text.innerHTML = 'Line 1<br>Line 2';
    
    try {
      text.style.lineHeight = String(value);
    } catch (error) {
      console.warn('Invalid line height:', value);
    }
    
    sample.appendChild(text);
    
    // Add reference icon if needed
    if (isReference) {
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      sample.appendChild(refIcon);
    }
    
    return sample;
  }
  
  /**
   * Create a letter spacing sample
   */
  function createLetterSpacingSample(value: any, isReference: boolean): HTMLElement {
    const sample = document.createElement('div');
    sample.className = 'letter-spacing-sample';
    sample.textContent = 'SPACING';
    
    try {
      sample.style.letterSpacing = String(value);
    } catch (error) {
      console.warn('Invalid letter spacing:', value);
    }
    
    // Add reference icon if needed
    if (isReference) {
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      sample.appendChild(refIcon);
    }
    
    return sample;
  }
  
  /**
   * Create a duration swatch
   */
  function createDurationSwatch(value: any, isReference: boolean): HTMLElement {
    const swatch = document.createElement('div');
    swatch.className = 'duration-swatch';
    swatch.textContent = String(value);
    
    // Add reference icon if needed
    if (isReference) {
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      swatch.appendChild(refIcon);
    }
    
    return swatch;
  }
  
  /**
   * Create a shadow swatch
   */
  function createShadowSwatch(value: any, isReference: boolean): HTMLElement {
    const swatch = document.createElement('div');
    swatch.className = 'shadow-swatch';
    
    const box = document.createElement('div');
    box.className = 'shadow-box';
    
    try {
      box.style.boxShadow = String(value);
    } catch (error) {
      console.warn('Invalid shadow:', value);
    }
    
    swatch.appendChild(box);
    
    // Add reference icon if needed
    if (isReference) {
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      swatch.appendChild(refIcon);
    }
    
    return swatch;
  }
  
  /**
   * Create a generic swatch for other token types
   */
  function createGenericSwatch(type: string, isReference: boolean): HTMLElement {
    const swatch = document.createElement('div');
    swatch.className = 'generic-swatch';
    
    const indicator = document.createElement('div');
    indicator.className = 'generic-indicator';
    indicator.textContent = type.charAt(0).toUpperCase();
    
    swatch.appendChild(indicator);
    
    // Add reference icon if needed
    if (isReference) {
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      swatch.appendChild(refIcon);
    }
    
    return swatch;
  }
  
  /**
   * Infer token type from its value
   */
  function inferTokenType(value: any): string | null {
    if (typeof value === 'string') {
      // Reference check
      if (value.startsWith('{') && value.endsWith('}')) {
        return 'reference';
      }
      // Color check
      else if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
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
      return 'string';
    } else if (typeof value === 'number') {
      return 'number';
    } else if (typeof value === 'boolean') {
      return 'boolean';
    }
    
    return 'other';
  }
  
  // Return public interface
  return {
    update: updatePreview,
    clear: () => {
      if (container) {
        container.innerHTML = '';
      }
    }
  };
}