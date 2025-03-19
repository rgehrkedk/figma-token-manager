/**
 * exportDialog.ts
 * 
 * Improved dialog for exporting tokens with a more user-friendly interface
 * Features clear organization, better visual hierarchy, and improved Style Dictionary options
 */

/**
 * Token interfaces for type safety
 */
export interface DTCGToken {
  $value: any;
  $type: string;
  $description?: string;
  $resolvedFrom?: string;
  $originalValue?: any;
  [key: string]: any;
}

export interface TokenGroup {
  [key: string]: DTCGToken | TokenGroup;
}

export interface TokenMode {
  [key: string]: DTCGToken | TokenGroup;
}

export interface TokenCollection {
  [modeName: string]: TokenMode;
}

export interface TokenData {
  [collectionName: string]: TokenCollection;
}

/**
 * Export dialog options interface
 */
export interface ExportDialogOptions {
  tokenData: TokenData;
  onExport: (options: ExportOptions) => void;
  onCancel: () => void;
}

/**
 * Export options interface
 */
export interface ExportOptions {
  selectedCollections: Record<string, boolean>;
  selectedModes: Record<string, Record<string, boolean>>;
  includeCompleteFile: boolean;
  flattenStructure: boolean;
  format: 'dtcg' | 'legacy' | 'style-dictionary';
  styleDictionary?: {
    platforms: string[];
    formats: string[];
    useRem?: boolean;
    remBaseFontSize?: number;
    colorFormat?: 'hex' | 'rgb' | 'rgba' | 'hsl';
    includeDocumentation?: boolean;
  };
}

/**
 * Creates and shows the improved export dialog
 */
