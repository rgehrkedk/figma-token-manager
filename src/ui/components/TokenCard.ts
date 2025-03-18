/**
 * TokenCard.ts
 * 
 * Component for displaying individual tokens with special handling for references.
 * Focuses on showing reference paths rather than resolved values while
 * still displaying visualizations using the resolved values.
 */

import { TokenData, isReference, formatReferenceDisplay } from "../reference/ReferenceResolver";

export interface TokenCardProps {
  token: TokenData;
  onClick: (token: TokenData) => void;
}

/**
 * Creates a token card DOM element
 */
export function createTokenCard(props: TokenCardProps): HTMLElement {
  const { token, onClick } = props;
  
  // Create the card element
  const card = document.createElement('div');
  card.className = 'token-card';
  card.dataset.id = token.id;
  card.dataset.type = token.type;
  card.dataset.path = token.path;
  
  // Add reference class if it's a reference
  if (token.reference) {
    card.classList.add('is-reference');
  }
  
  // Create card content based on token type
  let cardContent = '';
  
  switch (token.type) {
    case 'color':
      cardContent = createColorTokenContent(token);
      break;
    
    case 'dimension':
      cardContent = createDimensionTokenContent(token);
      break;
      
    case 'radius':
      cardContent = createRadiusTokenContent(token);
      break;
      
    case 'spacing':
    case 'size':
      cardContent = createSpacingTokenContent(token);
      break;
      
    case 'borderRadius':
      cardContent = createRadiusTokenContent(token);
      break;
    
    case 'fontFamily':
    case 'fontWeight':
    case 'fontSize':
    case 'lineHeight':
    case 'letterSpacing':
      cardContent = createTypographyTokenContent(token, token.type);
      break;
    
    case 'shadow':
    case 'boxShadow':
      cardContent = createShadowTokenContent(token);
      break;
    
    default:
      cardContent = createGenericTokenContent(token);
  }
  
  card.innerHTML = cardContent;
  
  // Add click handler
  card.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('TokenCard clicked:', token);
    onClick(token);
  });
  
  return card;
}

/**
 * Create content for a color token
 */
