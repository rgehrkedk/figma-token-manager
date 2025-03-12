/**
 * Visual Token Preview Component
 * Displays tokens in a visual format rather than raw JSON
 */

interface TokenPreviewConfig {
  containerId: string;
  onTokenClick?: (tokenPath: string, tokenValue: any) => void;
}

interface TokenGroup {
  type: string;
  name: string;
  tokens: TokenItem[];
}

interface TokenItem {
  path: string;
  value: any;
  type: string;
  isReference?: boolean;
  referencePath?: string;
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
    
    // Process tokens into groups by type
    const tokenGroups = processTokensIntoGroups(tokenData);
    
    // Build UI for each token group
    tokenGroups.forEach(group => {
      const groupContainer = createTokenGroupElement(group);
      if (container) {
        container.appendChild(groupContainer);
      }
    });
  }
  
  /**
   * Process token data into groups by type
   */
  function processTokensIntoGroups(tokenData: any): TokenGroup[] {
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
      other: { type: 'other', name: 'Other Tokens', tokens: [] }
    };
    
    // Flatten the token structure for processing
    const flatTokens = flattenTokens(tokenData);
    
    // Sort tokens into groups
    Object.entries(flatTokens).forEach(([path, value]) => {
      const tokenInfo = analyzeToken(path, value);
      
      if (groups[tokenInfo.type]) {
        groups[tokenInfo.type].tokens.push(tokenInfo);
      } else {
        groups.other.tokens.push(tokenInfo);
      }
    });
    
    // Convert the groups object to an array and remove empty groups
    return Object.values(groups).filter(group => group.tokens.length > 0);
  }
  
  /**
   * Analyze a token to determine its type and properties
   */
  function analyzeToken(path: string, value: any): TokenItem {
    // Default token
    const token: TokenItem = {
      path,
      value,
      type: 'other'
    };
    
    // Handle DTCG format
    if (value && typeof value === 'object' && value !== null && '$value' in value) {
      // Check for references
      if (typeof value.$value === 'string' && value.$value.startsWith('{') && value.$value.endsWith('}')) {
        token.isReference = true;
        token.referencePath = value.$value.slice(1, -1);
      }
      
      // Determine token type from $type or from the value
      if (value.$type) {
        token.type = value.$type;
      } else {
        token.type = determineTokenTypeFromValue(value.$value);
      }
      
      // Update the value to be the $value for simpler handling
      token.value = value;
    }
    // Handle legacy/simple format
    else {
      if (typeof value === 'string') {
        // Check for references in legacy format (assuming {path.to.token} format)
        if (value.startsWith('{') && value.endsWith('}')) {
          token.isReference = true;
          token.referencePath = value.slice(1, -1);
        }
        
        token.type = determineTokenTypeFromValue(value);
      }
      // If it's already an object but not in DTCG format
      else if (typeof value === 'object' && value !== null) {
        // Try to determine from path or nested properties
        if (path.includes('color') || path.includes('bg') || path.includes('background') || path.includes('border')) {
          token.type = 'color';
        } else if (path.includes('spacing') || path.includes('size') || path.includes('width') || path.includes('height') || path.includes('radius')) {
          token.type = 'dimension';
        }
        // For nested objects, we'll just leave them as 'other'
      }
    }
    
    return token;
  }
  
  /**
   * Try to determine token type from its value
   */
  function determineTokenTypeFromValue(value: any): string {
    if (typeof value !== 'string') return 'other';
    
    // Check for color formats
    if (
      value.startsWith('#') || 
      value.startsWith('rgb') || 
      value.startsWith('hsl') ||
      /^#[0-9A-Fa-f]{3,8}$/.test(value) // HEX color
    ) {
      return 'color';
    }
    
    // Check for dimension formats
    if (
      /^-?\d+(\.\d+)?(px|rem|em|vh|vw|vmin|vmax|%)$/.test(value)
    ) {
      return 'dimension';
    }
    
    // Check for common font family patterns
    if (
      value.includes('serif') || 
      value.includes('sans') || 
      value.includes('mono') ||
      value.includes('font')
    ) {
      return 'fontFamily';
    }
    
    // Check for font weight
    if (
      /^(normal|bold|lighter|bolder|\d00)$/.test(value)
    ) {
      return 'fontWeight';
    }
    
    // Check for duration
    if (
      /^-?\d+(\.\d+)?m?s$/.test(value)
    ) {
      return 'duration';
    }
    
    return 'other';
  }
  
  /**
   * Create a DOM element for a token group
   */
  function createTokenGroupElement(group: TokenGroup): HTMLElement {
    const groupElement = document.createElement('div');
    groupElement.className = 'token-preview-container';
    
    const heading = document.createElement('div');
    heading.className = 'token-preview-heading';
    heading.textContent = group.name;
    groupElement.appendChild(heading);
    
    const tokensGrid = document.createElement('div');
    tokensGrid.className = 'token-preview-items-grid';
    
    group.tokens.forEach(token => {
      const tokenElement = createTokenElement(token);
      tokensGrid.appendChild(tokenElement);
    });
    
    groupElement.appendChild(tokensGrid);
    return groupElement;
  }
  
  /**
   * Create a DOM element for a token
   */
  function createTokenElement(token: TokenItem): HTMLElement {
    const tokenElement = document.createElement('div');
    tokenElement.className = 'token-preview-item';
    tokenElement.dataset.path = token.path;
    tokenElement.dataset.type = token.type;
    
    if (token.isReference) {
      tokenElement.classList.add('reference-token');
    }
    
    // Add click handler
    tokenElement.addEventListener('click', () => {
      if (config.onTokenClick) {
        config.onTokenClick(token.path, token.value);
      }
    });
    
    // Add visual representation based on token type
    const visualElement = createVisualRepresentation(token);
    tokenElement.appendChild(visualElement);
    
    // Add token info
    const infoElement = document.createElement('div');
    infoElement.className = 'token-info';
    
    const pathElement = document.createElement('div');
    pathElement.className = 'token-path';
    pathElement.textContent = getShortPath(token.path);
    infoElement.appendChild(pathElement);
    
    let valueDisplay = '';
    if (token.isReference) {
      valueDisplay = token.referencePath || '';
      
      const refLabel = document.createElement('span');
      refLabel.className = 'reference-label';
      refLabel.textContent = 'ref';
      pathElement.appendChild(refLabel);
    } else {
      valueDisplay = formatTokenValue(token.value, token.type);
    }
    
    const valueElement = document.createElement('div');
    valueElement.className = 'token-value';
    valueElement.textContent = valueDisplay;
    infoElement.appendChild(valueElement);
    
    tokenElement.appendChild(infoElement);
    
    return tokenElement;
  }
  
  /**
   * Create a visual representation of a token based on its type
   */
  function createVisualRepresentation(token: TokenItem): HTMLElement {
    switch (token.type) {
      case 'color':
        return createColorSwatch(token);
      case 'dimension':
        return createDimensionSwatch(token);
      case 'fontFamily':
        return createFontFamilySample(token);
      case 'fontWeight':
        return createFontWeightSample(token);
      case 'fontSize':
        return createFontSizeSample(token);
      case 'lineHeight':
        return createLineHeightSample(token);
      case 'letterSpacing':
        return createLetterSpacingSample(token);
      case 'duration':
        return createDurationSwatch(token);
      case 'shadow':
        return createShadowSwatch(token);
      default:
        return createGenericSwatch(token);
    }
  }
  
  /**
   * Create a color swatch for color tokens
   */
  function createColorSwatch(token: TokenItem): HTMLElement {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    
    // Try to extract color value
    let colorValue = '';
    
    if (token.isReference) {
      // For reference tokens, use a special styling
      swatch.classList.add('reference-token');
      
      // If it's an unresolved reference, show a special pattern
      swatch.classList.add('unresolved-reference');
      
      // Add reference icon
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon';
      refIcon.textContent = '↗';
      swatch.appendChild(refIcon);
    } else {
      // Extract color value
      if (typeof token.value === 'object' && token.value !== null && '$value' in token.value) {
        colorValue = token.value.$value;
      } else if (typeof token.value === 'string') {
        colorValue = token.value;
      }
      
      // Apply the color
      if (colorValue) {
        swatch.style.backgroundColor = colorValue;
        
        // Check for transparency
        if (
          colorValue.includes('rgba') ||
          colorValue.includes('hsla') ||
          (colorValue.startsWith('#') && colorValue.length === 9)
        ) {
          swatch.classList.add('transparent');
        }
      }
    }
    
    return swatch;
  }
  
  /**
   * Create a dimension swatch
   */
  function createDimensionSwatch(token: TokenItem): HTMLElement {
    const swatch = document.createElement('div');
    swatch.className = 'dimension-swatch';
    
    // Try to extract dimension value
    let dimensionValue = '';
    let size = 0;
    
    if (token.isReference) {
      swatch.classList.add('reference-token');
      
      // Add reference icon
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      swatch.appendChild(refIcon);
    } else {
      // Extract dimension value
      if (typeof token.value === 'object' && token.value !== null && '$value' in token.value) {
        dimensionValue = token.value.$value;
      } else if (typeof token.value === 'string' || typeof token.value === 'number') {
        dimensionValue = String(token.value);
      }
      
      // Parse the dimension to get a size
      if (dimensionValue) {
        const match = dimensionValue.match(/^-?(\d+(\.\d+)?)/);
        if (match) {
          size = parseFloat(match[1]);
        }
      }
      
      // Apply the size
      if (size) {
        swatch.style.width = `${size}px`;
        swatch.style.height = `${size}px`;
      }
    }
    
    return swatch;
  }
  
  /**
   * Create a font family sample
   */
  function createFontFamilySample(token: TokenItem): HTMLElement {
    const sample = document.createElement('div');
    sample.className = 'font-family-sample';
    
    // Try to extract font family value
    let fontFamilyValue = '';
    
    if (token.isReference) {
      sample.classList.add('reference-token');
      
      // Add reference icon
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      sample.appendChild(refIcon);
    } else {
      // Extract font family value
      if (typeof token.value === 'object' && token.value !== null && '$value' in token.value) {
        fontFamilyValue = token.value.$value;
      } else if (typeof token.value === 'string') {
        fontFamilyValue = token.value;
      }
      
      // Apply the font family
      if (fontFamilyValue) {
        sample.style.fontFamily = fontFamilyValue;
        sample.textContent = 'AaBbCc';
      }
    }
    
    return sample;
  }
  
  /**
   * Create a font weight sample
   */
  function createFontWeightSample(token: TokenItem): HTMLElement {
    const sample = document.createElement('div');
    sample.className = 'font-weight-sample';
    
    // Try to extract font weight value
    let fontWeightValue = '';
    
    if (token.isReference) {
      sample.classList.add('reference-token');
      
      // Add reference icon
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      sample.appendChild(refIcon);
    } else {
      // Extract font weight value
      if (typeof token.value === 'object' && token.value !== null && '$value' in token.value) {
        fontWeightValue = token.value.$value;
      } else if (typeof token.value === 'string' || typeof token.value === 'number') {
        fontWeightValue = String(token.value);
      }
      
      // Apply the font weight
      if (fontWeightValue) {
        sample.style.fontWeight = fontWeightValue;
        sample.textContent = 'AaBbCc';
      }
    }
    
    return sample;
  }
  
  /**
   * Create a font size sample
   */
  function createFontSizeSample(token: TokenItem): HTMLElement {
    const sample = document.createElement('div');
    sample.className = 'font-size-sample';
    
    // Try to extract font size value
    let fontSizeValue = '';
    
    if (token.isReference) {
      sample.classList.add('reference-token');
      
      // Add reference icon
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      sample.appendChild(refIcon);
    } else {
      // Extract font size value
      if (typeof token.value === 'object' && token.value !== null && '$value' in token.value) {
        fontSizeValue = token.value.$value;
      } else if (typeof token.value === 'string' || typeof token.value === 'number') {
        fontSizeValue = String(token.value);
      }
      
      // Apply the font size
      if (fontSizeValue) {
        sample.style.fontSize = fontSizeValue;
        sample.textContent = 'AaBbCc';
      }
    }
    
    return sample;
  }
  
  /**
   * Create a line height sample
   */
  function createLineHeightSample(token: TokenItem): HTMLElement {
    const sample = document.createElement('div');
    sample.className = 'line-height-sample';
    
    // Try to extract line height value
    let lineHeightValue = '';
    
    if (token.isReference) {
      sample.classList.add('reference-token');
      
      // Add reference icon
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      sample.appendChild(refIcon);
    } else {
      // Extract line height value
      if (typeof token.value === 'object' && token.value !== null && '$value' in token.value) {
        lineHeightValue = token.value.$value;
      } else if (typeof token.value === 'string' || typeof token.value === 'number') {
        lineHeightValue = String(token.value);
      }
      
      // Apply the line height
      if (lineHeightValue) {
        sample.style.lineHeight = lineHeightValue;
        sample.textContent = 'AaBbCc';
      }
    }
    
    return sample;
  }
  
  /**
   * Create a letter spacing sample
   */
  function createLetterSpacingSample(token: TokenItem): HTMLElement {
    const sample = document.createElement('div');
    sample.className = 'letter-spacing-sample';
    
    // Try to extract letter spacing value
    let letterSpacingValue = '';
    
    if (token.isReference) {
      sample.classList.add('reference-token');
      
      // Add reference icon
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      sample.appendChild(refIcon);
    } else {
      // Extract letter spacing value
      if (typeof token.value === 'object' && token.value !== null && '$value' in token.value) {
        letterSpacingValue = token.value.$value;
      } else if (typeof token.value === 'string' || typeof token.value === 'number') {
        letterSpacingValue = String(token.value);
      }
      
      // Apply the letter spacing
      if (letterSpacingValue) {
        sample.style.letterSpacing = letterSpacingValue;
        sample.textContent = 'AaBbCc';
      }
    }
    
    return sample;
  }
  
  /**
   * Create a duration swatch
   */
  function createDurationSwatch(token: TokenItem): HTMLElement {
    const swatch = document.createElement('div');
    swatch.className = 'duration-swatch';
    
    // Try to extract duration value
    let durationValue = '';
    
    if (token.isReference) {
      swatch.classList.add('reference-token');
      
      // Add reference icon
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      swatch.appendChild(refIcon);
    } else {
      // Extract duration value
      if (typeof token.value === 'object' && token.value !== null && '$value' in token.value) {
        durationValue = token.value.$value;
      } else if (typeof token.value === 'string' || typeof token.value === 'number') {
        durationValue = String(token.value);
      }
      
      // Apply the duration
      if (durationValue) {
        swatch.textContent = durationValue;
      }
    }
    
    return swatch;
  }
  
  /**
   * Create a shadow swatch
   */
  function createShadowSwatch(token: TokenItem): HTMLElement {
    const swatch = document.createElement('div');
    swatch.className = 'shadow-swatch';
    
    // Try to extract shadow value
    let shadowValue = '';
    
    if (token.isReference) {
      swatch.classList.add('reference-token');
      
      // Add reference icon
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      swatch.appendChild(refIcon);
    } else {
      // Extract shadow value
      if (typeof token.value === 'object' && token.value !== null && '$value' in token.value) {
        shadowValue = token.value.$value;
      } else if (typeof token.value === 'string') {
        shadowValue = token.value;
      }
      
      // Apply the shadow
      if (shadowValue) {
        swatch.style.boxShadow = shadowValue;
      }
    }
    
    return swatch;
  }
  
  /**
   * Create a generic swatch for other token types
   */
  function createGenericSwatch(token: TokenItem): HTMLElement {
    const swatch = document.createElement('div');
    swatch.className = 'generic-swatch';
    
    // Try to extract value
    let value = '';
    
    if (token.isReference) {
      swatch.classList.add('reference-token');
      
      // Add reference icon
      const refIcon = document.createElement('div');
      refIcon.className = 'reference-icon-small';
      refIcon.textContent = '↗';
      swatch.appendChild(refIcon);
    } else {
      // Extract value
      if (typeof token.value === 'object' && token.value !== null && '$value' in token.value) {
        value = token.value.$value;
      } else if (typeof token.value === 'string' || typeof token.value === 'number') {
        value = String(token.value);
      }
      
      // Apply the value
      if (value) {
        swatch.textContent = value;
      }
    }
    
    return swatch;
  }
  
  /**
   * Flatten the token structure for easier processing
   */
  function flattenTokens(tokenData: any): { [key: string]: any } {
    const flatTokens: { [key: string]: any } = {};
    
    function recurse(obj: any, currentPath: string) {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        
        if (value && typeof value === 'object' && !('$value' in value)) {
          recurse(value, newPath);
        } else {
          flatTokens[newPath] = value;
        }
      });
    }
    
    recurse(tokenData, '');
    return flatTokens;
  }
  
  /**
   * Get a short version of the token path
   */
  function getShortPath(path: string): string {
    const parts = path.split('.');
    return parts[parts.length - 1];
  }
  
  /**
   * Format the token value for display
   */
  function formatTokenValue(value: any, type: string): string {
    if (typeof value === 'object' && value !== null && '$value' in value) {
      return String(value.$value);
    }
    
    return String(value);
  }
  
  return {
    update: updatePreview,
    clear: () => {
      if (container) {
        container.innerHTML = '';
      }
    }
  };
}
