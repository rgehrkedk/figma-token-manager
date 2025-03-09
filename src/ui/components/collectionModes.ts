/**
 * Component for managing collections and modes in a hierarchical structure
 */

interface SelectionState {
    selectedCollections: string[];
    selectedModes: Map<string, string[]>;
    allCollections: string[];
  }
  
  /**
   * Builds the collection and modes list with hierarchical structure
   */
  export function buildCollectionModesList(
    tokenData: any,
    containerEl: HTMLElement,
    updatePreviewCallback: () => void
  ): SelectionState {
    if (!tokenData) {
      return { 
        selectedCollections: [], 
        selectedModes: new Map(), 
        allCollections: [] 
      };
    }
    
    containerEl.innerHTML = '';
    const collections = Object.keys(tokenData);
    
    if (collections.length === 0) {
      containerEl.innerHTML = '<div>No collections found</div>';
      return { 
        selectedCollections: [], 
        selectedModes: new Map(), 
        allCollections: [] 
      };
    }
    
    // Initialize selection state
    const selectedCollections: string[] = [...collections];
    const selectedModes: Map<string, string[]> = new Map();
    const allCollections: string[] = [...collections];
    
    // Process each collection
    collections.forEach(collection => {
      const collectionItem = document.createElement('div');
      collectionItem.className = 'collection-item';
      collectionItem.dataset.collection = collection;
      
      // Get all modes for this collection
      const modes = Object.keys(tokenData[collection]);
      selectedModes.set(collection, [...modes]); // Select all modes initially
      
      // Create collection header
      const collectionHeader = document.createElement('div');
      collectionHeader.className = 'collection-header';
      
      // Add collection checkbox
      const collectionCheckbox = document.createElement('input');
      collectionCheckbox.type = 'checkbox';
      collectionCheckbox.id = `collection-${collection}`;
      collectionCheckbox.checked = true;
      collectionCheckbox.dataset.collection = collection;
      
      // Add expand/collapse button
      const expandBtn = document.createElement('span');
      expandBtn.className = 'collection-toggle expander-icon expanded';
      expandBtn.dataset.collection = collection;
      
      // Add collection label
      const collectionLabel = document.createElement('label');
      collectionLabel.htmlFor = `collection-${collection}`;
      collectionLabel.textContent = collection;
      
      // Add mode count badge
      const modeBadge = document.createElement('span');
      modeBadge.className = 'collection-badge';
      modeBadge.textContent = `${modes.length} modes`;
      
      // Build the collection header
      collectionHeader.appendChild(expandBtn);
      collectionHeader.appendChild(collectionCheckbox);
      collectionHeader.appendChild(collectionLabel);
      collectionHeader.appendChild(modeBadge);
      
      // Create container for modes
      const modesContainer = document.createElement('div');
      modesContainer.className = 'mode-container';
      modesContainer.dataset.collection = collection;
      
      // Add each mode as a checkbox
      modes.forEach(mode => {
        const modeItem = document.createElement('div');
        modeItem.className = 'mode-item';
        
        const modeCheckbox = document.createElement('input');
        modeCheckbox.type = 'checkbox';
        modeCheckbox.id = `mode-${collection}-${mode}`;
        modeCheckbox.checked = true;
        modeCheckbox.dataset.collection = collection;
        modeCheckbox.dataset.mode = mode;
        
        const modeLabel = document.createElement('label');
        modeLabel.htmlFor = `mode-${collection}-${mode}`;
        
        // Count tokens in this mode
        const tokenCount = countTokens(tokenData[collection][mode]);
        modeLabel.textContent = `${mode}`;
        
        const tokenCountSpan = document.createElement('span');
        tokenCountSpan.className = 'token-count';
        tokenCountSpan.textContent = `(${tokenCount} tokens)`;
        
        modeLabel.appendChild(tokenCountSpan);
        
        modeItem.appendChild(modeCheckbox);
        modeItem.appendChild(modeLabel);
        modesContainer.appendChild(modeItem);
        
        // Add event listener to mode checkbox
        modeCheckbox.addEventListener('change', () => {
          const collectionModes = selectedModes.get(collection) || [];
          
          if (modeCheckbox.checked) {
            // Add mode if not already in the list
            if (!collectionModes.includes(mode)) {
              collectionModes.push(mode);
              selectedModes.set(collection, collectionModes);
            }
          } else {
            // Remove mode from the list
            const updatedModes = collectionModes.filter(m => m !== mode);
            selectedModes.set(collection, updatedModes);
            
            // Uncheck collection if all modes are unchecked
            if (updatedModes.length === 0) {
              collectionCheckbox.checked = false;
              const collectionIndex = selectedCollections.indexOf(collection);
              if (collectionIndex > -1) {
                selectedCollections.splice(collectionIndex, 1);
              }
            }
          }
          
          updatePreviewCallback();
        });
      });
      
      // Add event listener to collection checkbox
      collectionCheckbox.addEventListener('change', () => {
        const nodeList = modesContainer.querySelectorAll('input[type="checkbox"]');
        
        if (collectionCheckbox.checked) {
          // Add collection to selected list
          if (!selectedCollections.includes(collection)) {
            selectedCollections.push(collection);
          }
          
          // Check all mode checkboxes
          for (let i = 0; i < nodeList.length; i++) {
            const checkbox = nodeList[i] as HTMLInputElement;
            checkbox.checked = true;
            const mode = checkbox.dataset.mode;
            if (mode) {
              const collectionModes = selectedModes.get(collection) || [];
              if (!collectionModes.includes(mode)) {
                collectionModes.push(mode);
                selectedModes.set(collection, collectionModes);
              }
            }
          }
        } else {
          // Remove collection from selected list
          const collectionIndex = selectedCollections.indexOf(collection);
          if (collectionIndex > -1) {
            selectedCollections.splice(collectionIndex, 1);
          }
          
          // Uncheck all mode checkboxes
          for (let i = 0; i < nodeList.length; i++) {
            const checkbox = nodeList[i] as HTMLInputElement;
            checkbox.checked = false;
          }
          
          // Clear selected modes for this collection
          selectedModes.set(collection, []);
        }
        
        updatePreviewCallback();
      });
      
      // Add expand/collapse functionality
      expandBtn.addEventListener('click', () => {
        const isExpanded = expandBtn.classList.contains('expanded');
        
        if (isExpanded) {
          expandBtn.classList.remove('expanded');
          modesContainer.style.display = 'none';
        } else {
          expandBtn.classList.add('expanded');
          modesContainer.style.display = 'block';
        }
      });
      
      // Build the complete collection item
      collectionItem.appendChild(collectionHeader);
      collectionItem.appendChild(modesContainer);
      containerEl.appendChild(collectionItem);
    });
    
    return { selectedCollections, selectedModes, allCollections };
  }
  
  /**
   * Toggles all collections and their modes
   */
  export function toggleAllCollectionsAndModes(
    isChecked: boolean,
    containerEl: HTMLElement,
    tokenData: any
  ): SelectionState {
    const collectionNodeList = containerEl.querySelectorAll('input[data-collection]:not([data-mode])');
    const modeNodeList = containerEl.querySelectorAll('input[data-mode]');
    
    // Set state for all checkboxes
    for (let i = 0; i < collectionNodeList.length; i++) {
      const checkbox = collectionNodeList[i] as HTMLInputElement;
      checkbox.checked = isChecked;
    }
    
    for (let i = 0; i < modeNodeList.length; i++) {
      const checkbox = modeNodeList[i] as HTMLInputElement;
      checkbox.checked = isChecked;
    }
    
    // Prepare return data
    const selectedCollections: string[] = [];
    const selectedModes: Map<string, string[]> = new Map();
    const allCollections = Object.keys(tokenData);
    
    if (isChecked) {
      // Select all collections and modes
      allCollections.forEach(collection => {
        selectedCollections.push(collection);
        const modes = Object.keys(tokenData[collection]);
        selectedModes.set(collection, [...modes]);
      });
    } else {
      // Deselect everything
      allCollections.forEach(collection => {
        selectedModes.set(collection, []);
      });
    }
    
    return { selectedCollections, selectedModes, allCollections };
  }
  
  /**
   * Counts the number of tokens in a token object
   */
  function countTokens(obj: any): number {
    let count = 0;
    
    function traverse(node: any) {
      if (!node || typeof node !== 'object') return;
      
      // For DTCG format
      if (node.$value !== undefined && node.$type !== undefined) {
        count++;
        return;
      }
      
      // For nested objects
      for (const key in node) {
        if (typeof node[key] === 'object' && node[key] !== null) {
          traverse(node[key]);
        } else if (key !== '$type' && key !== '$description') {
          // For legacy format
          count++;
        }
      }
    }
    
    traverse(obj);
    return count;
  }