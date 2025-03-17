/**
 * Updated TokenGrid.ts
 * 
 * Enhanced version of the token grid component that includes
 * category-based navigation and organization.
 */

import { TokenData } from "../reference/ReferenceResolver";
import { createTokenCard } from "./TokenCard";
import { setupCategoryNavigation } from "./TokenCategoryNavigation";

export interface TokenGridProps {
  tokens: TokenData[];
  onTokenClick: (token: TokenData) => void;
}

/**
 * Creates a token grid component with category navigation
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

    // Set up category navigation
    setupCategoryNavigation(
      gridContainer,
      tokensToRender,
      (token) => createTokenCard({
        token,
        onClick: onTokenClick
      }),
      onTokenClick
    );
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