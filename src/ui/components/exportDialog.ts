/**
 * exportDialog.ts
 * 
 * A user-friendly dialog for selecting which JSON files to export
 * Allows users to choose collections and modes to include in the export
 */

/**
 * Export dialog options interface
 */
export interface ExportDialogOptions {
  tokenData: any;
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
 * Creates and shows the export dialog
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
    <button class="close-button">&times;</button>
  `;
  dialog.appendChild(header);

  // Add dialog content
  const content = document.createElement('div');
  content.className = 'export-dialog-content';
  dialog.appendChild(content);

  // Initialize export options
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

  // Populate collections and modes sections
  const collectionsSection = document.createElement('div');
  collectionsSection.className = 'export-dialog-section';
  collectionsSection.innerHTML = '<h3>Select Collections</h3>';
  content.appendChild(collectionsSection);

  // Create collections list
  const collectionsList = document.createElement('div');
  collectionsList.className = 'export-dialog-list';
  collectionsSection.appendChild(collectionsList);

  // Populate collections
  Object.keys(tokenData).forEach(collectionName => {
    // Initialize collection selection state
    exportOptions.selectedCollections[collectionName] = true;
    exportOptions.selectedModes[collectionName] = {};

    // Create collection item
    const collectionItem = document.createElement('div');
    collectionItem.className = 'export-item collection-item';
    
    // Create collection checkbox and label
    const collectionCheckbox = document.createElement('div');
    collectionCheckbox.className = 'export-checkbox-container';
    collectionCheckbox.innerHTML = `
      <input type="checkbox" id="collection-${collectionName}" checked>
      <label for="collection-${collectionName}" class="export-label">${collectionName}</label>
    `;
    collectionItem.appendChild(collectionCheckbox);

    // Create modes container
    const modesContainer = document.createElement('div');
    modesContainer.className = 'modes-container';
    
    // Add modes for this collection
    const collectionData = tokenData[collectionName];
    Object.keys(collectionData).forEach(modeName => {
      // Initialize mode selection state
      exportOptions.selectedModes[collectionName][modeName] = true;
      
      // Create mode item
      const modeItem = document.createElement('div');
      modeItem.className = 'export-item mode-item';
      modeItem.innerHTML = `
        <div class="export-checkbox-container mode-checkbox">
          <input type="checkbox" id="mode-${collectionName}-${modeName}" checked>
          <label for="mode-${collectionName}-${modeName}" class="export-label">${modeName}</label>
        </div>
      `;
      modesContainer.appendChild(modeItem);

      // Add event listener for mode checkbox
      const modeCheckbox = modeItem.querySelector(`#mode-${collectionName}-${modeName}`) as HTMLInputElement;
      modeCheckbox.addEventListener('change', () => {
        exportOptions.selectedModes[collectionName][modeName] = modeCheckbox.checked;
      });
    });

    // Add modes container to collection item
    collectionItem.appendChild(modesContainer);
    collectionsList.appendChild(collectionItem);

    // Add event listener for collection checkbox
    const checkbox = collectionItem.querySelector(`#collection-${collectionName}`) as HTMLInputElement;
    checkbox.addEventListener('change', () => {
      exportOptions.selectedCollections[collectionName] = checkbox.checked;
      
      // Update all mode checkboxes for this collection
      const modeCheckboxes = modesContainer.querySelectorAll('input[type="checkbox"]');
      modeCheckboxes.forEach(modeCheckbox => {
        (modeCheckbox as HTMLInputElement).disabled = !checkbox.checked;
      });
    });
  });

  // Add global options section
  const optionsSection = document.createElement('div');
  optionsSection.className = 'export-dialog-section';
  optionsSection.innerHTML = `
    <h3>Export Options</h3>
    <div class="export-options">
      <div class="export-option">
        <input type="checkbox" id="include-complete-file" checked>
        <label for="include-complete-file">Include complete file with all tokens</label>
      </div>
      <div class="export-option">
        <input type="checkbox" id="flatten-structure">
        <label for="flatten-structure">Use flat structure (no nested directories)</label>
      </div>
      <div class="export-format-options">
        <h4>Format</h4>
        <div class="export-option">
          <input type="radio" id="format-dtcg" name="format" checked>
          <label for="format-dtcg">Design Token Community Group (DTCG)</label>
        </div>
        <div class="export-option">
          <input type="radio" id="format-legacy" name="format">
          <label for="format-legacy">Legacy Format</label>
        </div>
        <div class="export-option">
          <input type="radio" id="format-style-dictionary" name="format">
          <label for="format-style-dictionary">Style Dictionary</label>
        </div>
      </div>
      
      <!-- Style Dictionary Options (hidden by default) -->
      <div id="style-dictionary-options" class="style-dictionary-options" style="display: none; margin-top: 15px; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
        <h4>Style Dictionary Options</h4>
        
        <div class="sd-option-group">
          <h5>Platforms</h5>
          <div class="export-option">
            <input type="checkbox" id="platform-web" checked>
            <label for="platform-web">Web (CSS, SCSS, JS)</label>
          </div>
          <div class="export-option">
            <input type="checkbox" id="platform-ios">
            <label for="platform-ios">iOS (Swift)</label>
          </div>
          <div class="export-option">
            <input type="checkbox" id="platform-android">
            <label for="platform-android">Android (XML)</label>
          </div>
        </div>
        
        <div class="sd-option-group">
          <h5>Web Formats</h5>
          <div class="export-option">
            <input type="checkbox" id="format-css" checked>
            <label for="format-css">CSS Variables</label>
          </div>
          <div class="export-option">
            <input type="checkbox" id="format-scss" checked>
            <label for="format-scss">SCSS Variables</label>
          </div>
          <div class="export-option">
            <input type="checkbox" id="format-js" checked>
            <label for="format-js">JavaScript</label>
          </div>
          <div class="export-option">
            <input type="checkbox" id="format-json">
            <label for="format-json">JSON</label>
          </div>
        </div>
        
        <div class="sd-option-group">
          <h5>Options</h5>
          <div class="export-option">
            <input type="checkbox" id="use-rem">
            <label for="use-rem">Convert pixel values to REM</label>
          </div>
          <div class="export-option" style="display: flex; align-items: center;">
            <label for="rem-base-size" style="margin-right: 10px;">REM Base Size:</label>
            <input type="number" id="rem-base-size" value="16" min="1" max="32" style="width: 50px;">
          </div>
          <div class="export-option">
            <label for="color-format" style="margin-right: 10px;">Color Format:</label>
            <select id="color-format">
              <option value="hex">HEX</option>
              <option value="rgb">RGB</option>
              <option value="rgba">RGBA</option>
              <option value="hsl">HSL</option>
            </select>
          </div>
          <div class="export-option">
            <input type="checkbox" id="include-documentation" checked>
            <label for="include-documentation">Include Documentation</label>
          </div>
        </div>
      </div>
    </div>
  `;
  content.appendChild(optionsSection);

  // Add event listeners for global options
  const includeCompleteFileCheckbox = optionsSection.querySelector('#include-complete-file') as HTMLInputElement;
  includeCompleteFileCheckbox.addEventListener('change', () => {
    exportOptions.includeCompleteFile = includeCompleteFileCheckbox.checked;
  });

  const flattenStructureCheckbox = optionsSection.querySelector('#flatten-structure') as HTMLInputElement;
  flattenStructureCheckbox.addEventListener('change', () => {
    exportOptions.flattenStructure = flattenStructureCheckbox.checked;
  });

  const formatDtcgRadio = optionsSection.querySelector('#format-dtcg') as HTMLInputElement;
  const formatLegacyRadio = optionsSection.querySelector('#format-legacy') as HTMLInputElement;
  const formatStyleDictionaryRadio = optionsSection.querySelector('#format-style-dictionary') as HTMLInputElement;
  const styleDictionaryOptions = optionsSection.querySelector('#style-dictionary-options') as HTMLDivElement;
  
  // Format selection event listeners
  formatDtcgRadio.addEventListener('change', () => {
    if (formatDtcgRadio.checked) {
      exportOptions.format = 'dtcg';
      styleDictionaryOptions.style.display = 'none';
    }
  });
  
  formatLegacyRadio.addEventListener('change', () => {
    if (formatLegacyRadio.checked) {
      exportOptions.format = 'legacy';
      styleDictionaryOptions.style.display = 'none';
    }
  });
  
  formatStyleDictionaryRadio.addEventListener('change', () => {
    if (formatStyleDictionaryRadio.checked) {
      exportOptions.format = 'style-dictionary';
      styleDictionaryOptions.style.display = 'block';
      updateStyleDictionaryOptions();
    }
  });
  
  // Style Dictionary platform checkboxes
  const platformWeb = optionsSection.querySelector('#platform-web') as HTMLInputElement;
  const platformIOS = optionsSection.querySelector('#platform-ios') as HTMLInputElement;
  const platformAndroid = optionsSection.querySelector('#platform-android') as HTMLInputElement;
  
  // Style Dictionary format checkboxes
  const formatCSS = optionsSection.querySelector('#format-css') as HTMLInputElement;
  const formatSCSS = optionsSection.querySelector('#format-scss') as HTMLInputElement;
  const formatJS = optionsSection.querySelector('#format-js') as HTMLInputElement;
  const formatJSON = optionsSection.querySelector('#format-json') as HTMLInputElement;
  
  // Style Dictionary options
  const useRem = optionsSection.querySelector('#use-rem') as HTMLInputElement;
  const remBaseSize = optionsSection.querySelector('#rem-base-size') as HTMLInputElement;
  const colorFormat = optionsSection.querySelector('#color-format') as HTMLSelectElement;
  const includeDocumentation = optionsSection.querySelector('#include-documentation') as HTMLInputElement;
  
  // Add event listeners for Style Dictionary options
  [platformWeb, platformIOS, platformAndroid, formatCSS, formatSCSS, formatJS, formatJSON, 
   useRem, includeDocumentation].forEach(input => {
    input.addEventListener('change', updateStyleDictionaryOptions);
  });
  
  // Add event listeners for numeric and select inputs
  [remBaseSize, colorFormat].forEach(input => {
    input.addEventListener('change', updateStyleDictionaryOptions);
  });
  
  // Function to update Style Dictionary options in the export options object
  function updateStyleDictionaryOptions() {
    // Get selected platforms
    const platforms: string[] = [];
    if (platformWeb.checked) platforms.push('web');
    if (platformIOS.checked) platforms.push('ios');
    if (platformAndroid.checked) platforms.push('android');
    
    // Get selected formats
    const formats: string[] = [];
    if (formatCSS.checked) formats.push('css');
    if (formatSCSS.checked) formats.push('scss');
    if (formatJS.checked) formats.push('js');
    if (formatJSON.checked) formats.push('json');
    
    // Update Style Dictionary options
    exportOptions.styleDictionary = {
      platforms,
      formats,
      useRem: useRem.checked,
      remBaseFontSize: parseInt(remBaseSize.value, 10) || 16,
      colorFormat: colorFormat.value as 'hex' | 'rgb' | 'rgba' | 'hsl',
      includeDocumentation: includeDocumentation.checked
    };
    
    console.log('Updated Style Dictionary options:', exportOptions.styleDictionary);
  }

  // Add dialog footer with buttons
  const footer = document.createElement('div');
  footer.className = 'export-dialog-footer';
  footer.innerHTML = `
    <button class="secondary-button cancel-button">Cancel</button>
    <button class="primary-button export-button">Export</button>
  `;
  dialog.appendChild(footer);

  // Add event listeners for buttons
  const closeButton = header.querySelector('.close-button');
  const cancelButton = footer.querySelector('.cancel-button');
  const exportButton = footer.querySelector('.export-button');

  // Close dialog on click outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeDialog();
    }
  });

  closeButton?.addEventListener('click', closeDialog);
  cancelButton?.addEventListener('click', closeDialog);
  exportButton?.addEventListener('click', () => {
    // Capture the latest state directly from the form elements
    if (formatLegacyRadio.checked) {
      exportOptions.format = 'legacy';
    } else if (formatStyleDictionaryRadio.checked) {
      exportOptions.format = 'style-dictionary';
      // Make sure Style Dictionary options are up to date
      updateStyleDictionaryOptions();
    } else {
      exportOptions.format = 'dtcg';
    }
    
    exportOptions.flattenStructure = flattenStructureCheckbox.checked;
    exportOptions.includeCompleteFile = includeCompleteFileCheckbox.checked;
    
    // Log the final options before sending
    console.log('Final export options:', {
      format: exportOptions.format,
      flattenStructure: exportOptions.flattenStructure,
      includeCompleteFile: exportOptions.includeCompleteFile,
      selectedCollections: exportOptions.selectedCollections,
      selectedModes: exportOptions.selectedModes,
      styleDictionary: exportOptions.styleDictionary
    });
    
    // Send the options to the handler
    onExport(exportOptions);
    closeDialog();
  });

  // Function to close the dialog
  function closeDialog(): void {
    document.body.removeChild(overlay);
    onCancel();
  }
}