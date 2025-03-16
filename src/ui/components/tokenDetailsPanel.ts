/**
 * Token Details Panel Component
 * Displays detailed information about a selected token
 * Using intuitive class naming that matches the CSS
 */

import { TokenData } from '../reference/ReferenceResolver';

export interface TokenDetailsPanelInterface {
  show: (token: TokenData) => void;
  hide: () => void;
  isVisible: () => boolean;
}

export function setupTokenDetailsPanel(
  containerId: string
): TokenDetailsPanelInterface {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Token details panel container #${containerId} not found`);
    return createEmptyInterface();
  }

  // State
  let currentToken: TokenData | null = null;
  let isOpen = false;

  /**
   * Creates token details content
   */
  function createTokenDetails(token: TokenData): void {
    container.innerHTML = `
      <div class="details-panel-container">
        <div class="details-header">
          <h2 class="details-title">Token Details</h2>
          <button class="close-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="details-preview">
          ${createTokenVisualization(token)}
        </div>
        
        <!-- Token information -->
        <div class="details-info">
          <div class="details-section">
            <div class="details-row">
              <div class="details-label">Name</div>
              <div class="details-value">${token.name}</div>
            </div>
            
            <div class="details-row">
              <div class="details-label">Path</div>
              <div class="details-value details-monospace">${token.path}</div>
            </div>
            
            <div class="details-row">
              <div class="details-label">Value</div>
              <div class="details-value details-monospace">
                <span style="flex: 1">${formatTokenValue(token)}</span>
                <button class="copy-button" data-value="${escapeHtml(String(token.value))}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            ${token.reference && token.resolvedValue ? `
              <div class="details-row">
                <div class="details-label">Resolved</div>
                <div class="details-value details-monospace">
                  <span style="flex: 1">${token.resolvedValue}</span>
                  <button class="copy-button" data-value="${escapeHtml(String(token.resolvedValue))}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ` : ''}
            
            <div class="details-row">
              <div class="details-label">Type</div>
              <div class="details-value">
                <span style="flex: 1">${formatTypeTitle(token.type)}</span>
                ${token.reference ? '<span class="reference-badge">Reference</span>' : ''}
              </div>
            </div>
          </div>
          
          <div class="details-section">
            <h3 class="details-section-title">Usage</h3>
            
            ${createUsageExamples(token)}
          </div>
        </div>
      </div>
    `;

    // Add event handlers
    const closeButton = container.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', hide);
    }

    // Add copy button event handlers
    const copyButtons = container.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const value = (button as HTMLElement).dataset.value;
        if (value) {
          copyToClipboard(value);
          showCopyToast(button as HTMLElement);
        }
      });
    });
  }

  /**
   * Creates token visualization based on type
   */
  function createTokenVisualization(token: TokenData): string {
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
        const numericalValue = parseFloat(String(displayValue));
        const displayWidth = isNaN(numericalValue) ? 0 : Math.min(numericalValue, 100);
        
        return `
          <div class="token-visualization dimension-visualization">
            <div class="dimension-representation">
              <div class="dimension-box" style="width: ${displayWidth}%"></div>
            </div>
            <div class="dimension-value">${displayValue}</div>
          </div>
        `;
        
      case 'fontFamily':
        return `
          <div class="token-visualization typography-visualization">
            <div class="font-sample" style="font-family: ${displayValue}">
              <div class="typography-sample-large">Aa</div>
              <div class="typography-sample-small">The quick brown fox jumps over the lazy dog</div>
            </div>
          </div>
        `;
        
      case 'fontWeight':
        return `
          <div class="token-visualization typography-visualization">
            <div class="font-sample" style="font-weight: ${displayValue}">
              <div class="typography-sample-large">Aa</div>
              <div class="typography-sample-small">The quick brown fox jumps over the lazy dog</div>
            </div>
          </div>
        `;
        
      case 'fontSize':
        return `
          <div class="token-visualization typography-visualization">
            <div class="font-sample" style="font-size: ${displayValue}">
              <div class="typography-sample-text">Aa</div>
            </div>
          </div>
        `;
        
      case 'lineHeight':
        return `
          <div class="token-visualization typography-visualization">
            <div class="font-sample" style="line-height: ${displayValue}">
              <div class="typography-sample-lines">
                Line 1<br>
                Line 2<br>
                Line 3
              </div>
            </div>
          </div>
        `;
        
      case 'letterSpacing':
        return `
          <div class="token-visualization typography-visualization">
            <div class="font-sample" style="letter-spacing: ${displayValue}">
              <div class="typography-sample-text">TYPOGRAPHY</div>
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
            <div class="generic-value">${formatTypeTitle(token.type)}</div>
          </div>
        `;
    }
  }

  /**
   * Create usage examples for the token
   */
  function createUsageExamples(token: TokenData): string {
    // Convert token path to CSS variable name
    const cssVariableName = `--${token.path.replace(/\./g, '-')}`;
    
    // Convert token path to SCSS variable name
    const scssVariableName = `$${token.path.replace(/\./g, '-')}`;
    
    // Generate appropriate CSS usage example
    let cssUsage = '';
    switch (token.type) {
      case 'color':
        cssUsage = `color: var(${cssVariableName});`;
        break;
      case 'dimension':
      case 'spacing':
        cssUsage = `margin: var(${cssVariableName});`;
        break;
      case 'size':
        cssUsage = `width: var(${cssVariableName});`;
        break;
      case 'borderRadius':
        cssUsage = `border-radius: var(${cssVariableName});`;
        break;
      case 'fontFamily':
        cssUsage = `font-family: var(${cssVariableName});`;
        break;
      case 'fontWeight':
        cssUsage = `font-weight: var(${cssVariableName});`;
        break;
      case 'fontSize':
        cssUsage = `font-size: var(${cssVariableName});`;
        break;
      case 'lineHeight':
        cssUsage = `line-height: var(${cssVariableName});`;
        break;
      case 'letterSpacing':
        cssUsage = `letter-spacing: var(${cssVariableName});`;
        break;
      case 'shadow':
      case 'boxShadow':
        cssUsage = `box-shadow: var(${cssVariableName});`;
        break;
      default:
        cssUsage = `/* Custom property */ var(${cssVariableName});`;
    }
    
    return `
      <div class="usage-item">
        <div class="usage-label">CSS</div>
        <div class="usage-code">
          <span style="flex: 1">${cssVariableName}</span>
          <button class="copy-button" data-value="${cssVariableName}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="usage-item">
        <div class="usage-label">CSS Usage</div>
        <div class="usage-code">
          <span style="flex: 1">${cssUsage}</span>
          <button class="copy-button" data-value="${cssUsage}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="usage-item">
        <div class="usage-label">SCSS</div>
        <div class="usage-code">
          <span style="flex: 1">${scssVariableName}</span>
          <button class="copy-button" data-value="${scssVariableName}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Format the token value for display
   */
  function formatTokenValue(token: TokenData): string {
    if (token.reference) {
      return `<span class="reference-value">${token.value}</span>`;
    }
    return escapeHtml(String(token.value));
  }

  /**
   * Format the type title for display
   */
  function formatTypeTitle(type: string): string {
    // Convert camelCase to Title Case with spaces
    const formatted = type
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, match => match.toUpperCase()); // Capitalize first letter
    
    return formatted.trim();
  }

  /**
   * Escape HTML special characters
   */
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Copy text to clipboard
   */
  function copyToClipboard(text: string): void {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    
    // Select the text and copy
    textarea.select();
    document.execCommand('copy');
    
    // Remove the textarea
    document.body.removeChild(textarea);
  }

  /**
   * Show copy toast notification
   */
  function showCopyToast(button: HTMLElement): void {
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'copy-tooltip';
    tooltip.textContent = 'Copied!';
    
    // Position tooltip
    const rect = button.getBoundingClientRect();
    tooltip.style.top = `${rect.top - 30}px`;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    
    // Add to DOM
    document.body.appendChild(tooltip);
    
    // Remove after animation
    setTimeout(() => {
      tooltip.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(tooltip);
      }, 300);
    }, 1000);
  }

  /**
   * Show the panel with a token
   */
  function show(token: TokenData): void {
    currentToken = token;
    createTokenDetails(token);
    
    // Show the panel
    container.classList.add('visible');
    document.querySelector('.plugin-container')?.classList.add('show-details');
    isOpen = true;
  }

  /**
   * Hide the panel
   */
  function hide(): void {
    container.classList.remove('visible');
    document.querySelector('.plugin-container')?.classList.remove('show-details');
    isOpen = false;
  }

  // Return public interface
  return {
    show,
    hide,
    isVisible: () => isOpen
  };
}

/**
 * Create empty interface when container is not found
 */
function createEmptyInterface(): TokenDetailsPanelInterface {
  return {
    show: () => {},
    hide: () => {},
    isVisible: () => false
  };
}