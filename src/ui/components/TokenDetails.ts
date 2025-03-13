/**
 * TokenDetails.ts
 * 
 * Component for displaying detailed information about a selected token.
 * Provides comprehensive display of reference information including paths,
 * resolved values, and copy functionality.
 */

import { TokenData, isReference, formatReferenceDisplay } from "../reference/ReferenceResolver";

export interface TokenDetailsProps {
  token: TokenData;
  onClose: () => void;
}

/**
 * Creates a token details panel for displaying comprehensive token information
 */
export function createTokenDetails(props: TokenDetailsProps): HTMLElement {
  const { token, onClose } = props;
  
  // Create the details panel element
  const panel = document.createElement('div');
  panel.className = 'token-details-panel';
  panel.dataset.id = token.id;
  panel.dataset.type = token.type;
  
  // Create panel header
  const header = document.createElement('div');
  header.className = 'token-details-header';
  header.innerHTML = `
    <h2>Token Details</h2>
    <button type="button" class="close-button">×</button>
  `;
  
  // Add close button event listener
  const closeButton = header.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      onClose();
    });
  }
  
  // Create visualization section
  const visualization = document.createElement('div');
  visualization.className = 'token-details-visualization';
  visualization.innerHTML = createTokenVisualization(token);
  
  // Create info section
  const info = document.createElement('div');
  info.className = 'token-details-info';
  
  // Add name and path
  const basicInfo = document.createElement('div');
  basicInfo.className = 'token-details-section';
  basicInfo.innerHTML = `
    <div class="token-details-row">
      <span class="token-details-label">Name:</span>
      <span class="token-details-value">${token.name}</span>
    </div>
    <div class="token-details-row">
      <span class="token-details-label">Path:</span>
      <span class="token-details-value">${token.path}</span>
    </div>
  `;
  
  // Add value section
  const valueSection = document.createElement('div');
  valueSection.className = 'token-details-section';
  valueSection.innerHTML = `
    <div class="token-details-row">
      <span class="token-details-label">Value:</span>
      <span class="token-details-value">
        ${token.reference ? token.value : escapeHtml(String(token.value))}
      </span>
      <button type="button" class="copy-button" data-value="${escapeHtml(String(token.value))}">Copy</button>
    </div>
  `;
  
  // Add reference-specific sections if it's a reference
  let referenceSection: HTMLElement | null = null;
  if (token.reference) {
    referenceSection = document.createElement('div');
    referenceSection.className = 'token-details-section reference-details';
    
    // Extract reference path (without curly braces)
    const referencePath = token.referencePath || formatReferenceDisplay(token.value);
    
    referenceSection.innerHTML = `
      <div class="token-details-row">
        <span class="token-details-label">Reference Path:</span>
        <span class="token-details-value">${referencePath}</span>
        <button type="button" class="copy-button" data-value="${referencePath}">Copy</button>
      </div>
      ${token.resolvedValue ? `
        <div class="token-details-row">
          <span class="token-details-label">Resolved Value:</span>
          <span class="token-details-value">${escapeHtml(String(token.resolvedValue))}</span>
          <button type="button" class="copy-button" data-value="${escapeHtml(String(token.resolvedValue))}">Copy</button>
        </div>
      ` : ''}
    `;
  }
  
  // Add type section
  const typeSection = document.createElement('div');
  typeSection.className = 'token-details-section';
  typeSection.innerHTML = `
    <div class="token-details-row">
      <span class="token-details-label">Type:</span>
      <span class="token-details-value">${token.type}</span>
      ${token.reference ? '<span class="reference-badge">Reference</span>' : ''}
    </div>
  `;
  
  // Assemble the panel
  info.appendChild(basicInfo);
  info.appendChild(valueSection);
  if (referenceSection) {
    info.appendChild(referenceSection);
  }
  info.appendChild(typeSection);
  
  panel.appendChild(header);
  panel.appendChild(visualization);
  panel.appendChild(info);
  
  // Add copy button event listeners
  const copyButtons = panel.querySelectorAll('.copy-button');
  copyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const button = e.target as HTMLButtonElement;
      const value = button.dataset.value || '';
      
      // Copy to clipboard
      navigator.clipboard.writeText(value)
        .then(() => {
          // Show feedback
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = originalText;
          }, 1000);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    });
  });
  
  return panel;
}

/**
 * Creates visualization for a token based on its type
 */
function createTokenVisualization(token: TokenData): string {
  // Use resolved value for visualization if it's a reference
  const displayValue = token.reference && token.resolvedValue ? token.resolvedValue : token.value;
  
  switch (token.type) {
    case 'color':
      return `
        <div class="token-visualization color-visualization">
          <div class="color-swatch" style="background-color: ${displayValue}"></div>
          <div class="color-value">${displayValue}</div>
        </div>
      `;
    
    case 'dimension':
    case 'spacing':
    case 'size':
    case 'borderRadius':
      return `
        <div class="token-visualization dimension-visualization">
          <div class="dimension-representation">
            <div class="dimension-box" style="width: ${displayValue}; height: ${displayValue};"></div>
          </div>
          <div class="dimension-value">${displayValue}</div>
        </div>
      `;
    
    case 'fontFamily':
      return `
        <div class="token-visualization typography-visualization">
          <div class="font-sample" style="font-family: ${displayValue}">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>
            abcdefghijklmnopqrstuvwxyz<br>
            0123456789
          </div>
        </div>
      `;
    
    case 'fontWeight':
      return `
        <div class="token-visualization typography-visualization">
          <div class="font-sample" style="font-weight: ${displayValue}">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>
            abcdefghijklmnopqrstuvwxyz<br>
            0123456789
          </div>
        </div>
      `;
    
    case 'fontSize':
      return `
        <div class="token-visualization typography-visualization">
          <div class="font-sample" style="font-size: ${displayValue}">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>
            abcdefghijklmnopqrstuvwxyz<br>
            0123456789
          </div>
        </div>
      `;
    
    case 'lineHeight':
      return `
        <div class="token-visualization typography-visualization">
          <div class="line-height-sample" style="line-height: ${displayValue}">
            Line 1 - The quick brown fox jumps over the lazy dog<br>
            Line 2 - Five boxing wizards jump quickly<br>
            Line 3 - Pack my box with five dozen liquor jugs
          </div>
        </div>
      `;
    
    case 'shadow':
    case 'boxShadow':
      return `
        <div class="token-visualization shadow-visualization">
          <div class="shadow-box" style="box-shadow: ${displayValue}"></div>
        </div>
      `;
    
    default:
      return `
        <div class="token-visualization generic-visualization">
          <div class="generic-value">${escapeHtml(String(displayValue))}</div>
        </div>
      `;
  }
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}