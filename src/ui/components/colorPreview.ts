/**
 * Component for generating color previews in the UI
 */

import { 
    rgbaToHex, 
    rgbaToRgb, 
    rgbaToHsl, 
    hexToRgba,
    ColorFormat
  } from '../../code/formatters/colorTransforms';
  
  // Interface for collection of color tokens
  interface ColorToken {
    path: string;
    value: string;
    originalValue: any;
  }
  
  /**
   * Extracts all color tokens from the token data
   */
  export function extractColorTokens(tokenData: any): ColorToken[] {
    const colorTokens: ColorToken[] = [];
    
    function processTokens(obj: any, path: string = '') {
      if (!obj || typeof obj !== 'object') return;
      
      // Handle DTCG format
      if (obj.$value !== undefined && obj.$type === 'color') {
        colorTokens.push({
          path: path,
          value: obj.$value,
          originalValue: obj.$value
        });
        return;
      }
      
      // Handle nested objects
      for (const key in obj) {
        const newPath = path ? `${path}/${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null) {
          processTokens(value, newPath);
        } else if (typeof value === 'string' && (
          value.startsWith('#') || 
          value.startsWith('rgb') || 
          value.startsWith('hsl')
        )) {
          // For legacy format or direct color values
          colorTokens.push({
            path: newPath,
            value: value,
            originalValue: value
          });
        }
      }
    }
    
    // Process all collections and modes
    for (const collection in tokenData) {
      for (const mode in tokenData[collection]) {
        processTokens(tokenData[collection][mode], `${collection}/${mode}`);
      }
    }
    
    return colorTokens;
  }
  
  /**
   * Generates HTML for color preview panel
   */
  export function generateColorPreviewPanel(colorTokens: ColorToken[], format: ColorFormat): string {
    if (colorTokens.length === 0) {
      return '<div class="color-preview-container"><div class="color-preview-heading">No color tokens found</div></div>';
    }
    
    let html = '<div class="color-preview-container">';
    html += '<div class="color-preview-heading">Color Tokens Preview</div>';
    
    // Group by collection
    const colorsByCollection: Record<string, ColorToken[]> = {};
    
    colorTokens.forEach(token => {
      const pathParts = token.path.split('/');
      if (pathParts.length >= 2) {
        const collection = pathParts[0];
        
        if (!colorsByCollection[collection]) {
          colorsByCollection[collection] = [];
        }
        
        colorsByCollection[collection].push(token);
      }
    });
    
    // Generate preview for each collection
    for (const collection in colorsByCollection) {
      html += `<div class="color-preview-heading">${collection}</div>`;
      
      colorsByCollection[collection].forEach(token => {
        // Determine if transparent
        const isTransparent = token.value.includes('rgba') || token.value.includes('hsla') || 
                             (token.value.startsWith('#') && token.value.length === 9);
        
        // Extract path without collection
        const displayPath = token.path.split('/').slice(2).join('/');
        
        html += `
          <div class="color-preview-item" data-color-path="${token.path}" data-color-value="${token.value}">
            <div class="color-swatch ${isTransparent ? 'transparent' : ''}" style="background-color: ${token.value}"></div>
            <div class="color-info">
              <div class="color-path">${displayPath}</div>
              <div class="color-value">${getFormattedColorValue(token.value, format)}</div>
            </div>
          </div>
        `;
      });
    }
    
    html += '</div>';
    return html;
  }
  
  /**
   * Formats color value based on selected format
   */
  export function getFormattedColorValue(colorValue: string, format: ColorFormat): string {
    try {
      // If it's already a hex value
      if (colorValue.startsWith('#')) {
        const rgba = hexToRgba(colorValue);
        
        switch (format) {
          case 'hex':
            return colorValue;
          case 'rgb':
          case 'rgba':
            return rgbaToRgb(rgba);
          case 'hsl':
          case 'hsla':
            return rgbaToHsl(rgba);
          default:
            return colorValue;
        }
      }
      // Handle existing rgb/rgba values
      else if (colorValue.startsWith('rgb')) {
        // For simplicity in this implementation, return as is
        // A more comprehensive solution would parse the RGB values
        return colorValue;
      }
      // Handle existing hsl/hsla values  
      else if (colorValue.startsWith('hsl')) {
        // For simplicity in this implementation, return as is
        return colorValue;
      }
      
      return colorValue;
    } catch (error) {
      console.error('Error formatting color:', error);
      return colorValue;
    }
  }
  
  /**
   * Attaches event listeners for color preview interactions
   */
  export function setupColorPreviewInteractions(
    previewContainer: HTMLElement,
    colorFormat: ColorFormat,
    updateFormatCallback: (format: ColorFormat) => void
  ): void {
    // Handle clicking on color items
    previewContainer.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const colorItem = target.closest('.color-preview-item') as HTMLElement;
      
      if (colorItem) {
        const colorValue = colorItem.dataset.colorValue || '';
        const colorPath = colorItem.dataset.colorPath || '';
        
        showColorDetailPanel(colorItem, colorValue, colorPath);
      }
    });
    
    // Function to show detailed color information
    function showColorDetailPanel(
      anchorElement: HTMLElement, 
      colorValue: string, 
      colorPath: string
    ): void {
      // Remove any existing panels
      document.querySelectorAll('.color-preview-panel').forEach(panel => {
        panel.remove();
      });
      
      // Create the panel
      const panel = document.createElement('div');
      panel.className = 'color-preview-panel';
      
      // Calculate position
      const rect = anchorElement.getBoundingClientRect();
      panel.style.top = `${rect.bottom + window.scrollY + 5}px`;
      panel.style.left = `${rect.left + window.scrollX}px`;
      
      // Generate content
      let panelHtml = `
        <div class="preview-color-swatch" style="background-color: ${colorValue}"></div>
        <div class="color-path-full">${colorPath}</div>
        <div class="color-format-list">
      `;
      
      // Format options
      const formats: { label: string, format: ColorFormat }[] = [
        { label: 'HEX', format: 'hex' },
        { label: 'RGB', format: 'rgb' },
        { label: 'RGBA', format: 'rgba' },
        { label: 'HSL', format: 'hsl' },
        { label: 'HSLA', format: 'hsla' }
      ];
      
      formats.forEach(({ label, format }) => {
        const formattedValue = getFormattedColorValue(colorValue, format);
        
        panelHtml += `
          <div class="color-format-item">
            <span class="color-format-label">${label}:</span>
            <span class="color-format-value">${formattedValue}</span>
            <button class="copy-button" data-color-value="${formattedValue}">Copy</button>
          </div>
        `;
      });
      
      panelHtml += `
        </div>
        <div class="color-format-controls">
          <div>Set as default format:</div>
          <div class="format-buttons">
      `;
      
      formats.forEach(({ label, format }) => {
        panelHtml += `
          <button class="color-format-button ${format === colorFormat ? 'active' : ''}" 
                  data-format="${format}">${label}</button>
        `;
      });
      
      panelHtml += `
          </div>
        </div>
        <div class="color-preview-close">×</div>
      `;
      
      panel.innerHTML = panelHtml;
      document.body.appendChild(panel);
      
      // Add event listeners
      panel.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', (e) => {
          const value = (e.currentTarget as HTMLElement).dataset.colorValue || '';
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
        });
      });
      
      // Format button listeners
      panel.querySelectorAll('.color-format-button').forEach(button => {
        button.addEventListener('click', (e) => {
          const format = (e.currentTarget as HTMLElement).dataset.format as ColorFormat;
          updateFormatCallback(format);
          
          // Update active state
          panel.querySelectorAll('.color-format-button').forEach(btn => {
            btn.classList.remove('active');
          });
          (e.currentTarget as HTMLElement).classList.add('active');
        });
      });
      
      // Close button listener
      panel.querySelector('.color-preview-close')?.addEventListener('click', () => {
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
  }