/**
 * Sidebar Panel component for the Figma Token Manager
 */

interface Collection {
    id: string;
    name: string;
    modes: string[];
    count: number;
  }
  
  interface SidebarState {
    selectedCollections: string[];
    expandedCollections: string[];
    selectedModes: Map<string, string[]>;
    activeSidebarTab: 'collections' | 'settings';
    colorFormat: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';
    exportFormat: 'dtcg' | 'legacy';
    separateFiles: boolean;
    validateReferences: boolean;
    flatStructure: boolean;
  }
  
  export interface SidebarCallbacks {
    onCollectionToggle: (collection: string, selected: boolean) => void;
    onModeToggle: (collection: string, mode: string, selected: boolean) => void;
    onSettingsChange: (setting: string, value: any) => void;
    onExtract: () => void;
    onExport: () => void;
  }
  
  export interface SidebarInterface {
    getState: () => SidebarState;
    setState: (newState: Partial<SidebarState>) => void;
    setReferenceCounts: (resolved: number, unresolved: number) => void;
    updateCollections: (collections: Collection[]) => void;
  }
  
  export function setupSidebarPanel(
    containerId: string,
    initialCollections: Collection[] = [],
    initialState: Partial<SidebarState> = {},
    callbacks: SidebarCallbacks
  ): SidebarInterface {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Sidebar container #${containerId} not found`);
      return createEmptySidebarInterface();
    }
  
    // Initialize state with defaults
    const state: SidebarState = {
      selectedCollections: initialState.selectedCollections || [],
      expandedCollections: initialState.expandedCollections || [],
      selectedModes: initialState.selectedModes || new Map(),
      activeSidebarTab: initialState.activeSidebarTab || 'collections',
      colorFormat: initialState.colorFormat || 'hex',
      exportFormat: initialState.exportFormat || 'dtcg',
      separateFiles: initialState.separateFiles !== undefined ? initialState.separateFiles : true,
      validateReferences: initialState.validateReferences !== undefined ? initialState.validateReferences : true,
      flatStructure: initialState.flatStructure || false
    };
  
    // Reference counts state
    let referenceStatus = {
      resolved: 0,
      unresolved: 0
    };
  
    // Store collections data
    let collections: Collection[] = initialCollections;
  
    // Initialize the sidebar HTML
    container.innerHTML = `
      <div class="sidebar-tabs">
        <button class="sidebar-tab active" data-tab="collections">Collections</button>
        <button class="sidebar-tab" data-tab="settings">Settings</button>
      </div>
      
      <div class="sidebar-content">
        <div class="sidebar-panel active" id="collections-panel">
          <!-- Search box -->
          <div class="search-container">
            <div class="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <input type="text" class="search-input" placeholder="Search tokens...">
          </div>
          
          <!-- Collections tree -->
          <div class="collections-tree"></div>
        </div>
        
        <div class="sidebar-panel" id="settings-panel">
          <!-- Format options -->
          <div class="settings-section">
            <h3 class="settings-heading">Format</h3>
            <div class="settings-options">
              <div class="settings-option">
                <input type="radio" id="format-dtcg" name="format" ${state.exportFormat === 'dtcg' ? 'checked' : ''}>
                <label for="format-dtcg">DTCG Format</label>
              </div>
              <div class="settings-option">
                <input type="radio" id="format-legacy" name="format" ${state.exportFormat === 'legacy' ? 'checked' : ''}>
                <label for="format-legacy">Legacy Format</label>
              </div>
            </div>
          </div>
          
          <!-- Color Format -->
          <div class="settings-section">
            <h3 class="settings-heading">Color Format</h3>
            <div class="settings-options">
              <div class="settings-option">
                <input type="radio" id="color-hex" name="color-format" ${state.colorFormat === 'hex' ? 'checked' : ''}>
                <label for="color-hex">HEX (#ffffff)</label>
              </div>
              <div class="settings-option">
                <input type="radio" id="color-rgb" name="color-format" ${state.colorFormat === 'rgb' ? 'checked' : ''}>
                <label for="color-rgb">RGB (rgb(255, 255, 255))</label>
              </div>
              <div class="settings-option">
                <input type="radio" id="color-rgba" name="color-format" ${state.colorFormat === 'rgba' ? 'checked' : ''}>
                <label for="color-rgba">RGBA (rgba(255, 255, 255, 1))</label>
              </div>
              <div class="settings-option">
                <input type="radio" id="color-hsl" name="color-format" ${state.colorFormat === 'hsl' ? 'checked' : ''}>
                <label for="color-hsl">HSL (hsl(0deg, 0%, 100%))</label>
              </div>
              <div class="settings-option">
                <input type="radio" id="color-hsla" name="color-format" ${state.colorFormat === 'hsla' ? 'checked' : ''}>
                <label for="color-hsla">HSLA (hsla(0deg, 0%, 100%, 1))</label>
              </div>
            </div>
          </div>
          
          <!-- Export Options -->
          <div class="settings-section">
            <h3 class="settings-heading">Export Options</h3>
            <div class="settings-options">
              <div class="settings-option">
                <input type="checkbox" id="separate-files" ${state.separateFiles ? 'checked' : ''}>
                <label for="separate-files">Export separate files</label>
              </div>
              <div class="settings-option">
                <input type="checkbox" id="validate-references" ${state.validateReferences ? 'checked' : ''}>
                <label for="validate-references">Validate references</label>
              </div>
              <div class="settings-option">
                <input type="checkbox" id="flat-structure" ${state.flatStructure ? 'checked' : ''}>
                <label for="flat-structure">Flat structure</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="sidebar-footer">
        <div class="reference-status">
          <span>References</span>
          <span class="reference-counter ${referenceStatus.unresolved > 0 ? 'has-unresolved' : ''}">
            ${referenceStatus.resolved}/${referenceStatus.resolved + referenceStatus.unresolved} resolved
          </span>
        </div>
        
        <div class="sidebar-actions">
          <button class="extract-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 4V10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M1 20V14H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20.49 9C19.2456 6.94681 17.3065 5.36266 15.0186 4.5153C12.7306 3.66794 10.2249 3.61133 7.89923 4.35544C5.57361 5.09955 3.56028 6.60066 2.1872 8.61679C0.814125 10.6329 0.155969 13.0432 0.31 15.46L1 20M23.69 8.54C23.8445 10.9567 23.1871 13.3671 21.8146 15.3832C20.4421 17.3993 18.4293 18.9003 16.1042 19.6445C13.7792 20.3886 11.2739 20.332 8.98669 19.4847C6.69943 18.6374 4.76083 17.0532 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Extract</span>
          </button>
          <button class="export-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>
    `;
  
    // Setup collections tree
    renderCollectionsTree();
  
    // Setup tab switching
    setupTabSwitching();
  
    // Setup settings handlers
    setupSettingsHandlers();
  
    // Setup action buttons
    setupActionButtons();
  
    // Setup search functionality
    setupSearch();
  
    /**
     * Builds the collections tree in the sidebar
     */
    function renderCollectionsTree() {
      const collectionsTreeEl = container?.querySelector('.collections-tree');
      if (!collectionsTreeEl) return;
  
      collectionsTreeEl.innerHTML = '';
  
      collections.forEach(collection => {
        // Create collection item element
        const collectionItem = document.createElement('div');
        collectionItem.className = 'collection-item';
        collectionItem.dataset.collection = collection.id;
  
        // Create collection header
        const collectionHeader = document.createElement('div');
        collectionHeader.className = 'collection-header';
        if (state.selectedCollections.includes(collection.id)) {
            collectionHeader.classList.add('selected');
          }

        // Create expand/collapse icon
        const isExpanded = state.expandedCollections.includes(collection.id);
        const expandIcon = document.createElement('span');
        expandIcon.className = `expander-icon ${isExpanded ? 'expanded' : ''}`;
        expandIcon.innerHTML = isExpanded
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 9L12 16L5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        
        // Create collection checkbox
        const collectionCheckbox = document.createElement('input');
        collectionCheckbox.type = 'checkbox';
        collectionCheckbox.id = `collection-${collection.id}`;
        collectionCheckbox.checked = state.selectedModes.has(collection.id) && 
                                   state.selectedModes.get(collection.id)!.length > 0;
        collectionCheckbox.dataset.collection = collection.id;
        
        // Create collection label
        const collectionLabel = document.createElement('label');
        collectionLabel.htmlFor = `collection-${collection.id}`;
        collectionLabel.textContent = collection.name;
        
        // Create mode count badge
        const modeBadge = document.createElement('span');
        modeBadge.className = 'collection-badge';
        modeBadge.textContent = `${collection.count}`;
        
        // Assemble collection header
        collectionHeader.appendChild(expandIcon);
        collectionHeader.appendChild(collectionCheckbox);
        collectionHeader.appendChild(collectionLabel);
        collectionHeader.appendChild(modeBadge);
        
        // Create modes container
        const modesContainer = document.createElement('div');
        modesContainer.className = 'mode-container';
        modesContainer.style.display = isExpanded ? 'block' : 'none';
        modesContainer.dataset.collection = collection.id;
        
        // Create modes list
        collection.modes.forEach(mode => {
          const modeItem = document.createElement('div');
          modeItem.className = 'mode-item';
          
          const modeCheckbox = document.createElement('input');
          modeCheckbox.type = 'checkbox';
          modeCheckbox.id = `mode-${collection.id}-${mode}`;
          modeCheckbox.checked = state.selectedModes.has(collection.id) && 
                                state.selectedModes.get(collection.id)!.includes(mode);
          modeCheckbox.dataset.collection = collection.id;
          modeCheckbox.dataset.mode = mode;
          
          const modeLabel = document.createElement('label');
          modeLabel.htmlFor = `mode-${collection.id}-${mode}`;
          modeLabel.textContent = mode;
          
          modeItem.appendChild(modeCheckbox);
          modeItem.appendChild(modeLabel);
          modesContainer.appendChild(modeItem);
          
          // Add mode checkbox event listener
          modeCheckbox.addEventListener('change', () => {
            handleModeToggle(collection.id, mode, modeCheckbox.checked);
          });
        });
        
        // Add collection to the tree
        collectionItem.appendChild(collectionHeader);
        collectionItem.appendChild(modesContainer);
        collectionsTreeEl.appendChild(collectionItem);
        
        // Add event listeners
        collectionHeader.addEventListener('click', (e) => {
          if (e.target === collectionCheckbox) return;
          if (e.target === collectionLabel) return;
          
          toggleCollectionExpansion(collection.id);
        });
        
        collectionCheckbox.addEventListener('change', () => {
          handleCollectionToggle(collection.id, collectionCheckbox.checked);
        });
      });
    }
    
    /**
     * Toggles collection expansion state
     */
    function toggleCollectionExpansion(collectionId: string) {
      const isExpanded = state.expandedCollections.includes(collectionId);
      
      if (isExpanded) {
        // Collapse the collection
        state.expandedCollections = state.expandedCollections.filter(id => id !== collectionId);
        const modesContainer = container?.querySelector(`.mode-container[data-collection="${collectionId}"]`) as HTMLElement;
        if (modesContainer) {
          modesContainer.style.display = 'none';
        }
        const expandIcon = container?.querySelector(`.collection-item[data-collection="${collectionId}"] .expander-icon`);
        if (expandIcon) {
          expandIcon.classList.remove('expanded');
          expandIcon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
      } else {
        // Expand the collection
        state.expandedCollections.push(collectionId);
        const modesContainer = container?.querySelector(`.mode-container[data-collection="${collectionId}"]`) as HTMLElement;
        if (modesContainer) {
          modesContainer.   style.display = 'block';
        }
        const expandIcon = container?.querySelector(`.collection-item[data-collection="${collectionId}"] .expander-icon`);
        if (expandIcon) {
          expandIcon.classList.add('expanded');
          expandIcon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 9L12 16L5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
      }
      
      // Set the selected collection
      state.selectedCollections = [collectionId];
            
      // Update selected state in UI
      const collectionHeaders = container?.querySelectorAll('.collection-header');
      collectionHeaders?.forEach(header => {
        header.classList.remove('selected');
      });
      
      const selectedHeader = container?.querySelector(`.collection-item[data-collection="${collectionId}"] .collection-header`);
      if (selectedHeader) {
        selectedHeader.classList.add('selected');
      }
    }
    
    /**
     * Handles collection checkbox toggle
     */
    function handleCollectionToggle(collectionId: string, isChecked: boolean) {
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) return;
      
      if (isChecked) {
        // Select all modes for this collection
        const modesForCollection = collection.modes;
        state.selectedModes.set(collectionId, [...modesForCollection]);
        
        // Update all mode checkboxes
        const modeCheckboxes = container?.querySelectorAll(`input[data-collection="${collectionId}"][data-mode]`);
        modeCheckboxes?.forEach(checkbox => {
          (checkbox as HTMLInputElement).checked = true;
        });
      } else {
        // Deselect all modes for this collection
        state.selectedModes.set(collectionId, []);
        
        // Update all mode checkboxes
        const modeCheckboxes = container?.querySelectorAll(`input[data-collection="${collectionId}"][data-mode]`);
        modeCheckboxes?.forEach(checkbox => {
          (checkbox as HTMLInputElement).checked = false;
        });
      }
      
      // Call the callback
      callbacks.onCollectionToggle(collectionId, isChecked);
    }
    
    /**
     * Handles mode checkbox toggle
     */
    function handleModeToggle(collectionId: string, mode: string, isChecked: boolean) {
      let modesForCollection = state.selectedModes.get(collectionId) || [];
      
      if (isChecked) {
        // Add mode to selected modes if not already included
        if (!modesForCollection.includes(mode)) {
          modesForCollection.push(mode);
          state.selectedModes.set(collectionId, modesForCollection);
        }
      } else {
        // Remove mode from selected modes
        modesForCollection = modesForCollection.filter(m => m !== mode);
        state.selectedModes.set(collectionId, modesForCollection);
      }
      
      // Update collection checkbox state
      const collectionCheckbox = container?.querySelector(`input[id="collection-${collectionId}"]`) as HTMLInputElement;
      if (collectionCheckbox) {
        collectionCheckbox.checked = modesForCollection.length > 0;
      }
      
      // Call the callback
      callbacks.onModeToggle(collectionId, mode, isChecked);
    }
    
    /**
     * Setup sidebar tab switching
     */
    function setupTabSwitching() {
      const tabs = container?.querySelectorAll('.sidebar-tab');
      const panels = container?.querySelectorAll('.sidebar-panel');
      
      tabs?.forEach(tab => {
        tab.addEventListener('click', () => {
          const tabName = tab.getAttribute('data-tab') as 'collections' | 'settings';
          
          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Update active panel
          panels?.forEach(panel => panel.classList.remove('active'));
          const activePanel = container?.querySelector(`#${tabName}-panel`);
          activePanel?.classList.add('active');
          
          // Update state
          state.activeSidebarTab = tabName;
        });
      });
    }
    
    /**
     * Setup settings option handlers
     */
    function setupSettingsHandlers() {
      // Format radio buttons
      const formatRadios = container?.querySelectorAll('input[name="format"]');
      formatRadios?.forEach(radio => {
        radio.addEventListener('change', () => {
          if ((radio as HTMLInputElement).checked) {
            const format = radio.id === 'format-dtcg' ? 'dtcg' : 'legacy';
            state.exportFormat = format;
            callbacks.onSettingsChange('exportFormat', format);
          }
        });
      });
      
      // Color format radio buttons
      const colorFormatRadios = container?.querySelectorAll('input[name="color-format"]');
      colorFormatRadios?.forEach(radio => {
        radio.addEventListener('change', () => {
          if ((radio as HTMLInputElement).checked) {
            const format = radio.id.replace('color-', '') as 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';
            state.colorFormat = format;
            callbacks.onSettingsChange('colorFormat', format);
          }
        });
      });
      
      // Checkbox options
      const separateFilesCheckbox = container?.querySelector('#separate-files') as HTMLInputElement;
      const validateReferencesCheckbox = container?.querySelector('#validate-references') as HTMLInputElement;
      const flatStructureCheckbox = container?.querySelector('#flat-structure') as HTMLInputElement;
      
      if (separateFilesCheckbox) {
        separateFilesCheckbox.addEventListener('change', () => {
          state.separateFiles = separateFilesCheckbox.checked;
          callbacks.onSettingsChange('separateFiles', separateFilesCheckbox.checked);
        });
      }
      
      if (validateReferencesCheckbox) {
        validateReferencesCheckbox.addEventListener('change', () => {
          state.validateReferences = validateReferencesCheckbox.checked;
          callbacks.onSettingsChange('validateReferences', validateReferencesCheckbox.checked);
        });
      }
      
      if (flatStructureCheckbox) {
        flatStructureCheckbox.addEventListener('change', () => {
          state.flatStructure = flatStructureCheckbox.checked;
          callbacks.onSettingsChange('flatStructure', flatStructureCheckbox.checked);
        });
      }
    }
    
    /**
     * Setup action buttons
     */
    function setupActionButtons() {
      const extractBtn = container?.querySelector('.extract-btn');
      const exportBtn = container?.querySelector('.export-btn');
      
      extractBtn?.addEventListener('click', () => {
        callbacks.onExtract();
      });
      
      exportBtn?.addEventListener('click', () => {
        callbacks.onExport();
      });
    }
    
    /**
     * Setup search functionality
     */
    function setupSearch() {
      const searchInput = container?.querySelector('.search-input') as HTMLInputElement;
      if (!searchInput) return;
      
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        // Implement search filtering logic here
        // For now, just log the query
        console.log('Search query:', query);
      });
    }
    
    /**
     * Updates collections data and re-renders the tree
     */
    function updateCollections(newCollections: Collection[]) {
      collections = newCollections;
      renderCollectionsTree();
    }
    
    /**
     * Set reference counts and update UI
     */
    function setReferenceCounts(resolved: number, unresolved: number) {
      referenceStatus.resolved = resolved;
      referenceStatus.unresolved = unresolved;
      
      const referenceCounter = container?.querySelector('.reference-counter');
      if (referenceCounter) {
        referenceCounter.textContent = `${resolved}/${resolved + unresolved} resolved`;
        if (unresolved > 0) {
          referenceCounter.classList.add('has-unresolved');
        } else {
          referenceCounter.classList.remove('has-unresolved');
        }
      }
    }
    
    // Return public interface
    return {
      getState: () => ({ ...state }),
      setState: (newState: Partial<SidebarState>) => {
        // Update state
        Object.assign(state, newState);
        
        // Update UI based on new state
        if (newState.activeSidebarTab) {
          const tab = container?.querySelector(`.sidebar-tab[data-tab="${newState.activeSidebarTab}"]`);
          if (tab) {
            (tab as HTMLElement).click();
          }
        }
        
        if (newState.expandedCollections || newState.selectedCollections) {
          renderCollectionsTree();
        }
        
        if (newState.colorFormat) {
          const colorFormatRadio = container?.querySelector(`#color-${newState.colorFormat}`) as HTMLInputElement;
          if (colorFormatRadio) {
            colorFormatRadio.checked = true;
          }
        }
        
        if (newState.exportFormat) {
          const formatRadio = container?.querySelector(`#format-${newState.exportFormat}`) as HTMLInputElement;
          if (formatRadio) {
            formatRadio.checked = true;
          }
        }
        
        if (newState.separateFiles !== undefined) {
          const separateFilesCheckbox = container?.querySelector('#separate-files') as HTMLInputElement;
          if (separateFilesCheckbox) {
            separateFilesCheckbox.checked = newState.separateFiles;
          }
        }
        
        if (newState.validateReferences !== undefined) {
          const validateReferencesCheckbox = container?.querySelector('#validate-references') as HTMLInputElement;
          if (validateReferencesCheckbox) {
            validateReferencesCheckbox.checked = newState.validateReferences;
          }
        }
        
        if (newState.flatStructure !== undefined) {
          const flatStructureCheckbox = container?.querySelector('#flat-structure') as HTMLInputElement;
          if (flatStructureCheckbox) {
            flatStructureCheckbox.checked = newState.flatStructure;
          }
        }
      },
      setReferenceCounts,
      updateCollections
    };
  }
  
  /**
   * Create empty sidebar interface for when container is not found
   */
  function createEmptySidebarInterface(): SidebarInterface {
    return {
      getState: () => ({
        selectedCollections: [],
        expandedCollections: [],
        selectedModes: new Map(),
        activeSidebarTab: 'collections',
        colorFormat: 'hex',
        exportFormat: 'dtcg',
        separateFiles: true,
        validateReferences: true,
        flatStructure: false
      }),
      setState: () => {},
      setReferenceCounts: () => {},
      updateCollections: () => {}
    };
  }