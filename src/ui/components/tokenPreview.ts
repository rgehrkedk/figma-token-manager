/**
 * Component for managing visual token preview functionality
 */

import { 
    extractVisualTokens,
    generateVisualTokenPreview,
    VisualToken
  } from '../utilities/tokenVisualization';
  import { ColorFormat } from '../../code/formatters/colorTransforms';
  
  /**
   * Generates and attaches a visual token preview for token data
   */
  export function showVisualTokenPreview(
    tokenData: any, 
    container: HTMLElement, 
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
    container.parentNode?.insertBefore(
      previewContainer, 
      container.nextSibling
    );
    
    // Setup interactive features
    setupTokenPreviewInteractions(previewContainer);
  }
  
  /**
   * Attaches event listeners for token preview interactions
   */
  function setupTokenPreviewInteractions(
    previewContainer: HTMLElement
  ): void {
    // Handle clicking on token items
    previewContainer.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
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
   * Shows a detailed panel for a token
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
    
    // Create the panel
    const panel = document.createElement('div');
    panel.className = 'token-detail-panel';
    
    // Calculate position
    const rect = anchorElement.getBoundingClientRect();
    panel.style.top = `${rect.bottom + window.scrollY + 8}px`;
    panel.style.left = `${rect.left + window.scrollX}px`;
    
    // Generate visualization based on token type
    const visualization = getTokenVisualization(tokenType, tokenValue);
    
    // Generate CSS usage example based on token path
    const cssVariable = tokenPathToCssVariable(tokenPath);
    const cssUsage = getCssUsageExample(tokenType, tokenValue, cssVariable);
    const scssTokenName = tokenPathToScssVariable(tokenPath);
    const scssUsage = getScssUsageExample(tokenType, tokenValue, scssTokenName);
    
    // Generate code snippet for token
    const jsonSnippet = getJsonSnippet(tokenPath, tokenValue, tokenType);
    
    // Create content
    let panelHtml = `
      <div class="token-detail-header">
        <div class="token-detail-title">${formatPathForDisplay(tokenPath)}</div>
        <div class="token-detail-close">&times;</div>
      </div>
      <div class="token-detail-content">
        <div class="token-detail-row">
          <div class="token-detail-label">Path:</div>
          <div class="token-detail-value">${tokenPath}</div>
        </div>
        <div class="token-detail-row">
          <div class="token-detail-label">Type:</div>
          <div class="token-detail-value">${formatTypeForDisplay(tokenType)}</div>
        </div>
        <div class="token-detail-row">
          <div class="token-detail-label">Value:</div>
          <div class="token-detail-value">
            ${tokenValue}
            <button class="token-copy-button" data-copy-value="${tokenValue}">Copy</button>
          </div>
        </div>
      </div>
      
      <div class="token-visualization">
        ${visualization}
      </div>
      
      <div class="token-usage-label">CSS Custom Property:</div>
      <div class="token-detail-row">
        <div class="token-detail-value">
          ${cssVariable}
          <button class="token-copy-button" data-copy-value="${cssVariable}">Copy</button>
        </div>
      </div>
      
      <div class="token-usage-label">CSS Usage Example:</div>
      <div class="token-detail-row">
        <div class="token-detail-value">
          ${cssUsage}
          <button class="token-copy-button" data-copy-value="${cssUsage}">Copy</button>
        </div>
      </div>
      
      <div class="token-usage-label">SCSS Variable:</div>
      <div class="token-detail-row">
        <div class="token-detail-value">
          ${scssTokenName}
          <button class="token-copy-button" data-copy-value="${scssTokenName}">Copy</button>
        </div>
      </div>
      
      <div class="token-usage-label">JSON Structure:</div>
      <div class="token-detail-row">
        <div class="token-detail-value">
          ${jsonSnippet}
          <button class="token-copy-button" data-copy-value="${jsonSnippet}">Copy</button>
        </div>
      </div>
    `;
    
    panel.innerHTML = panelHtml;
    document.body.appendChild(panel);
    
    // Add event listeners for copy buttons
    panel.querySelectorAll('.token-copy-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const value = (e.currentTarget as HTMLElement).dataset.copyValue || '';
        navigator.clipboard.writeText(value)
          .then(() => {
            (e.currentTarget as HTMLElement).textContent = 'Copied!';
            setTimeout(() => {
              (e.currentTarget as HTMLElement).textContent = 'Copy';
            }, 1000);
          })
          .catch(err => {
            console.error('Could not copy text: ', err);
          });
        
        // Prevent clicks from bubbling up and closing panel
        e.stopPropagation();
      });
    });
    
    // Close button listener
    panel.querySelector('.token-detail-close')?.addEventListener('click', () => {
      panel.remove();
    });
    
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
   * Generate a visualization for a token based on its type
   */
  function getTokenVisualization(tokenType: string, tokenValue: string): string {
    switch(tokenType) {
      case 'color':
        return `<div style="width: 100%; height: 30px; background-color: ${tokenValue}; border-radius: 4px;"></div>`;
      
      case 'dimension':
        const size = String(tokenValue).replace(/[^0-9.]/g, '');
        // Cap at 100% width for visualization purposes
        const visualSize = Math.min(parseFloat(size), 100);
        return `<div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                  <div style="width: ${visualSize}%; height: 100%; background: #0366d6;"></div>
                </div>`;
      
      case 'fontFamily':
        return `<div style="font-family: ${tokenValue}; font-size: 16px; text-align: center;">The quick brown fox jumps over the lazy dog</div>`;
      
      case 'fontWeight':
        return `<div style="font-weight: ${tokenValue}; font-size: 16px; text-align: center;">The quick brown fox jumps over the lazy dog</div>`;
      
      case 'fontSize':
        const fontSize = Math.min(parseFloat(tokenValue), 24) + 'px';
        return `<div style="font-size: ${fontSize}; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">The quick brown fox jumps over the lazy dog</div>`;
      
      case 'lineHeight':
        return `<div style="line-height: ${tokenValue}; font-size: 12px; text-align: center;">Line 1<br>Line 2</div>`;
      
      case 'letterSpacing':
        return `<div style="letter-spacing: ${tokenValue}; font-size: 14px; text-align: center;">THE QUICK BROWN FOX</div>`;
      
      case 'shadow':
        return `<div style="width: 60px; height: 30px; margin: 0 auto; background: white; border-radius: 4px; box-shadow: ${tokenValue};"></div>`;
      
      default:
        return `<div style="text-align: center; color: #666;">${tokenValue}</div>`;
    }
  }
  
  /**
   * Convert a token path to a CSS variable name
   */
  function tokenPathToCssVariable(tokenPath: string): string {
    // Convert 'collection/mode/category/token' to '--category-token'
    const pathParts = tokenPath.split('/');
    
    // Remove collection and mode parts (first two elements)
    const cssNameParts = pathParts.slice(2);
    
    // Join with hyphens and add -- prefix
    return `--${cssNameParts.join('-').toLowerCase()}`;
  }
  
  /**
   * Convert a token path to an SCSS variable name
   */
  function tokenPathToScssVariable(tokenPath: string): string {
    // Convert 'collection/mode/category/token' to '$category-token'
    const pathParts = tokenPath.split('/');
    
    // Remove collection and mode parts (first two elements)
    const scssNameParts = pathParts.slice(2);
    
    // Join with hyphens and add $ prefix
    return `$${scssNameParts.join('-').toLowerCase()}`;
  }
  
  /**
   * Get a CSS usage example for a token
   */
  function getCssUsageExample(tokenType: string, tokenValue: string, cssVariable: string): string {
    switch(tokenType) {
      case 'color':
        return `color: var(${cssVariable});`;
      case 'dimension':
        return `margin: var(${cssVariable});`;
      case 'fontFamily':
        return `font-family: var(${cssVariable});`;
      case 'fontWeight':
        return `font-weight: var(${cssVariable});`;
      case 'fontSize':
        return `font-size: var(${cssVariable});`;
      case 'lineHeight':
        return `line-height: var(${cssVariable});`;
      case 'letterSpacing':
        return `letter-spacing: var(${cssVariable});`;
      case 'shadow':
        return `box-shadow: var(${cssVariable});`;
      default:
        return `/* Custom property: */ var(${cssVariable});`;
    }
  }
  
  /**
   * Get an SCSS usage example for a token
   */
  function getScssUsageExample(tokenType: string, tokenValue: string, scssVariable: string): string {
    switch(tokenType) {
      case 'color':
        return `color: ${scssVariable};`;
      case 'dimension':
        return `margin: ${scssVariable};`;
      case 'fontFamily':
        return `font-family: ${scssVariable};`;
      case 'fontWeight':
        return `font-weight: ${scssVariable};`;
      case 'fontSize':
        return `font-size: ${scssVariable};`;
      case 'lineHeight':
        return `line-height: ${scssVariable};`;
      case 'letterSpacing':
        return `letter-spacing: ${scssVariable};`;
      case 'shadow':
        return `box-shadow: ${scssVariable};`;
      default:
        return `/* SCSS variable: */ ${scssVariable};`;
    }
  }
  
  /**
   * Get a JSON snippet for a token's structure
   */
  function getJsonSnippet(tokenPath: string, tokenValue: string, tokenType: string): string {
    // Format as DTCG-compliant JSON
    const pathParts = tokenPath.split('/');
    
    // Skip collection and mode
    const jsonParts = pathParts.slice(2);
    
    // Format for display
    let result = '';
    let indent = '';
    
    for (let i = 0; i < jsonParts.length - 1; i++) {
      result += `${indent}"${jsonParts[i]}": {\n`;
      indent += '  ';
    }
    
    result += `${indent}"${jsonParts[jsonParts.length - 1]}": {\n`;
    indent += '  ';
    result += `${indent}"$value": "${tokenValue}",\n`;
    result += `${indent}"$type": "${tokenType}"\n`;
    indent = indent.substring(0, indent.length - 2);
    result += `${indent}}`;
    
    for (let i = 0; i < jsonParts.length - 1; i++) {
      indent = indent.substring(0, indent.length - 2);
      result += `\n${indent}}`;
    }
    
    return result;
  }
  
  /**
   * Format a token path for display
   */
  function formatPathForDisplay(path: string): string {
    const parts = path.split('/');
    
    // If we have a full path, show the token name (last part) more prominently
    if (parts.length >= 3) {
      const collection = parts[0];
      const mode = parts[1];
      const tokenName = parts[parts.length - 1];
      const categoryPath = parts.slice(2, parts.length - 1).join('/');
      
      // Format like: Token Name (collection/mode/category)
      return `<strong>${tokenName}</strong> <span style="color: #666; font-size: 10px;">(${collection}/${mode}${categoryPath ? '/' + categoryPath : ''})</span>`;
    }
    
    return path;
  }
  
  /**
   * Format a token type for display
   */
  function formatTypeForDisplay(type: string): string {
    return type
      // Add space before capital letters
      .replace(/([A-Z])/g, ' $1')
      // Uppercase first letter
      .replace(/^./, str => str.toUpperCase())
      // Trim leading space if exists
      .trim();
  }