function createColorTokenContent(token: TokenData): string {
  // Use resolved value for visualization, but show reference path as the value
  const displayValue = token.reference && token.resolvedValue ? token.resolvedValue : token.value;
  
  return `
    <div class="token-card-content">
      <div class="token-visual ${token.reference ? 'is-reference' : ''}">
        <div class="color-swatch" style="background-color: ${displayValue}"></div>
        ${token.reference ? '<div class="reference-indicator">↗</div>' : ''}
      </div>
      <div class="token-info">
        <div class="token-name">${token.name}</div>
        <div class="token-value ${token.reference ? 'reference-value' : ''}">
          ${formatTokenValue(token)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create content for a dimension token
 */
function createDimensionTokenContent(token: TokenData): string {
  // Use resolved value for visualization, but show reference path as the value
  const displayValue = token.reference && token.resolvedValue ? token.resolvedValue : token.value;
  
  // Try to extract a numerical value for the dimension bar
  let displayWidth = '0%';
  
  if (typeof displayValue === 'number') {
    displayWidth = `${Math.min(displayValue, 100)}%`;
  } else if (typeof displayValue === 'string') {
    const match = displayValue.match(/^(\d+(\.\d+)?)/);
    if (match) {
      const size = parseFloat(match[1]);
      displayWidth = `${Math.min(size, 100)}%`;
    }
  }
  
  return `
    <div class="token-card-content">
      <div class="token-visual ${token.reference ? 'is-reference' : ''}">
        <div class="dimension-swatch">
          <div class="dimension-bar" style="width: ${displayWidth}"></div>
        </div>
        ${token.reference ? '<div class="reference-indicator">↗</div>' : ''}
      </div>
      <div class="token-info">
        <div class="token-name">${token.name}</div>
        <div class="token-value ${token.reference ? 'reference-value' : ''}">
          ${formatTokenValue(token)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create content for a radius token
 */
function createRadiusTokenContent(token: TokenData): string {
  // Use resolved value for visualization, but show reference path as the value
  const displayValue = token.reference && token.resolvedValue ? token.resolvedValue : token.value;
  
  // Try to extract a numerical value for the radius
  let radiusValue: string | number = '0px';
  
  if (typeof displayValue === 'number') {
    radiusValue = `${Math.min(displayValue, 24)}px`;
  } else if (typeof displayValue === 'string') {
    const match = displayValue.match(/^(\d+(\.\d+)?)/);
    if (match) {
      const size = parseFloat(match[1]);
      radiusValue = `${Math.min(size, 24)}px`;
    } else {
      radiusValue = displayValue;
    }
  }
  
  return `
    <div class="token-card-content">
      <div class="token-visual ${token.reference ? 'is-reference' : ''}">
        <div class="radius-swatch">
          <div class="radius-box" style="border-radius: ${radiusValue}"></div>
          <div class="radius-label">radius</div>
        </div>
        ${token.reference ? '<div class="reference-indicator">↗</div>' : ''}
      </div>
      <div class="token-info">
        <div class="token-name">${token.name}</div>
        <div class="token-value ${token.reference ? 'reference-value' : ''}">
          ${formatTokenValue(token)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create content for a spacing token
 */
function createSpacingTokenContent(token: TokenData): string {
  // Use resolved value for visualization, but show reference path as the value
  const displayValue = token.reference && token.resolvedValue ? token.resolvedValue : token.value;
  
  // Try to extract a numerical value for the spacing
  let spacingValue: string | number = '0px';
  
  if (typeof displayValue === 'number') {
    spacingValue = `${Math.min(displayValue, 60)}px`;
  } else if (typeof displayValue === 'string') {
    const match = displayValue.match(/^(\d+(\.\d+)?)/);
    if (match) {
      const size = parseFloat(match[1]);
      spacingValue = `${Math.min(size, 60)}px`;
    } else {
      spacingValue = displayValue;
    }
  }
  
  return `
    <div class="token-card-content">
      <div class="token-visual ${token.reference ? 'is-reference' : ''}">
        <div class="spacing-swatch">
          <div class="spacing-box">
            <div class="spacing-element"></div>
            <div class="spacing-gap" style="width: ${spacingValue}"></div>
            <div class="spacing-element"></div>
          </div>
          <div class="spacing-label">spacing</div>
        </div>
        ${token.reference ? '<div class="reference-indicator">↗</div>' : ''}
      </div>
      <div class="token-info">
        <div class="token-name">${token.name}</div>
        <div class="token-value ${token.reference ? 'reference-value' : ''}">
          ${formatTokenValue(token)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create content for a typography token
 */
function createTypographyTokenContent(token: TokenData, specificType: string): string {
  // Use resolved value for visualization, but show reference path as the value
  const displayValue = token.reference && token.resolvedValue ? token.resolvedValue : token.value;
  
  let visualContent = '';
  
  switch (specificType) {
    case 'fontFamily':
      visualContent = `<div class="font-family-sample" style="font-family: ${displayValue}">Aa</div>`;
      break;
    
    case 'fontWeight':
      visualContent = `<div class="font-weight-sample" style="font-weight: ${displayValue}">Aa</div>`;
      break;
    
    case 'fontSize':
      // Scale down very large font sizes for preview
      let displaySize = String(displayValue);
      if (typeof displayValue === 'string' && displayValue.match(/^\d/)) {
        const sizeValue = parseFloat(displayValue);
        const unit = displayValue.replace(/[0-9.]/g, '');
        displaySize = sizeValue > 24 ? `${Math.min(sizeValue, 24)}${unit}` : displayValue;
      }
      visualContent = `<div class="font-size-sample" style="font-size: ${displaySize}">Aa</div>`;
      break;
    
    case 'lineHeight':
      visualContent = `<div class="line-height-sample">
        <div style="line-height: ${displayValue}">Line 1<br>Line 2</div>
      </div>`;
      break;
    
    case 'letterSpacing':
      visualContent = `<div class="letter-spacing-sample" style="letter-spacing: ${displayValue}">Aa</div>`;
      break;
  }
  
  return `
    <div class="token-card-content">
      <div class="token-visual ${token.reference ? 'is-reference' : ''}">
        ${visualContent}
        ${token.reference ? '<div class="reference-indicator">↗</div>' : ''}
      </div>
      <div class="token-info">
        <div class="token-name">${token.name}</div>
        <div class="token-value ${token.reference ? 'reference-value' : ''}">
          ${formatTokenValue(token)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create content for a shadow token
 */
function createShadowTokenContent(token: TokenData): string {
  // Use resolved value for visualization, but show reference path as the value
  const displayValue = token.reference && token.resolvedValue ? token.resolvedValue : token.value;
  
  return `
    <div class="token-card-content">
      <div class="token-visual ${token.reference ? 'is-reference' : ''}">
        <div class="shadow-sample">
          <div class="shadow-box" style="box-shadow: ${displayValue}"></div>
        </div>
        ${token.reference ? '<div class="reference-indicator">↗</div>' : ''}
      </div>
      <div class="token-info">
        <div class="token-name">${token.name}</div>
        <div class="token-value ${token.reference ? 'reference-value' : ''}">
          ${formatTokenValue(token)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create content for a generic token
 */
function createGenericTokenContent(token: TokenData): string {
  return `
    <div class="token-card-content">
      <div class="token-visual ${token.reference ? 'is-reference' : ''}">
        <div class="generic-sample">
          <div class="generic-icon">${token.type.charAt(0).toUpperCase()}</div>
        </div>
        ${token.reference ? '<div class="reference-indicator">↗</div>' : ''}
      </div>
      <div class="token-info">
        <div class="token-name">${token.name}</div>
        <div class="token-value ${token.reference ? 'reference-value' : ''}">
          ${formatTokenValue(token)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Format token value for display
 * For references, show only the reference path without the curly braces
 */
function formatTokenValue(token: TokenData): string {
  if (token.reference) {
    // If we have a reference path from the resolver, use it
    if (token.referencePath) {
      return token.referencePath;
    }
    
    // Otherwise, try to extract it from the value
    if (typeof token.value === 'string' && isReference(token.value)) {
      return formatReferenceDisplay(token.value);
    }
  }
  
  // For non-references, just show the value
  return String(token.value);
}