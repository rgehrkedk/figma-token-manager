/**
 * Component for displaying and selecting token collections
 */

export interface Collection {
  name: string;
  variableCount?: number;
}

/**
 * Renders a collection list with checkboxes for selection
 */
export function renderCollectionList(
  collections: Collection[],
  container: HTMLElement,
  selectedCollections: string[],
  onSelectionChange: (selected: string[]) => void
): void {
  if (!collections || collections.length === 0) {
    container.innerHTML = '<div>No collections found</div>';
    return;
  }
  
  container.innerHTML = '';
  
  collections.forEach(collection => {
    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'checkbox-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `collection-${collection.name}`;
    checkbox.value = collection.name;
    checkbox.checked = selectedCollections.includes(collection.name);
    
    checkbox.addEventListener('change', () => {
      const newSelectedCollections = [...selectedCollections];
      
      if (checkbox.checked) {
        if (!newSelectedCollections.includes(collection.name)) {
          newSelectedCollections.push(collection.name);
        }
      } else {
        const index = newSelectedCollections.indexOf(collection.name);
        if (index !== -1) {
          newSelectedCollections.splice(index, 1);
        }
      }
      
      onSelectionChange(newSelectedCollections);
    });
    
    const label = document.createElement('label');
    label.htmlFor = `collection-${collection.name}`;
    
    if (collection.variableCount !== undefined) {
      label.textContent = `${collection.name} (${collection.variableCount} variables)`;
    } else {
      label.textContent = collection.name;
    }
    
    checkboxDiv.appendChild(checkbox);
    checkboxDiv.appendChild(label);
    container.appendChild(checkboxDiv);
  });
}

/**
 * Shows loading state in the collection list
 */
export function showCollectionLoading(container: HTMLElement): void {
  container.innerHTML = '<div class="loading">Scanning collections...</div>';
}

/**
 * Shows error state in the collection list
 */
export function showCollectionError(container: HTMLElement): void {
  container.innerHTML = '<div>Error loading collections</div>';
}
