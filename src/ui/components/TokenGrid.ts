/**
 * TokenGrid.ts
 * 
 * A simplified grid component that displays tokens organized by type,
 * using the new TokenCard component for rendering individual tokens.
 */

import { TokenData } from "../reference/ReferenceResolver";
import { createTokenCard } from "./TokenCard";

export interface TokenGridProps {
  tokens: TokenData[];
  onTokenClick: (token: TokenData) => void;
}

/**
 * Creates a token grid component
 */
export function createTokenGrid(props: TokenGridProps): {
  element: HTMLElement;
  update: (tokens: TokenData[]) => void;
} {
  const { tokens, onTokenClick } = props;
  
  // Create the grid container
  const gridContainer = document.createElement('div');
  gridContainer.className = 'token-grid-container';
  
  // Function to render tokens
  const renderTokens = (tokensToRender: TokenData[]) => {
    // Clear the grid
    gridContainer.innerHTML = '';
    
    // If no tokens, show empty state
    if (tokensToRender.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'token-grid-empty';
      emptyState.textContent = 'No tokens to display';
      gridContainer.appendChild(emptyState);
      return;
    }
    
    // Group tokens by type
    const tokensByType: { [type: string]: TokenData[] } = {};
    
    tokensToRender.forEach(token => {
      if (!tokensByType[token.type]) {
        tokensByType[token.type] = [];
      }
      tokensByType[token.type].push(token);
    });
    
    // Create a section for each token type
    Object.keys(tokensByType).sort().forEach(type => {
      const typeTokens = tokensByType[type];
      
      // Create type section
      const typeSection = document.createElement('div');
      typeSection.className = 'token-type-section';
      typeSection.dataset.type = type;
      
      // Add section header
      const sectionHeader = document.createElement('h3');
      sectionHeader.className = 'token-type-header';
      sectionHeader.textContent = formatTokenType(type);
      typeSection.appendChild(sectionHeader);
      
      // Create grid for this section
      const tokenGrid = document.createElement('div');
      tokenGrid.className = 'token-grid';
      
      // Add tokens to grid
      typeTokens.forEach(token => {
        const tokenCard = createTokenCard({
          token,
          onClick: onTokenClick  // This passes the click handler to each card
        });
        tokenGrid.appendChild(tokenCard);
      });
      
      typeSection.appendChild(tokenGrid);
      gridContainer.appendChild(typeSection);
    });
  };
  
  // Initial render
  renderTokens(tokens);
  
  // Return the interface
  return {
    element: gridContainer,
    update: (newTokens: TokenData[]) => {
      renderTokens(newTokens);
    }
  };
}

/**
 * Format token type for display
 */
function formatTokenType(type: string): string {
  // Handle special cases
  switch (type) {
    case 'color': return 'Colors';
    case 'fontSize': return 'Font Sizes';
    case 'fontFamily': return 'Font Families';
    case 'fontWeight': return 'Font Weights';
    case 'lineHeight': return 'Line Heights';
    case 'letterSpacing': return 'Letter Spacing';
    case 'boxShadow': return 'Box Shadows';
    case 'borderRadius': return 'Border Radius';
    default:
      // Convert camelCase to Title Case
      return type
        .replace(/([A-Z])/g, ' $1') // Insert a space before all caps
        .replace(/^./, str => str.toUpperCase()) // Uppercase the first character
        + 's'; // Add plural
  }
}