/**
 * Component for handling collections selection
 */

/**
 * Builds the collection list UI elements
 */
export function buildCollectionList(
    tokenData: any, 
    collectionListEl: HTMLElement,
    updatePreviewCallback: () => void
  ): { selectedCollections: string[], areAllCollectionsSelected: boolean } {
    if (!tokenData) {
      return { selectedCollections: [], areAllCollectionsSelected: true };
    }
    
    collectionListEl.innerHTML = '';
    const collections = Object.keys(tokenData);
    
    if (collections.length === 0) {
      collectionListEl.innerHTML = '<div>No collections found</div>';
      return { selectedCollections: [], areAllCollectionsSelected: true };
    }
    
    // Clear selected collections and add all by default
    const selectedCollections = [...collections];
    const areAllCollectionsSelected = true;
    
    collections.forEach(collection => {
      const checkboxDiv = document.createElement('div');
      checkboxDiv.className = 'checkbox-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `collection-${collection}`;
      checkbox.value = collection;
      checkbox.checked = true;
      
      checkbox.addEventListener('change', () => {
        const selectedSet = new Set(selectedCollections);
        
        if (checkbox.checked) {
          selectedSet.add(collection);
        } else {
          selectedSet.delete(collection);
        }
        
        // Update the selected collections array
        selectedCollections.length = 0;
        selectedSet.forEach(c => selectedCollections.push(c));
        
        // Call the preview update
        updatePreviewCallback();
      });
      
      const label = document.createElement('label');
      label.htmlFor = `collection-${collection}`;
      
      // Count modes in this collection
      const modesCount = Object.keys(tokenData[collection]).length;
      label.textContent = `${collection} (${modesCount} modes)`;
      
      checkboxDiv.appendChild(checkbox);
      checkboxDiv.appendChild(label);
      collectionListEl.appendChild(checkboxDiv);
    });
    
    return { selectedCollections, areAllCollectionsSelected };
  }
  
  /**
   * Toggles all collection checkboxes
   */
  export function toggleAllCollections(
    areAllSelected: boolean,
    collectionListEl: HTMLElement,
    tokenData: any
  ): { areAllSelected: boolean, selectedCollections: string[] } {
    const newState = !areAllSelected;
    const checkboxes = collectionListEl.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
      (checkbox as HTMLInputElement).checked = newState;
    });
    
    // Update the selected collections array
    let selectedCollections: string[] = [];
    
    if (newState && tokenData) {
      selectedCollections = Object.keys(tokenData);
    }
    
    return { areAllSelected: newState, selectedCollections };
  }