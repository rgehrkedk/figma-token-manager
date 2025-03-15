/**
 * HierarchicalTokens Component
 * Displays design tokens in a hierarchical structure with proper headings
 */

export interface TokenValue {
  $value: any;
  $type: string;
  $resolvedValue?: any;
  [key: string]: any;
}

export interface TokenGroup {
  [key: string]: TokenGroup | TokenValue;
}

export interface HierarchicalTokensProps {
  tokens: TokenGroup;
  onTokenClick?: (path: string, value: any, type: string) => void;
}

export function createHierarchicalTokens(props: HierarchicalTokensProps): HTMLElement {
  const { tokens, onTokenClick } = props;
  
  // Create container
  const container = document.createElement('div');
  container.className = 'hierarchical-tokens';
  
  // Process top-level groups (first level)
  Object.keys(tokens).forEach(topGroupKey => {
    const topGroup = tokens[topGroupKey];
    
    // Skip if not an object
    if (!topGroup || typeof topGroup !== 'object') return;
    
    // Create section for top-level group (h3)
    const section = document.createElement('section');
    section.className = 'token-section';
    section.id = `section-${topGroupKey}`;
    
    const sectionHeading = document.createElement('h3');
    sectionHeading.className = 'token-section-heading';
    sectionHeading.textContent = topGroupKey;
    section.appendChild(sectionHeading);
    
    // Process second-level groups
    Object.keys(topGroup).forEach(secondGroupKey => {
      const secondGroup = (topGroup as TokenGroup)[secondGroupKey];
      
      // Skip if not an object
      if (!secondGroup || typeof secondGroup !== 'object') return;
      
      // Check if this is a token value or another group
      if ('$value' in secondGroup && '$type' in secondGroup) {
        // This is a token value directly under the top group
        const tokenItem = createTokenItem(
          `${topGroupKey}.${secondGroupKey}`, 
          secondGroup as TokenValue, 
          onTokenClick
        );
        section.appendChild(tokenItem);
      } else {
        // This is a second-level group (h4)
        const subSection = document.createElement('div');
        subSection.className = 'token-subsection';
        
        const subHeading = document.createElement('h4');
        subHeading.className = 'token-subsection-heading';
        subHeading.textContent = `${topGroupKey}.${secondGroupKey}`;
        subSection.appendChild(subHeading);
        
        // Process third-level and deeper tokens
        processNestedTokens(
          secondGroup as TokenGroup, 
          `${topGroupKey}.${secondGroupKey}`, 
          subSection,
          onTokenClick
        );
        
        section.appendChild(subSection);
      }
    });
    
    container.appendChild(section);
  });
  
  return container;
}

/**
 * Process nested tokens at the third level and deeper
 */
function processNestedTokens(
  group: TokenGroup, 
  basePath: string, 
  parentElement: HTMLElement,
  onTokenClick?: (path: string, value: any, type: string) => void
): void {
  // Create a wrapper for token items
  const tokensWrapper = document.createElement('div');
  tokensWrapper.className = 'token-items-wrapper';
  
  Object.keys(group).forEach(key => {
    const item = group[key];
    const itemPath = `${basePath}.${key}`;
    
    // Check if this is a token value or another group
    if (item && typeof item === 'object' && '$value' in item && '$type' in item) {
      // This is a token value
      const tokenItem = createTokenItem(itemPath, item as TokenValue, onTokenClick);
      tokensWrapper.appendChild(tokenItem);
    } else if (item && typeof item === 'object') {
      // This is a deeper group - we'll flatten it
      processNestedTokens(item as TokenGroup, itemPath, tokensWrapper, onTokenClick);
    }
  });
  
  parentElement.appendChild(tokensWrapper);
}

/**
 * Create a token item element
 */
function createTokenItem(
  path: string, 
  token: TokenValue,
  onTokenClick?: (path: string, value: any, type: string) => void
): HTMLElement {
  const tokenItem = document.createElement('div');
  tokenItem.className = `token-item token-type-${token.$type}`;
  tokenItem.dataset.path = path;
  
  // Get the token name from the path
  const tokenName = path.split('.').pop() || '';
  
  // Create token preview based on type
  const tokenPreview = document.createElement('div');
  tokenPreview.className = 'token-preview';
  
  // Check if this is a reference and has a resolved value
  const isReference = typeof token.$value === 'string' && 
                     token.$value.startsWith('{') && 
                     token.$value.endsWith('}');
  
  // Use the resolved value for display if available
  const displayValue = isReference && token.$resolvedValue ? token.$resolvedValue : token.$value;
  
  // Add type-specific preview
  switch (token.$type) {
    case 'color':
      tokenPreview.innerHTML = `<div class="token-color-preview" style="background-color: ${displayValue}"></div>`;
      break;
    case 'dimension':
    case 'spacing':
    case 'borderRadius':
      tokenPreview.innerHTML = `<div class="token-dimension-preview" style="width: ${displayValue}; height: 24px;"></div>`;
      break;
    default:
      tokenPreview.innerHTML = `<div class="token-generic-preview">${token.$type.charAt(0).toUpperCase()}</div>`;
  }
  
  // Create token info
  const tokenInfo = document.createElement('div');
  tokenInfo.className = 'token-info';
  
  // Add token name and value
  tokenInfo.innerHTML = `
    <div class="token-name">${tokenName}</div>
    <div class="token-value">${isReference ? 
      `<span class="reference-value">${token.$value}</span>` : 
      formatTokenValue(token.$value)}</div>
  `;
  
  // Add all elements to token item
  tokenItem.appendChild(tokenPreview);
  tokenItem.appendChild(tokenInfo);
  
  // Add click handler
  if (onTokenClick) {
    tokenItem.addEventListener('click', () => {
      onTokenClick(path, token.$value, token.$type);
    });
  }
  
  return tokenItem;
}

/**
 * Format token value for display
 */
function formatTokenValue(value: any): string {
  if (value === null || value === undefined) {
    return 'undefined';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}