export function showExportDialog(options: ExportDialogOptions): void {
  const { tokenData, onExport, onCancel } = options;

  // Create a modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'export-dialog-overlay';
  document.body.appendChild(overlay);

  // Create the dialog container
  const dialog = document.createElement('div');
  dialog.className = 'export-dialog';
  overlay.appendChild(dialog);

  // Add dialog header
  const header = document.createElement('div');
  header.className = 'export-dialog-header';
  header.innerHTML = `
    <h2>Export Tokens</h2>
    <button class="close-button" aria-label="Close">&times;</button>
  `;
  dialog.appendChild(header);

  // Create main content container with tabs
  const contentContainer = document.createElement('div');
  contentContainer.className = 'export-dialog-content-container';
  dialog.appendChild(contentContainer);

  // Create tabs
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'export-dialog-tabs';
  tabsContainer.innerHTML = `
    <button class="export-tab active" data-tab="content">1. Content</button>
    <button class="export-tab" data-tab="format">2. Format</button>
    <button class="export-tab" data-tab="options">3. Options</button>
  `;
  contentContainer.appendChild(tabsContainer);

  // Create content area for tabs
  const content = document.createElement('div');
  content.className = 'export-dialog-content';
  contentContainer.appendChild(content);

  // Initialize export options with defaults
  const exportOptions: ExportOptions = {
    selectedCollections: {},
    selectedModes: {},
    includeCompleteFile: true,
    flattenStructure: false,
    format: 'dtcg',
    styleDictionary: {
      platforms: ['web'],
      formats: ['css', 'scss', 'js'],
      useRem: false,
      remBaseFontSize: 16,
      colorFormat: 'hex',
      includeDocumentation: true
    }
  };

  // Create content for each tab
  const contentTab = createContentTab(tokenData, exportOptions);
  const formatTab = createFormatTab(exportOptions);
  const optionsTab = createOptionsTab(exportOptions);

  // Add tabs to content
  content.appendChild(contentTab);
  content.appendChild(formatTab);
  content.appendChild(optionsTab);

  // Initially show just the content tab
  formatTab.style.display = 'none';
  optionsTab.style.display = 'none';

  // Add dialog footer with buttons
  const footer = document.createElement('div');
  footer.className = 'export-dialog-footer';
  footer.innerHTML = `
    <div class="export-dialog-footer-info">
      <span class="token-count">0 tokens selected</span>
    </div>
    <div class="export-dialog-footer-buttons">
      <button class="secondary-button cancel-button">Cancel</button>
      <button class="secondary-button back-button" style="display: none;">Back</button>
      <button class="primary-button next-button">Next</button>
      <button class="primary-button export-button" style="display: none;">Export</button>
    </div>
  `;
  dialog.appendChild(footer);

  // Get tab elements
  const tabs = Array.from(tabsContainer.querySelectorAll('.export-tab'));
  
  // Get footer buttons
  const backButton = footer.querySelector('.back-button') as HTMLButtonElement;
  const nextButton = footer.querySelector('.next-button') as HTMLButtonElement;
  const exportButton = footer.querySelector('.export-button') as HTMLButtonElement;
  const cancelButton = footer.querySelector('.cancel-button') as HTMLButtonElement;
  const tokenCountElem = footer.querySelector('.token-count') as HTMLSpanElement;

  // Current tab tracking
  let currentTabIndex = 0;
  const tabContents = [contentTab, formatTab, optionsTab];
  const tabIds = ['content', 'format', 'options'];

  // Function to update token count display
  function updateTokenCount() {
    let count = 0;
    
    // Count selected tokens from all selected collections and modes
    Object.entries(exportOptions.selectedCollections).forEach(([collection, isSelected]) => {
      if (isSelected && exportOptions.selectedModes[collection]) {
        Object.entries(exportOptions.selectedModes[collection]).forEach(([mode, isModeSelected]) => {
          if (isModeSelected) {
            const modeData = tokenData[collection][mode];
            // Count the tokens recursively
            count += countTokens(modeData);
          }
        });
      }
    });
    
    tokenCountElem.textContent = `${count} tokens selected`;
  }

  // Function to count tokens in a nested object
  function countTokens(obj: TokenMode | TokenGroup | DTCGToken | null | undefined): number {
    if (!obj || typeof obj !== 'object') return 0;
    
    // Check if this is a DTCG token
    if ('$value' in obj && '$type' in obj) {
      return 1;
    }
    
    let count = 0;
    
    // Count tokens in children
    Object.values(obj).forEach(value => {
      if (value && typeof value === 'object') {
        count += countTokens(value as TokenGroup | DTCGToken);
      }
    });
    
    return count;
  }

  // Function to switch tabs
  function switchTab(index: number) {
    // Hide all tabs
    tabContents.forEach(tab => tab.style.display = 'none');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show the selected tab
    tabContents[index].style.display = 'block';
    tabs[index].classList.add('active');
    
    // Update buttons
    backButton.style.display = index > 0 ? 'block' : 'none';
    nextButton.style.display = index < tabContents.length - 1 ? 'block' : 'none';
    exportButton.style.display = index === tabContents.length - 1 ? 'block' : 'none';
    
    currentTabIndex = index;
  }

  // Set up tab clicking
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      switchTab(index);
    });
  });

  // Set up back button
  backButton.addEventListener('click', () => {
    if (currentTabIndex > 0) {
      switchTab(currentTabIndex - 1);
    }
  });

  // Set up next button
  nextButton.addEventListener('click', () => {
    if (currentTabIndex < tabContents.length - 1) {
      // Validate before proceeding
      if (currentTabIndex === 0) {
        // Check if at least one collection and mode is selected
        const hasSelection = Object.values(exportOptions.selectedCollections).some(selected => selected);
        
        if (!hasSelection) {
          alert('Please select at least one collection to export.');
          return;
        }
      }
      
      switchTab(currentTabIndex + 1);
    }
  });

  // Add event listeners for dialog controls
  const closeButton = header.querySelector('.close-button');
  closeButton?.addEventListener('click', closeDialog);
  cancelButton?.addEventListener('click', closeDialog);
  
  // Export button handler
  exportButton?.addEventListener('click', () => {
    // Perform final validation
    const hasSelection = Object.values(exportOptions.selectedCollections).some(selected => selected);
    
    if (!hasSelection) {
      alert('Please select at least one collection to export.');
      switchTab(0); // Go back to content tab
      return;
    }
    
    // For Style Dictionary format, validate required options
    if (exportOptions.format === 'style-dictionary') {
      const sd = exportOptions.styleDictionary;
      
      if (!sd || sd.platforms.length === 0) {
        alert('Please select at least one platform for Style Dictionary export.');
        switchTab(2); // Go to options tab
        return;
      }
      
      if (sd.formats.length === 0) {
        alert('Please select at least one format for Style Dictionary export.');
        switchTab(2); // Go to options tab
        return;
      }
    }
    
    // All good, proceed with export
    onExport(exportOptions);
    closeDialog();
  });

  // Close dialog on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeDialog();
    }
  });

  // Function to close the dialog
  function closeDialog(): void {
    document.body.removeChild(overlay);
    onCancel();
  }

  // Initial token count update
  updateTokenCount();

  /**
   * Creates the content selection tab
   */
  function createContentTab(tokenData: TokenData, exportOptions: ExportOptions): HTMLElement {
    const container = document.createElement('div');
    container.className = 'export-tab-content';
    container.id = 'content-tab';

    // Add intro text
    const intro = document.createElement('div');
    intro.className = 'export-tab-intro';
    intro.innerHTML = '<p>Select the collections and modes you want to export:</p>';
    container.appendChild(intro);

    // Create collections section
    const collectionsSection = document.createElement('div');
    collectionsSection.className = 'export-dialog-section';
    
    // Create collections list with search
    const collectionsHeader = document.createElement('div');
    collectionsHeader.className = 'section-header-with-controls';
    collectionsHeader.innerHTML = `
      <h3>Collections</h3>
      <div class="header-controls">
        <button class="select-all-button" id="select-all-collections">Select All</button>
        <button class="deselect-all-button" id="deselect-all-collections">Deselect All</button>
      </div>
    `;
    collectionsSection.appendChild(collectionsHeader);
    
    // Add search box
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
      <input type="text" class="search-input" placeholder="Search collections..." id="collection-search">
      <span class="search-icon">🔍</span>
    `;
    collectionsSection.appendChild(searchContainer);

    // Create collections list with a more modern design
    const collectionsList = document.createElement('div');
    collectionsList.className = 'export-selection-list collections-list';
    collectionsSection.appendChild(collectionsList);
    
    // Add collections section to container
    container.appendChild(collectionsSection);

    // Create map to store collection elements for search functionality
    const collectionElements: Map<string, HTMLElement> = new Map();

    // Populate collections
    Object.keys(tokenData).forEach(collectionName => {
      // Initialize collection selection state
      exportOptions.selectedCollections[collectionName] = true;
      exportOptions.selectedModes[collectionName] = {};

      // Create collection card
      const collectionCard = document.createElement('div');
      collectionCard.className = 'selection-card collection-card';
      
      // Store reference for search
      collectionElements.set(collectionName, collectionCard);
      
      // Create header with checkbox
      const cardHeader = document.createElement('div');
      cardHeader.className = 'card-header';
      cardHeader.innerHTML = `
        <div class="card-checkbox-container">
          <input type="checkbox" id="collection-${collectionName}" checked>
          <label for="collection-${collectionName}" class="card-title">${collectionName}</label>
        </div>
        <button class="toggle-button" aria-label="Toggle modes">
          <span class="toggle-icon">▾</span>
        </button>
      `;
      collectionCard.appendChild(cardHeader);

      // Create modes container
      const modesContainer = document.createElement('div');
      modesContainer.className = 'card-content modes-container';
      
      // Add modes counter
      const modeCount = Object.keys(tokenData[collectionName]).length;
      const modesCounter = document.createElement('div');
      modesCounter.className = 'modes-counter';
      modesCounter.textContent = `${modeCount} mode${modeCount !== 1 ? 's' : ''}`;
      modesContainer.appendChild(modesCounter);
      
      // Add modes controls
      const modesControls = document.createElement('div');
      modesControls.className = 'modes-controls';
      modesControls.innerHTML = `
        <button class="select-all-button select-all-modes" data-collection="${collectionName}">Select All</button>
        <button class="deselect-all-button deselect-all-modes" data-collection="${collectionName}">Deselect All</button>
      `;
      modesContainer.appendChild(modesControls);
      
      // Add modes grid
      const modesGrid = document.createElement('div');
      modesGrid.className = 'modes-grid';
      
      // Add modes for this collection
      const collectionData = tokenData[collectionName];
      Object.keys(collectionData).forEach(modeName => {
        // Initialize mode selection state
        exportOptions.selectedModes[collectionName][modeName] = true;
        
        // Create mode item
        const modeItem = document.createElement('div');
        modeItem.className = 'mode-item';
        modeItem.innerHTML = `
          <div class="mode-checkbox-container">
            <input type="checkbox" id="mode-${collectionName}-${modeName}" checked>
            <label for="mode-${collectionName}-${modeName}" class="mode-label">${modeName}</label>
          </div>
        `;
        modesGrid.appendChild(modeItem);

        // Add event listener for mode checkbox
        const modeCheckbox = modeItem.querySelector(`#mode-${collectionName}-${modeName}`) as HTMLInputElement;
        modeCheckbox.addEventListener('change', () => {
          exportOptions.selectedModes[collectionName][modeName] = modeCheckbox.checked;
          updateTokenCount();
        });
      });
      
      // Add modes grid to modes container
      modesContainer.appendChild(modesGrid);
      
      // Add modes container to collection card
      collectionCard.appendChild(modesContainer);
      
      // Add collection card to list
      collectionsList.appendChild(collectionCard);

      // Add event listener for collection checkbox
      const checkbox = cardHeader.querySelector(`#collection-${collectionName}`) as HTMLInputElement;
      checkbox.addEventListener('change', () => {
        exportOptions.selectedCollections[collectionName] = checkbox.checked;
        
        // Update all mode checkboxes for this collection
        const modeCheckboxes = modesContainer.querySelectorAll('input[type="checkbox"]');
        modeCheckboxes.forEach(modeCheckbox => {
          const modeCheckboxElement = modeCheckbox as HTMLInputElement;
          modeCheckboxElement.disabled = !checkbox.checked;
          if (checkbox.checked) {
            // Keep current individual selections when enabling the collection
          } else {
            // When disabling collection, visually uncheck all modes but keep their actual selection state
            modeCheckboxElement.checked = false;
          }
        });
        
        updateTokenCount();
      });
      
      // Add event listener for toggle button
      const toggleButton = cardHeader.querySelector('.toggle-button') as HTMLButtonElement;
      toggleButton.addEventListener('click', () => {
        const expanded = modesContainer.classList.toggle('expanded');
        const toggleIcon = toggleButton.querySelector('.toggle-icon') as HTMLSpanElement;
        toggleIcon.textContent = expanded ? '▾' : '▸';
      });
      
      // Add event listeners for select/deselect all modes
      const selectAllModesBtn = modesControls.querySelector('.select-all-modes') as HTMLButtonElement;
      const deselectAllModesBtn = modesControls.querySelector('.deselect-all-modes') as HTMLButtonElement;
      
      selectAllModesBtn.addEventListener('click', () => {
        const modeCheckboxes = modesGrid.querySelectorAll('input[type="checkbox"]');
        modeCheckboxes.forEach(modeCheckbox => {
          const modeCheckboxElement = modeCheckbox as HTMLInputElement;
          const modeId = modeCheckboxElement.id.replace(`mode-${collectionName}-`, '');
          modeCheckboxElement.checked = true;
          exportOptions.selectedModes[collectionName][modeId] = true;
        });
        updateTokenCount();
      });
      
      deselectAllModesBtn.addEventListener('click', () => {
        const modeCheckboxes = modesGrid.querySelectorAll('input[type="checkbox"]');
        modeCheckboxes.forEach(modeCheckbox => {
          const modeCheckboxElement = modeCheckbox as HTMLInputElement;
          const modeId = modeCheckboxElement.id.replace(`mode-${collectionName}-`, '');
          modeCheckboxElement.checked = false;
          exportOptions.selectedModes[collectionName][modeId] = false;
        });
        updateTokenCount();
      });
    });
    
    // Add event listeners for collection search
    const searchInput = container.querySelector('#collection-search') as HTMLInputElement;
    searchInput.addEventListener('input', () => {
      const searchValue = searchInput.value.toLowerCase();
      
      collectionElements.forEach((element, collectionName) => {
        if (collectionName.toLowerCase().includes(searchValue)) {
          element.style.display = 'block';
        } else {
          element.style.display = 'none';
        }
      });
      
      // Show a message if no results
      if (Array.from(collectionElements.values()).every(el => el.style.display === 'none')) {
        if (!collectionsList.querySelector('.no-results')) {
          const noResults = document.createElement('div');
          noResults.className = 'no-results';
          noResults.textContent = 'No collections match your search.';
          collectionsList.appendChild(noResults);
        }
      } else {
        const noResults = collectionsList.querySelector('.no-results');
        if (noResults) {
          collectionsList.removeChild(noResults);
        }
      }
    });
    
    // Add event listeners for select/deselect all collections
    const selectAllBtn = collectionsHeader.querySelector('#select-all-collections') as HTMLButtonElement;
    const deselectAllBtn = collectionsHeader.querySelector('#deselect-all-collections') as HTMLButtonElement;
    
    selectAllBtn.addEventListener('click', () => {
      const collectionCheckboxes = collectionsList.querySelectorAll('.card-header input[type="checkbox"]');
      collectionCheckboxes.forEach(checkbox => {
        const collectionCheckbox = checkbox as HTMLInputElement;
        collectionCheckbox.checked = true;
        const collectionName = collectionCheckbox.id.replace('collection-', '');
        exportOptions.selectedCollections[collectionName] = true;
        
        // Also enable all mode checkboxes
        const modeCheckboxes = collectionsList.querySelectorAll(`#mode-${collectionName}-`);
        modeCheckboxes.forEach(modeCheckbox => {
          (modeCheckbox as HTMLInputElement).disabled = false;
        });
      });
      updateTokenCount();
    });
    
    deselectAllBtn.addEventListener('click', () => {
      const collectionCheckboxes = collectionsList.querySelectorAll('.card-header input[type="checkbox"]');
      collectionCheckboxes.forEach(checkbox => {
        const collectionCheckbox = checkbox as HTMLInputElement;
        collectionCheckbox.checked = false;
        const collectionName = collectionCheckbox.id.replace('collection-', '');
        exportOptions.selectedCollections[collectionName] = false;
        
        // Also disable all mode checkboxes
        const modeCheckboxes = collectionsList.querySelectorAll(`input[id^="mode-${collectionName}-"]`);
        modeCheckboxes.forEach(modeCheckbox => {
          const modeCheckboxElement = modeCheckbox as HTMLInputElement;
          modeCheckboxElement.disabled = true;
          modeCheckboxElement.checked = false;
        });
      });
      updateTokenCount();
    });
    
    return container;
  }

  /**
   * Creates the format selection tab
   */
  function createFormatTab(exportOptions: ExportOptions): HTMLElement {
    const container = document.createElement('div');
    container.className = 'export-tab-content';
    container.id = 'format-tab';

    // Add intro text
    const intro = document.createElement('div');
    intro.className = 'export-tab-intro';
    intro.innerHTML = `
      <p>Select the format for your exported tokens:</p>
    `;
    container.appendChild(intro);

    // Create formats section
    const formatsSection = document.createElement('div');
    formatsSection.className = 'export-dialog-section';
    formatsSection.innerHTML = `<h3>Export Format</h3>`;
    
    // Create format cards
    const formatCards = document.createElement('div');
    formatCards.className = 'format-cards';
    
    // DTCG Format Card
    const dtcgCard = document.createElement('div');
    dtcgCard.className = 'format-card active';
    dtcgCard.setAttribute('data-format', 'dtcg');
    dtcgCard.innerHTML = `
      <div class="format-card-header">
        <input type="radio" id="format-dtcg" name="format" checked>
        <label for="format-dtcg">Design Token Community Group (DTCG)</label>
      </div>
      <div class="format-card-content">
        <p>The standard format for design tokens with type information and metadata.</p>
        <div class="format-example">
          <pre><code>{
  "color": {
    "primary": {
      "$value": "#0366D6",
      "$type": "color",
      "$description": "Primary brand color"
    }
  }
}</code></pre>
        </div>
        <div class="format-benefits">
          <span class="benefit-tag">✓ Industry Standard</span>
          <span class="benefit-tag">✓ Type Information</span>
          <span class="benefit-tag">✓ Metadata Support</span>
        </div>
      </div>
    `;
    formatCards.appendChild(dtcgCard);
    
    // Legacy Format Card
    const legacyCard = document.createElement('div');
    legacyCard.className = 'format-card';
    legacyCard.setAttribute('data-format', 'legacy');
    legacyCard.innerHTML = `
      <div class="format-card-header">
        <input type="radio" id="format-legacy" name="format">
        <label for="format-legacy">Legacy Format</label>
      </div>
      <div class="format-card-content">
        <p>Simple key-value format without type information or metadata.</p>
        <div class="format-example">
          <pre><code>{
  "color": {
    "primary": "#0366D6"
  }
}</code></pre>
        </div>
        <div class="format-benefits">
          <span class="benefit-tag">✓ Simple Structure</span>
          <span class="benefit-tag">✓ Broad Compatibility</span>
        </div>
      </div>
    `;
    formatCards.appendChild(legacyCard);
    
    // Style Dictionary Format Card
    const sdCard = document.createElement('div');
    sdCard.className = 'format-card';
    sdCard.setAttribute('data-format', 'style-dictionary');
    sdCard.innerHTML = `
      <div class="format-card-header">
        <input type="radio" id="format-style-dictionary" name="format">
        <label for="format-style-dictionary">Style Dictionary</label>
      </div>
      <div class="format-card-content">
        <p>Multi-platform format that generates code for Web, iOS, and Android.</p>
        <div class="format-benefits">
          <span class="benefit-tag">✓ Cross-Platform</span>
          <span class="benefit-tag">✓ Multiple Output Formats</span>
          <span class="benefit-tag">✓ Code Generation</span>
          <span class="benefit-tag">✓ Documentation</span>
        </div>
        <div class="format-note">
          <strong>Note:</strong> Advanced options will be available in the next step.
        </div>
      </div>
    `;
    formatCards.appendChild(sdCard);
    
    formatsSection.appendChild(formatCards);
    container.appendChild(formatsSection);
    
    // Common Export Options
    const commonOptionsSection = document.createElement('div');
    commonOptionsSection.className = 'export-dialog-section';
    commonOptionsSection.innerHTML = `
      <h3>File Structure Options</h3>
      <div class="options-grid">
        <div class="option-card">
          <div class="option-card-header">
            <input type="checkbox" id="include-complete-file" checked>
            <label for="include-complete-file">Include Complete File</label>
          </div>
          <div class="option-card-content">
            <p>Create a single file with all selected tokens.</p>
          </div>
        </div>
        
        <div class="option-card">
          <div class="option-card-header">
            <input type="checkbox" id="flatten-structure">
            <label for="flatten-structure">Flatten File Structure</label>
          </div>
          <div class="option-card-content">
            <p>Export all files to a single directory instead of using nested folders.</p>
          </div>
        </div>
      </div>
    `;
    container.appendChild(commonOptionsSection);
    
    // Add event listeners for format selection
    const formatRadios = container.querySelectorAll('input[name="format"]');
    formatRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        // Update the active card visual state
        formatCards.querySelectorAll('.format-card').forEach(card => {
          card.classList.remove('active');
        });
        
        // Get the selected format
        const selectedRadio = radio as HTMLInputElement;
        if (selectedRadio.checked) {
          const formatCard = selectedRadio.closest('.format-card');
          formatCard?.classList.add('active');
          
          // Update the export options
          const format = formatCard?.getAttribute('data-format') as 'dtcg' | 'legacy' | 'style-dictionary';
          exportOptions.format = format;
        }
      });
    });
    
    // Set initial card selection
    const initialFormat = exportOptions.format;
    const initialCard = formatCards.querySelector(`[data-format="${initialFormat}"]`);
    if (initialCard) {
      initialCard.classList.add('active');
      const radioInput = initialCard.querySelector('input[type="radio"]') as HTMLInputElement;
      radioInput.checked = true;
    }
    
    // Add event listeners for common options
    const includeCompleteFileCheckbox = container.querySelector('#include-complete-file') as HTMLInputElement;
    includeCompleteFileCheckbox.checked = exportOptions.includeCompleteFile;
    includeCompleteFileCheckbox.addEventListener('change', () => {
      exportOptions.includeCompleteFile = includeCompleteFileCheckbox.checked;
    });
    
    const flattenStructureCheckbox = container.querySelector('#flatten-structure') as HTMLInputElement;
    flattenStructureCheckbox.checked = exportOptions.flattenStructure;
    flattenStructureCheckbox.addEventListener('change', () => {
      exportOptions.flattenStructure = flattenStructureCheckbox.checked;
    });
    
    // Add event listeners for format cards (to make the whole card clickable)
    formatCards.querySelectorAll('.format-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on the radio input itself
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        
        // Find and click the radio button
        const radio = card.querySelector('input[type="radio"]') as HTMLInputElement;
        radio.checked = true;
        
        // Manually trigger change event
        const event = new Event('change');
        radio.dispatchEvent(event);
      });
    });
    
    return container;
  }

  /**
   * Creates the options tab (primarily for Style Dictionary options)
   */
  function createOptionsTab(exportOptions: ExportOptions): HTMLElement {
    const container = document.createElement('div');
    container.className = 'export-tab-content';
    container.id = 'options-tab';

    // Style Dictionary Configuration Section
    const sdSection = document.createElement('div');
    sdSection.className = 'export-dialog-section style-dictionary-section';
    sdSection.style.display = exportOptions.format === 'style-dictionary' ? 'block' : 'none';
    
    // Add intro text for Style Dictionary
    const sdIntro = document.createElement('div');
    sdIntro.className = 'export-tab-intro';
    sdIntro.innerHTML = `
      <h3>Style Dictionary Configuration</h3>
      <p>Configure how your tokens will be transformed for different platforms.</p>
    `;
    sdSection.appendChild(sdIntro);
    
    // Platform selection
    const platformsSection = document.createElement('div');
    platformsSection.className = 'options-subsection';
    platformsSection.innerHTML = `
      <div class="section-header-with-controls">
        <h4>Platforms</h4>
        <p class="section-description">Select the platforms you want to generate code for.</p>
      </div>
      
      <div class="platforms-grid">
        <div class="platform-card ${exportOptions.styleDictionary?.platforms.includes('web') ? 'active' : ''}" data-platform="web">
          <div class="platform-card-header">
            <input type="checkbox" id="platform-web" ${exportOptions.styleDictionary?.platforms.includes('web') ? 'checked' : ''}>
            <label for="platform-web">Web</label>
          </div>
          <div class="platform-card-content">
            <div class="platform-icon">🌐</div>
            <p>CSS, SCSS, JavaScript</p>
          </div>
        </div>
        
        <div class="platform-card ${exportOptions.styleDictionary?.platforms.includes('ios') ? 'active' : ''}" data-platform="ios">
          <div class="platform-card-header">
            <input type="checkbox" id="platform-ios" ${exportOptions.styleDictionary?.platforms.includes('ios') ? 'checked' : ''}>
            <label for="platform-ios">iOS</label>
          </div>
          <div class="platform-card-content">
            <div class="platform-icon">📱</div>
            <p>Swift Code</p>
          </div>
        </div>
        
        <div class="platform-card ${exportOptions.styleDictionary?.platforms.includes('android') ? 'active' : ''}" data-platform="android">
          <div class="platform-card-header">
            <input type="checkbox" id="platform-android" ${exportOptions.styleDictionary?.platforms.includes('android') ? 'checked' : ''}>
            <label for="platform-android">Android</label>
          </div>
          <div class="platform-card-content">
            <div class="platform-icon">🤖</div>
            <p>XML Resources</p>
          </div>
        </div>
      </div>
    `;
    sdSection.appendChild(platformsSection);
    
    // Format selection section (conditionally shown based on selected platforms)
    const formatsSectionWeb = document.createElement('div');
    formatsSectionWeb.className = 'options-subsection web-formats-section';
    formatsSectionWeb.style.display = exportOptions.styleDictionary?.platforms.includes('web') ? 'block' : 'none';
    formatsSectionWeb.innerHTML = `
      <div class="section-header-with-controls">
        <h4>Web Formats</h4>
        <p class="section-description">Select the output formats for web platform.</p>
      </div>
      
      <div class="formats-grid">
        <div class="format-option ${exportOptions.styleDictionary?.formats.includes('css') ? 'active' : ''}" data-format="css">
          <input type="checkbox" id="format-css" ${exportOptions.styleDictionary?.formats.includes('css') ? 'checked' : ''}>
          <label for="format-css">
            <span class="format-name">CSS</span>
            <span class="format-description">CSS Custom Properties (Variables)</span>
          </label>
        </div>
        
        <div class="format-option ${exportOptions.styleDictionary?.formats.includes('scss') ? 'active' : ''}" data-format="scss">
          <input type="checkbox" id="format-scss" ${exportOptions.styleDictionary?.formats.includes('scss') ? 'checked' : ''}>
          <label for="format-scss">
            <span class="format-name">SCSS</span>
            <span class="format-description">SASS/SCSS Variables</span>
          </label>
        </div>
        
        <div class="format-option ${exportOptions.styleDictionary?.formats.includes('js') ? 'active' : ''}" data-format="js">
          <input type="checkbox" id="format-js" ${exportOptions.styleDictionary?.formats.includes('js') ? 'checked' : ''}>
          <label for="format-js">
            <span class="format-name">JavaScript</span>
            <span class="format-description">JavaScript Module</span>
          </label>
        </div>
        
        <div class="format-option ${exportOptions.styleDictionary?.formats.includes('json') ? 'active' : ''}" data-format="json">
          <input type="checkbox" id="format-json" ${exportOptions.styleDictionary?.formats.includes('json') ? 'checked' : ''}>
          <label for="format-json">
            <span class="format-name">JSON</span>
            <span class="format-description">JSON Data Format</span>
          </label>
        </div>
      </div>
    `;
    sdSection.appendChild(formatsSectionWeb);
    
    // Transformation options section
    const transformationSection = document.createElement('div');
    transformationSection.className = 'options-subsection';
    transformationSection.innerHTML = `
      <div class="section-header-with-controls">
        <h4>Transformation Options</h4>
        <p class="section-description">Configure how token values will be transformed.</p>
      </div>
      
      <div class="transformations-grid">
        <div class="transformation-group">
          <h5>Dimensions</h5>
          <div class="transformation-option">
            <input type="checkbox" id="use-rem" ${exportOptions.styleDictionary?.useRem ? 'checked' : ''}>
            <label for="use-rem">Convert pixel values to REM</label>
          </div>
          
          <div class="transformation-option rem-base-container" ${exportOptions.styleDictionary?.useRem ? '' : 'style="opacity: 0.5"'}>
            <label for="rem-base-size">REM Base Size:</label>
            <div class="number-input-container">
              <input type="number" id="rem-base-size" min="1" max="32" value="${exportOptions.styleDictionary?.remBaseFontSize || 16}" ${exportOptions.styleDictionary?.useRem ? '' : 'disabled'}>
              <span class="unit">px</span>
            </div>
          </div>
        </div>
        
        <div class="transformation-group">
          <h5>Colors</h5>
          <div class="transformation-option">
            <label for="color-format">Color Format:</label>
            <select id="color-format">
              <option value="hex" ${exportOptions.styleDictionary?.colorFormat === 'hex' ? 'selected' : ''}>HEX</option>
              <option value="rgb" ${exportOptions.styleDictionary?.colorFormat === 'rgb' ? 'selected' : ''}>RGB</option>
              <option value="rgba" ${exportOptions.styleDictionary?.colorFormat === 'rgba' ? 'selected' : ''}>RGBA</option>
              <option value="hsl" ${exportOptions.styleDictionary?.colorFormat === 'hsl' ? 'selected' : ''}>HSL</option>
            </select>
          </div>
        </div>
        
        <div class="transformation-group">
          <h5>Documentation</h5>
          <div class="transformation-option">
            <input type="checkbox" id="include-documentation" ${exportOptions.styleDictionary?.includeDocumentation ? 'checked' : ''}>
            <label for="include-documentation">Generate Documentation</label>
            <p class="option-description">Includes both HTML and Markdown documentation with usage examples</p>
          </div>
        </div>
      </div>
    `;
    sdSection.appendChild(transformationSection);
    
    // Add the Style Dictionary section to the container
    container.appendChild(sdSection);
    
    // Add default content for non-Style-Dictionary formats
    const defaultContent = document.createElement('div');
    defaultContent.className = 'export-tab-content default-options-content';
    defaultContent.style.display = exportOptions.format !== 'style-dictionary' ? 'flex' : 'none';
    defaultContent.innerHTML = `
      <div class="no-options-message">
        <div class="message-icon">ℹ️</div>
        <h3>No Additional Options</h3>
        <p>The selected format doesn't have any additional configuration options.</p>
        <p>Click the "Export" button to proceed with the export.</p>
      </div>
    `;
    container.appendChild(defaultContent);
    
    // Add event listeners for platform selection
    const platformCards = platformsSection.querySelectorAll('.platform-card');
    platformCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on the checkbox itself
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        
        // Find and toggle the checkbox
        const checkbox = card.querySelector('input[type="checkbox"]') as HTMLInputElement;
        checkbox.checked = !checkbox.checked;
        
        // Manually trigger change event
        const event = new Event('change');
        checkbox.dispatchEvent(event);
      });
      
      // Add event listener for the checkbox
      const checkbox = card.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.addEventListener('change', () => {
        // Update card visual state
        card.classList.toggle('active', checkbox.checked);
        
        // Update the export options
        const platform = card.getAttribute('data-platform');
        if (platform) {
          const currentPlatforms = exportOptions.styleDictionary?.platforms || [];
          
          if (checkbox.checked && !currentPlatforms.includes(platform)) {
            // Add platform
            exportOptions.styleDictionary = {
              ...exportOptions.styleDictionary,
              platforms: [...currentPlatforms, platform]
            };
          } else if (!checkbox.checked && currentPlatforms.includes(platform)) {
            // Remove platform
            exportOptions.styleDictionary = {
              ...exportOptions.styleDictionary,
              platforms: currentPlatforms.filter(p => p !== platform)
            };
          }
          
          // Show/hide format section based on web platform selection
          if (platform === 'web') {
            formatsSectionWeb.style.display = checkbox.checked ? 'block' : 'none';
          }
        }
      });
    });
    
    // Add event listeners for format options
    const formatOptions = formatsSectionWeb.querySelectorAll('.format-option');
    formatOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        // Don't trigger if clicking on the checkbox itself
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        
        // Find and toggle the checkbox
        const checkbox = option.querySelector('input[type="checkbox"]') as HTMLInputElement;
        checkbox.checked = !checkbox.checked;
        
        // Manually trigger change event
        const event = new Event('change');
        checkbox.dispatchEvent(event);
      });
      
      // Add event listener for the checkbox
      const checkbox = option.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.addEventListener('change', () => {
        // Update option visual state
        option.classList.toggle('active', checkbox.checked);
        
        // Update the export options
        const format = option.getAttribute('data-format');
        if (format) {
          const currentFormats = exportOptions.styleDictionary?.formats || [];
          
          if (checkbox.checked && !currentFormats.includes(format)) {
            // Add format
            exportOptions.styleDictionary = {
              ...exportOptions.styleDictionary,
              formats: [...currentFormats, format]
            };
          } else if (!checkbox.checked && currentFormats.includes(format)) {
            // Remove format
            exportOptions.styleDictionary = {
              ...exportOptions.styleDictionary,
              formats: currentFormats.filter(f => f !== format)
            };
          }
        }
      });
    });
    
    // Add event listeners for transformation options
    const useRemCheckbox = transformationSection.querySelector('#use-rem') as HTMLInputElement;
    const remBaseSizeInput = transformationSection.querySelector('#rem-base-size') as HTMLInputElement;
    const remBaseContainer = transformationSection.querySelector('.rem-base-container') as HTMLDivElement;
    
    useRemCheckbox.addEventListener('change', () => {
      // Update the export options
      exportOptions.styleDictionary = {
        ...exportOptions.styleDictionary,
        useRem: useRemCheckbox.checked
      };
      
      // Enable/disable and update visual state of the rem base size input
      remBaseSizeInput.disabled = !useRemCheckbox.checked;
      remBaseContainer.style.opacity = useRemCheckbox.checked ? '1' : '0.5';
    });
    
    remBaseSizeInput.addEventListener('change', () => {
      // Update the export options
      exportOptions.styleDictionary = {
        ...exportOptions.styleDictionary,
        remBaseFontSize: parseInt(remBaseSizeInput.value, 10) || 16
      };
    });
    
    const colorFormatSelect = transformationSection.querySelector('#color-format') as HTMLSelectElement;
    colorFormatSelect.addEventListener('change', () => {
      // Update the export options
      exportOptions.styleDictionary = {
        ...exportOptions.styleDictionary,
        colorFormat: colorFormatSelect.value as 'hex' | 'rgb' | 'rgba' | 'hsl'
      };
    });
    
    const includeDocumentationCheckbox = transformationSection.querySelector('#include-documentation') as HTMLInputElement;
    includeDocumentationCheckbox.addEventListener('change', () => {
      // Update the export options
      exportOptions.styleDictionary = {
        ...exportOptions.styleDictionary,
        includeDocumentation: includeDocumentationCheckbox.checked
      };
    });
    
    // Event listener for format change to show/hide appropriate options
    // This will be connected from the main code
    function updateOptionsVisibility() {
      // Show/hide sections based on the selected format
      if (exportOptions.format === 'style-dictionary') {
        sdSection.style.display = 'block';
        defaultContent.style.display = 'none';
      } else {
        sdSection.style.display = 'none';
        defaultContent.style.display = 'flex';
      }
    }
    
    // Add the updateOptionsVisibility function to the container for external access
    (container as any).updateOptionsVisibility = updateOptionsVisibility;
    
    return container;
  }

  // Connect events between tabs
  
  // Format tab change should update options tab visibility
  const radioButtons = formatTab.querySelectorAll('input[name="format"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      // Get the options tab's visibility updater
      const optionsTabContent = optionsTab as any;
      if (optionsTabContent.updateOptionsVisibility) {
        optionsTabContent.updateOptionsVisibility();
      }
    });
  });
}