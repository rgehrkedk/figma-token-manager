/**
 * Token Grid component for displaying tokens in a card layout
 */

export interface TokenData {
    id: string;
    name: string;
    value: any;
    type: string;
    path: string;
    reference?: boolean;
    resolvedValue?: any;
  }
  
  export interface TokenGridInterface {
    update: (tokens: TokenData[]) => void;
    clear: () => void;
  }
  
  export function setupTokenGrid(
    containerId: string,
    tokens: TokenData[] = [],
    onTokenClick: (token: TokenData) => void
  ): TokenGridInterface {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Token grid container #${containerId} not found`);
      return createEmptyTokenGridInterface();
    }
  
    // Initialize the grid
    container.className = 'token-grid';
    
    // Render initial tokens
    renderTokens(tokens);
    
    /**
     * Render tokens in the grid
     */
    function renderTokens(tokensToRender: TokenData[]) {
      // Clear the container
      container.innerHTML = '';
      
      // Group tokens by type for better organization
      const tokensByType: Record<string, TokenData[]> = {};
      
      tokensToRender.forEach(token => {
        if (!tokensByType[token.type]) {
          tokensByType[token.type] = [];
        }
        tokensByType[token.type].push(token);
      });
      
      // Render each type in its own section
      for (const type in tokensByType) {
        // Create section title
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'token-section-title';
        sectionTitle.textContent = formatTypeTitle(type);
        container.appendChild(sectionTitle);
        
        // Create section container
        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'token-section';
        container.appendChild(sectionContainer);
        
        // Render tokens in the section
        tokensByType[type].forEach(token => {
          const card = createTokenCard(token);
          sectionContainer.appendChild(card);
        });
      }
      
      // If no tokens, show empty state
      if (tokensToRender.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'token-grid-empty';
        emptyState.textContent = 'No tokens found';
        container.appendChild(emptyState);
      }
    }
    
    /**
     * Create a token card element
     */
    function createTokenCard(token: TokenData): HTMLElement {
      const card = document.createElement('div');
      card.className = 'token-card';
      card.dataset.id = token.id;
      card.dataset.type = token.type;
      
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
        case 'spacing':
        case 'size':
        case 'borderRadius':
          cardContent = createDimensionTokenContent(token);
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
      
      // Add click event handler
      card.addEventListener('click', () => {
        onTokenClick(token);
      });
      
      return card;
    }
    
    /**
     * Create content for a color token
     */
    function createColorTokenContent(token: TokenData): string {
      const displayValue = token.reference && token.resolvedValue ? token.resolvedValue : token.value;
      
      return `
        <div class="token-card-content">
          <div class="token-visual ${token.reference ? 'is-reference' : ''}">
            <div class="color-swatch" style="background-color: ${displayValue}"></div>
            ${token.reference ? '<div class="reference-indicator">↗</div>' : ''}
          </div>
          <div class="token-info">
            <div class="token-name">${token.name}</div>
            <div class="token-value">
              ${token.value}
              ${token.reference && token.resolvedValue ? 
                `<span class="resolved-value">${token.resolvedValue}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }
    
    /**
     * Create content for a dimension token
     */
    function createDimensionTokenContent(token: TokenData): string {
      const displayValue = token.reference && token.resolvedValue ? token.resolvedValue : token.value;
      const numericalValue = parseFloat(String(displayValue));
      const displayWidth = isNaN(numericalValue) ? 0 : Math.min(numericalValue, 100);
      
      return `
        <div class="token-card-content">
          <div class="token-visual ${token.reference ? 'is-reference' : ''}">
            <div class="dimension-swatch">
              <div class="dimension-line" style="width: ${displayWidth}%"></div>
            </div>
            ${token.reference ? '<div class="reference-indicator">↗</div>' : ''}
          </div>
          <div class="token-info">
            <div class="token-name">${token.name}</div>
            <div class="token-value">
              ${token.value}
              ${token.reference && token.resolvedValue ? 
                `<span class="resolved-value">${token.resolvedValue}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }
    
    /**
     * Create content for a typography token
     */
    function createTypographyTokenContent(token: TokenData, specificType: string): string {
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
          visualContent = `<div class="font-size-sample" style="font-size: ${displayValue}">Aa</div>`;
          break;
          
        case 'lineHeight':
          visualContent = `<div class="line-height-sample" style="line-height: ${displayValue}">Line 1<br>Line 2</div>`;
          break;
          
        case 'letterSpacing':
          visualContent = `<div class="letter-spacing-sample" style="letter-spacing: ${displayValue}">ABCDEF</div>`;
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
            <div class="token-value">
              ${token.value}
              ${token.reference && token.resolvedValue ? 
                `<span class="resolved-value">${token.resolvedValue}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }
    
    /**
     * Create content for a shadow token
     */
    function createShadowTokenContent(token: TokenData): string {
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
            <div class="token-value">
              ${token.value}
              ${token.reference && token.resolvedValue ? 
                `<span class="resolved-value">${token.resolvedValue}</span>` : ''}
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
            <div class="token-value">
              ${token.value}
              ${token.reference && token.resolvedValue ? 
                `<span class="resolved-value">${token.resolvedValue}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }
    
    /**
     * Format the type title for display
     */
    function formatTypeTitle(type: string): string {
      // Convert camelCase to Title Case with spaces
      const formatted = type
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, match => match.toUpperCase()); // Capitalize the first letter
      
      return formatted.trim();
    }
    
    // Return public interface
    return {
      update: (newTokens: TokenData[]) => {
        renderTokens(newTokens);
      },
      clear: () => {
        container.innerHTML = '';
      }
    };
  }
  
  /**
   * Create empty token grid interface for when container is not found
   */
  function createEmptyTokenGridInterface(): TokenGridInterface {
    return {
      update: () => {},
      clear: () => {}
    };
  }