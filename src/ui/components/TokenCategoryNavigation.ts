/**
 * TokenCategoryNavigation.ts
 * 
 * Organizes tokens by their first path component and creates
 * navigation shortcuts (anchors) for easy browsing.
 */

import { TokenData } from "../reference/ReferenceResolver";

interface TokenCategory {
  name: string;
  tokens: TokenData[];
}

/**
 * Organizes tokens into categories based on their first path component
 */
export function organizeTokensByCategory(tokens: TokenData[]): TokenCategory[] {
  const categories: Record<string, TokenData[]> = {};
  
  // Process each token and group by first path component
  tokens.forEach(token => {
    // Get path parts, ignoring collection and mode (which are the first two parts)
    const pathParts = token.path.split('.');
    
    // Get the category name (first path component after collection and mode)
    // If path has at least 3 parts (collection.mode.category...)
    let categoryName = 'Other';
    
    if (pathParts.length >= 3) {
      categoryName = pathParts[2];
    }
    
    // Ensure the category exists
    if (!categories[categoryName]) {
      categories[categoryName] = [];
    }
    
    // Add token to category
    categories[categoryName].push(token);
  });
  
  // Convert to array and sort by category name
  return Object.entries(categories)
    .map(([name, tokens]) => ({ name, tokens }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Creates navigation shortcuts HTML
 */
export function createCategoryNavigationHTML(categories: TokenCategory[]): string {
  if (categories.length <= 1) {
    return ''; // No navigation needed if only one category
  }
  
  let html = '<div class="category-navigation">';
  
  // Create a link for each category
  categories.forEach(category => {
    html += `<a href="#category-${category.name.toLowerCase()}" class="category-link">${category.name}</a>`;
  });
  
  html += '</div>';
  return html;
}

/**
 * Creates token category sections HTML
 */
export function createCategorySectionsHTML(
  categories: TokenCategory[], 
  createTokenCard: (token: TokenData) => HTMLElement,
  onTokenClick: (token: TokenData) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'token-categories-container';
  
  // Create a section for each category
  categories.forEach(category => {
    // Create category section
    const section = document.createElement('div');
    section.className = 'token-category-section';
    section.id = `category-${category.name.toLowerCase()}`;
    
    // Add section header
    const header = document.createElement('h2');
    header.className = 'token-category-heading';
    header.textContent = category.name;
    section.appendChild(header);
    
    // Create token grid for this category
    const tokenGrid = document.createElement('div');
    tokenGrid.className = 'token-grid';
    
    // Add tokens to grid
    category.tokens.forEach(token => {
      const tokenCard = createTokenCard(token);
      tokenCard.addEventListener('click', () => onTokenClick(token));
      tokenGrid.appendChild(tokenCard);
    });
    
    section.appendChild(tokenGrid);
    container.appendChild(section);
  });
  
  return container;
}

/**
 * Setup the category navigation and sections
 */
export function setupCategoryNavigation(
  containerEl: HTMLElement,
  tokens: TokenData[],
  createTokenCard: (token: TokenData) => HTMLElement,
  onTokenClick: (token: TokenData) => void
): void {
  // Organize tokens by category
  const categories = organizeTokensByCategory(tokens);
  
  // Create the navigation shortcuts
  const navigationHTML = createCategoryNavigationHTML(categories);
  
  // Create the category sections
  const sectionsContainer = createCategorySectionsHTML(
    categories, 
    createTokenCard,
    onTokenClick
  );
  
  // Update the container with navigation and sections
  containerEl.innerHTML = navigationHTML;
  containerEl.appendChild(sectionsContainer);
}