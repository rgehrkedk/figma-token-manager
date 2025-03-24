/**
 * SearchComponent.ts
 * 
 * Reusable search input component
 */

export function createSearchComponent(
  id: string, 
  placeholder: string
): { 
  searchContainer: HTMLElement; 
  searchInput: HTMLInputElement;
} {
  const searchContainer = document.createElement('div');
  searchContainer.className = 'ftm-export-search-container';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'ftm-export-search-input';
  searchInput.id = id;
  searchInput.placeholder = placeholder;
  
  const searchIcon = document.createElement('span');
  searchIcon.className = 'ftm-export-search-icon';
  searchIcon.textContent = '🔍';
  
  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(searchIcon);
  
  return { searchContainer, searchInput };
}