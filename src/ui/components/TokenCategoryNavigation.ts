/**
 * TokenCategoryNavigation.ts
 * 
 * Organizes tokens by their path components and creates
 * navigation shortcuts (anchors) for easy browsing.
 * Supports categories and subcategories for better organization.
 */

import { TokenData } from "../reference/ReferenceResolver";

interface SubCategory {
  name: string;
  tokens: TokenData[];
}

interface TokenCategory {
  name: string;
  subcategories: SubCategory[];
}

/**
 * Organizes tokens into categories and subcategories based on their path components
 */
export function organizeTokensByCategory(tokens: TokenData[]): TokenCategory[] {
  // First, organize tokens by top-level category and subcategory
  const categories: Record<string, Record<string, TokenData[]>> = {};
  
  // Process each token and group by path components
  tokens.forEach(token => {
    // Get path parts, ignoring collection and mode (which are the first two parts)
    const pathParts = token.path.split('.');
    
    // Get the category name (3rd path component) and subcategory name (4th path component)
    let categoryName = 'Other';
    let subcategoryName = 'General';
    
    if (pathParts.length >= 3) {
      categoryName = pathParts[2];
    }
    
    if (pathParts.length >= 4) {
      subcategoryName = pathParts[3];
    }
    
    // Ensure the category exists
    if (!categories[categoryName]) {
      categories[categoryName] = {};
    }
    
    // Ensure the subcategory exists
    if (!categories[categoryName][subcategoryName]) {
      categories[categoryName][subcategoryName] = [];
    }
    
    // Add token to subcategory
    categories[categoryName][subcategoryName].push(token);
  });
  
  // Convert to array and sort by category name
  return Object.entries(categories)
    .map(([name, subcategoryMap]) => {
      // Convert subcategories to array and sort
      const subcategories = Object.entries(subcategoryMap)
        .map(([subName, tokens]) => ({ 
          name: subName, 
          tokens 
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      return { 
        name, 
        subcategories
      };
    })
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
 * Creates token category sections HTML with subcategories
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
    
    // Add category header
    const header = document.createElement('h2');
    header.className = 'token-category-heading';
    header.textContent = category.name;
    section.appendChild(header);
    
    // Process each subcategory
    category.subcategories.forEach(subcategory => {
      // Create subcategory container
      const subcategoryContainer = document.createElement('div');
      subcategoryContainer.className = 'token-subcategory-section';
      
      // Add subcategory header
      const subheader = document.createElement('h3');
      subheader.className = 'token-subcategory-heading';
      subheader.textContent = subcategory.name;
      subcategoryContainer.appendChild(subheader);
      
      // Create token grid for this subcategory
      const tokenGrid = document.createElement('div');
      tokenGrid.className = 'token-grid';
      
      // Add tokens to grid
      subcategory.tokens.forEach(token => {
        const tokenCard = createTokenCard(token);
        tokenCard.addEventListener('click', () => onTokenClick(token));
        tokenGrid.appendChild(tokenCard);
      });
      
      subcategoryContainer.appendChild(tokenGrid);
      section.appendChild(subcategoryContainer);
    });
    
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