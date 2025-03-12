/**
 * Collection Mode Selector Component
 * Handles selection of collections and their respective modes
 */

interface CollectionData {
  name: string;
  modes: string[];
}

interface CollectionSelectorConfig {
  containerId: string;
  collections: CollectionData[];
  initialSelectedCollections?: string[];
  initialSelectedModes?: Map<string, string[]>;
  onChange?: (selectedCollections: string[], selectedModes: Map<string, string[]>) => void;
}

interface CollectionSelectorInterface {
  getSelectedCollections: () => string[];
  getSelectedModes: () => Map<string, string[]>;
  selectAll: () => void;
  deselectAll: () => void;
}

/**
 * Setup the collection and mode selector component
 */
export function setupCollectionModeSelector(config: CollectionSelectorConfig): CollectionSelectorInterface {
  // Get container element and handle the null case upfront
  const container = document.getElementById(config.containerId);
  if (!container) {
    console.error(`Container ${config.containerId} not found`);
    return createEmptyInterface();
  }

  // Clear the container
  container.innerHTML = '';
  
  // Initialize state
  const selectedCollections = config.initialSelectedCollections || [];
  const selectedModes = config.initialSelectedModes || new Map<string, string[]>();

  // Create select all toggle
  const selectAllToggle = document.createElement('div');
  selectAllToggle.className = 'select-all-toggle';
  selectAllToggle.textContent = 'Select All';
  selectAllToggle.addEventListener('click', toggleAllCheckboxes);
  container.appendChild(selectAllToggle);
  
  // Create collections and modes
  config.collections.forEach(collection => {
    createCollectionGroup(collection, container);
  });

  /**
   * Toggle all checkboxes when the "Select All" button is clicked
   */
  function toggleAllCheckboxes() {
    const allCheckboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const allSelected = Array.from(allCheckboxes).every(checkbox => checkbox.checked);
    
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = !allSelected;
    });
    
    updateSelectionState();
  }
  
  /**
   * Create a collection group with its modes
   */
  function createCollectionGroup(collection: CollectionData, parentElement: HTMLElement) {
    const collectionGroup = document.createElement('div');
    collectionGroup.className = 'collection-group';
    
    // Create collection checkbox and header
    const collectionHeader = document.createElement('div');
    collectionHeader.className = 'collection-header';
    
    const collectionCheckbox = document.createElement('input');
    collectionCheckbox.type = 'checkbox';
    collectionCheckbox.id = `collection-${collection.name}`;
    collectionCheckbox.checked = selectedCollections.includes(collection.name);
    collectionCheckbox.className = 'collection-checkbox';
    
    collectionCheckbox.addEventListener('change', () => {
      // Update all mode checkboxes to match collection checkbox
      const modeCheckboxes = collectionGroup.querySelectorAll<HTMLInputElement>('.mode-checkbox');
      modeCheckboxes.forEach(checkbox => checkbox.checked = collectionCheckbox.checked);
      updateSelectionState();
    });
    
    const collectionLabel = document.createElement('label');
    collectionLabel.htmlFor = `collection-${collection.name}`;
    collectionLabel.textContent = collection.name;
    collectionLabel.className = 'collection-label';
    
    collectionHeader.appendChild(collectionCheckbox);
    collectionHeader.appendChild(collectionLabel);
    collectionGroup.appendChild(collectionHeader);
    
    // Create mode checkboxes container
    const modesContainer = document.createElement('div');
    modesContainer.className = 'modes-container';
    
    // Create each mode checkbox
    collection.modes.forEach(mode => {
      createModeCheckbox(collection.name, mode, modesContainer, collectionCheckbox);
    });
    
    collectionGroup.appendChild(modesContainer);
    parentElement.appendChild(collectionGroup);
  }
  
  /**
   * Create a mode checkbox within a collection
   */
  function createModeCheckbox(
    collectionName: string, 
    mode: string, 
    parentElement: HTMLElement, 
    collectionCheckbox: HTMLInputElement
  ) {
    const modeItem = document.createElement('div');
    modeItem.className = 'mode-item';
    
    const modeCheckbox = document.createElement('input');
    modeCheckbox.type = 'checkbox';
    modeCheckbox.id = `mode-${collectionName}-${mode}`;
    modeCheckbox.className = 'mode-checkbox';
    modeCheckbox.dataset.collection = collectionName;
    modeCheckbox.dataset.mode = mode;
    
    // Check if this mode is in the selected modes for this collection
    const modesForCollection = selectedModes.get(collectionName) || [];
    modeCheckbox.checked = modesForCollection.includes(mode);
    
    modeCheckbox.addEventListener('change', () => {
      // Update collection checkbox based on mode selection
      const parentCollection = modeCheckbox.closest('.collection-group');
      if (parentCollection) {
        const allModeCheckboxes = parentCollection.querySelectorAll<HTMLInputElement>('.mode-checkbox');
        const anyModeChecked = Array.from(allModeCheckboxes).some(cb => cb.checked);
        collectionCheckbox.checked = anyModeChecked;
      }
      updateSelectionState();
    });
    
    const modeLabel = document.createElement('label');
    modeLabel.htmlFor = `mode-${collectionName}-${mode}`;
    modeLabel.textContent = mode;
    modeLabel.className = 'mode-label';
    
    modeItem.appendChild(modeCheckbox);
    modeItem.appendChild(modeLabel);
    parentElement.appendChild(modeItem);
  }
  
  /**
   * Update the selection state and trigger onChange callback
   */
  function updateSelectionState() {
    // Get selected collections and their modes
    const updatedSelectedCollections: string[] = [];
    const updatedSelectedModes = new Map<string, string[]>();
    
    const collectionCheckboxes = container.querySelectorAll<HTMLInputElement>('.collection-checkbox');
    
    collectionCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const collectionName = checkbox.id.replace('collection-', '');
        updatedSelectedCollections.push(collectionName);
        
        // Get selected modes for this collection
        const modeCheckboxes = container.querySelectorAll<HTMLInputElement>(
          `.mode-checkbox[data-collection="${collectionName}"]`
        );
        const selectedModesForCollection: string[] = [];
        
        modeCheckboxes.forEach(modeCheckbox => {
          if (modeCheckbox.checked && modeCheckbox.dataset.mode) {
            selectedModesForCollection.push(modeCheckbox.dataset.mode);
          }
        });
        
        updatedSelectedModes.set(collectionName, selectedModesForCollection);
      }
    });
    
    // Update state
    selectedCollections.length = 0;
    selectedCollections.push(...updatedSelectedCollections);
    
    selectedModes.clear();
    updatedSelectedModes.forEach((modes, collection) => {
      selectedModes.set(collection, [...modes]);
    });
    
    // Trigger onChange callback
    if (config.onChange) {
      config.onChange(selectedCollections, selectedModes);
    }
  }
  
  /**
   * Set checkbox selection state safely
   */
  function setCheckboxSelection(selector: string, checked: boolean) {
    const checkboxes = container.querySelectorAll<HTMLInputElement>(selector);
    checkboxes.forEach(checkbox => { checkbox.checked = checked; });
  }
  
  // Return public interface
  return {
    getSelectedCollections: () => [...selectedCollections],
    getSelectedModes: () => new Map(selectedModes),
    selectAll: () => {
      setCheckboxSelection('.collection-checkbox', true);
      setCheckboxSelection('.mode-checkbox', true);
      updateSelectionState();
    },
    deselectAll: () => {
      setCheckboxSelection('.collection-checkbox', false);
      setCheckboxSelection('.mode-checkbox', false);
      updateSelectionState();
    }
  };
}

/**
 * Creates a no-op interface when container is not found
 */
function createEmptyInterface(): CollectionSelectorInterface {
  return {
    getSelectedCollections: () => [],
    getSelectedModes: () => new Map(),
    selectAll: () => {},
    deselectAll: () => {}
  };
}
