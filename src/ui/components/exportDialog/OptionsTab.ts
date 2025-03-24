/**
 * OptionsTab.ts - Splitting into TransformsTab.ts and PlatformTab.ts
 */

import { ExportOptions } from './types';

/**
 * Component for the transforms tab
 */
export function createTransformsTab(exportOptions: ExportOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ftm-export-tab-content';
  container.id = 'transforms-tab'; // This now matches the data-tab attribute 'transforms' in DialogTabs.ts

  // Add intro text
  const intro = document.createElement('div');
  intro.className = 'ftm-export-tab-intro';
  intro.innerHTML = `
    <p>Configure value transformations for your tokens:</p>
  `;
  container.appendChild(intro);

  // Create transformations section
  const transformsSection = document.createElement('div');
  transformsSection.className = 'ftm-export-dialog-section';
  transformsSection.innerHTML = `<h3>Token Transformations</h3>`;
  
  // Transformation options grid
  const transformationsGrid = document.createElement('div');
  transformationsGrid.className = 'ftm-export-transformations-grid';
  
  // Dimensions transformation group
  const dimensionsGroup = document.createElement('div');
  dimensionsGroup.className = 'ftm-export-transformation-group';
  dimensionsGroup.innerHTML = `
    <h5>Dimensions</h5>
    <div class="ftm-export-transformation-option">
      <input type="checkbox" id="use-rem" ${exportOptions.styleDictionary?.useRem ? 'checked' : ''}>
      <label for="use-rem">Convert px to REM</label>
    </div>
    
    <div class="ftm-export-transformation-option rem-base-container" ${exportOptions.styleDictionary?.useRem ? '' : 'style="opacity: 0.5"'}>
      <label for="rem-base-size">REM Base Size:</label>
      <div class="ftm-export-number-input-container">
        <input type="number" id="rem-base-size" min="1" max="32" value="${exportOptions.styleDictionary?.remBaseFontSize || 16}" ${exportOptions.styleDictionary?.useRem ? '' : 'disabled'}>
        <span class="ftm-export-unit">px</span>
      </div>
    </div>
  `;
  transformationsGrid.appendChild(dimensionsGroup);

  // Colors transformation group
  const colorsGroup = document.createElement('div');
  colorsGroup.className = 'ftm-export-transformation-group';
  colorsGroup.innerHTML = `
    <h5>Colors</h5>
    <div class="ftm-export-transformation-option">
      <label for="color-format">Color Format:</label>
      <select id="color-format" class="ftm-export-select">
        <option value="hex" ${exportOptions.styleDictionary?.colorFormat === 'hex' ? 'selected' : ''}>HEX</option>
        <option value="rgb" ${exportOptions.styleDictionary?.colorFormat === 'rgb' ? 'selected' : ''}>RGB</option>
        <option value="rgba" ${exportOptions.styleDictionary?.colorFormat === 'rgba' ? 'selected' : ''}>RGBA</option>
        <option value="hsl" ${exportOptions.styleDictionary?.colorFormat === 'hsl' ? 'selected' : ''}>HSL</option>
      </select>
    </div>
  `;
  transformationsGrid.appendChild(colorsGroup);
  
  transformsSection.appendChild(transformationsGrid);
  container.appendChild(transformsSection);

  // Create platforms section
  const platformsSection = document.createElement('div');
  platformsSection.className = 'ftm-export-dialog-section';
  platformsSection.innerHTML = `<h3>Platform Outputs</h3>`;
  
  // Platforms grid
  const platformsGrid = document.createElement('div');
  platformsGrid.className = 'ftm-export-platforms-grid';
  
  // Web platform card
  const webOutputs = createPlatformCard(
    'web',
    'Web',
    '🌐',
    'CSS, SCSS, JavaScript',
    true, // Web is always selected
    exportOptions
  );
  platformsGrid.appendChild(webOutputs);
  
  // iOS platform card
  const iOSOutputs = createPlatformCard(
    'ios',
    'React Native',
    '📱',
    'Swift',
    exportOptions.styleDictionary?.platforms?.includes('ios') || false,
    exportOptions
  );
  platformsGrid.appendChild(iOSOutputs);
  
  // Android platform card
  const androidOutputs = createPlatformCard(
    'android',
    'Android',
    '🤖',
    'XML',
    exportOptions.styleDictionary?.platforms?.includes('android') || false,
    exportOptions
  );
  platformsGrid.appendChild(androidOutputs);

  platformsSection.appendChild(platformsGrid);
  container.appendChild(platformsSection);

  // Web output formats section - initially hidden, will show when Web is selected
  const webFormatsSection = document.createElement('div');
  webFormatsSection.className = 'ftm-export-dialog-section web-formats-section';
  webFormatsSection.style.display = 'block'; // Web is always selected by default
  webFormatsSection.innerHTML = `
    <h3>Web Output Formats</h3>
    <div class="ftm-export-formats-grid web-formats-section">
      <div class="ftm-export-format-option ${exportOptions.styleDictionary?.formats?.includes('css') ? 'active' : ''}" data-format="css">
        <input type="checkbox" id="format-css" ${exportOptions.styleDictionary?.formats?.includes('css') ? 'checked' : ''}>
        <label for="format-css">
          <span class="ftm-export-format-name">CSS</span>
          <span class="ftm-export-format-description">CSS Custom Properties</span>
        </label>
      </div>
      
      <div class="ftm-export-format-option ${exportOptions.styleDictionary?.formats?.includes('scss') ? 'active' : ''}" data-format="scss">
        <input type="checkbox" id="format-scss" ${exportOptions.styleDictionary?.formats?.includes('scss') ? 'checked' : ''}>
        <label for="format-scss">
          <span class="ftm-export-format-name">SCSS</span>
          <span class="ftm-export-format-description">SASS/SCSS Variables</span>
        </label>
      </div>
      
      <div class="ftm-export-format-option ${exportOptions.styleDictionary?.formats?.includes('js') ? 'active' : ''}" data-format="js">
        <input type="checkbox" id="format-js" ${exportOptions.styleDictionary?.formats?.includes('js') ? 'checked' : ''}>
        <label for="format-js">
          <span class="ftm-export-format-name">JavaScript</span>
          <span class="ftm-export-format-description">JS Module</span>
        </label>
      </div>
    </div>
  `;
  container.appendChild(webFormatsSection);

  // Documentation section
  const documentationSection = document.createElement('div');
  documentationSection.className = 'ftm-export-dialog-section';
  documentationSection.innerHTML = `
    <h3>Documentation</h3>
    <div class="ftm-export-options-grid">
      <div class="ftm-export-option-card">
        <div class="ftm-export-option-card-header">
          <input type="checkbox" id="include-documentation" ${exportOptions.styleDictionary?.includeDocumentation ? 'checked' : ''}>
          <label for="include-documentation">Include implementation documentation</label>
        </div>
        <div class="ftm-export-option-card-content">
          <p>Generate documentation with implementation examples and usage guidelines.</p>
        </div>
      </div>
    </div>
  `;
  container.appendChild(documentationSection);

  // Setup event listeners
  const useRemCheckbox = container.querySelector('#use-rem') as HTMLInputElement;
  const remBaseSizeInput = container.querySelector('#rem-base-size') as HTMLInputElement;
  const remBaseContainer = container.querySelector('.rem-base-container') as HTMLDivElement;
  
  useRemCheckbox.addEventListener('change', () => {
    // Ensure styleDictionary object exists
    if (!exportOptions.styleDictionary) {
      exportOptions.styleDictionary = {
        platforms: ['web'],
        formats: ['css', 'scss', 'js'],
        remBaseFontSize: 16,
        colorFormat: 'hex'
      };
    }
    
    // Update the export options
    exportOptions.styleDictionary.useRem = useRemCheckbox.checked;
    
    // Enable/disable and update visual state of the rem base size input
    remBaseSizeInput.disabled = !useRemCheckbox.checked;
    remBaseContainer.style.opacity = useRemCheckbox.checked ? '1' : '0.5';
  });
  
  remBaseSizeInput.addEventListener('change', () => {
    // Ensure styleDictionary object exists
    if (!exportOptions.styleDictionary) {
      exportOptions.styleDictionary = {
        platforms: ['web'],
        formats: ['css', 'scss', 'js'],
        useRem: true,
        colorFormat: 'hex'
      };
    }
    
    // Update the export options
    exportOptions.styleDictionary.remBaseFontSize = parseInt(remBaseSizeInput.value, 10) || 16;
  });
  
  const colorFormatSelect = container.querySelector('#color-format') as HTMLSelectElement;
  colorFormatSelect.addEventListener('change', () => {
    // Ensure styleDictionary object exists
    if (!exportOptions.styleDictionary) {
      exportOptions.styleDictionary = {
        platforms: ['web'],
        formats: ['css', 'scss', 'js'],
        useRem: false,
        remBaseFontSize: 16
      };
    }
    
    // Update the export options
    exportOptions.styleDictionary.colorFormat = colorFormatSelect.value as 'hex' | 'rgb' | 'rgba' | 'hsl';
  });

  // Setup event listeners for web formats
  const formatOptions = container.querySelectorAll('.ftm-export-format-option');
  formatOptions.forEach(option => {
    setupFormatOptionEventListeners(option, exportOptions);
  });

  // Get the Web platform card checkbox to control the Web formats section visibility
  const webCheckbox = container.querySelector('#platform-web') as HTMLInputElement;
  webCheckbox.addEventListener('change', () => {
    webFormatsSection.style.display = webCheckbox.checked ? 'block' : 'none';
  });

  // Setup event listener for documentation
  const docCheckbox = container.querySelector('#include-documentation') as HTMLInputElement;
  docCheckbox.addEventListener('change', () => {
    // Ensure styleDictionary object exists
    if (!exportOptions.styleDictionary) {
      exportOptions.styleDictionary = {
        platforms: ['web'],
        formats: ['css', 'scss', 'js'],
        useRem: false,
        remBaseFontSize: 16,
        colorFormat: 'hex'
      };
    }
    
    // Update the export options
    exportOptions.styleDictionary.includeDocumentation = docCheckbox.checked;
  });

  return container;
}

// The createPlatformTab function has been merged into createTransformsTab
// Keeping this export for backward compatibility with existing code
export function createPlatformTab(exportOptions: ExportOptions): HTMLElement {
  // Return a plain container with a note that this has been merged into the Transforms tab
  const container = document.createElement('div');
  container.className = 'ftm-export-tab-content';
  container.id = 'platform-tab';
  
  container.innerHTML = `
    <div class="ftm-export-tab-intro">
      <p>Platform configuration is now part of the Transforms tab.</p>
    </div>
  `;
  
  return container;
}

/**
 * Helper function to create a platform card
 */
function createPlatformCard(
  platform: string,
  name: string,
  icon: string,
  description: string,
  isSelected: boolean,
  exportOptions: ExportOptions
): HTMLElement {
  const card = document.createElement('div');
  card.className = `ftm-export-platform-card ${isSelected ? 'active' : ''}`;
  card.setAttribute('data-platform', platform);
  
  const cardHeader = document.createElement('div');
  cardHeader.className = 'ftm-export-platform-card-header';
  cardHeader.innerHTML = `
    <input type="checkbox" id="platform-${platform}" ${isSelected ? 'checked' : ''}>
    <label for="platform-${platform}">${name}</label>
  `;
  
  const cardContent = document.createElement('div');
  cardContent.className = 'ftm-export-platform-card-content';
  cardContent.innerHTML = `
    <div class="ftm-export-platform-icon">${icon}</div>
    <p>${description}</p>
  `;
  
  card.appendChild(cardHeader);
  card.appendChild(cardContent);
  
  // Setup event listeners
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
  
  const checkbox = card.querySelector('input[type="checkbox"]') as HTMLInputElement;
  checkbox.addEventListener('change', () => {
    // Update card visual state
    card.classList.toggle('active', checkbox.checked);
    
    // Ensure styleDictionary object exists
    if (!exportOptions.styleDictionary) {
      exportOptions.styleDictionary = {
        platforms: [],
        formats: ['css', 'scss', 'js'],
        useRem: false,
        remBaseFontSize: 16,
        colorFormat: 'hex'
      };
    }
    
    // Update the export options
    const currentPlatforms = exportOptions.styleDictionary.platforms || [];
    
    if (checkbox.checked && !currentPlatforms.includes(platform)) {
      // Add platform
      exportOptions.styleDictionary.platforms = [...currentPlatforms, platform];
    } else if (!checkbox.checked && currentPlatforms.includes(platform)) {
      // Remove platform
      exportOptions.styleDictionary.platforms = currentPlatforms.filter(p => p !== platform);
    }
  });
  
  return card;
}

/**
 * Setup event listeners for format options
 */
function setupFormatOptionEventListeners(option: Element, exportOptions: ExportOptions): void {
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
    
    // Ensure styleDictionary object exists
    if (!exportOptions.styleDictionary) {
      exportOptions.styleDictionary = {
        platforms: ['web'],
        formats: [],
        useRem: false,
        remBaseFontSize: 16,
        colorFormat: 'hex'
      };
    }
    
    // Update the export options
    const format = option.getAttribute('data-format');
    if (format) {
      const currentFormats = exportOptions.styleDictionary.formats || [];
      
      if (checkbox.checked && !currentFormats.includes(format)) {
        // Add format
        exportOptions.styleDictionary.formats = [...currentFormats, format];
      } else if (!checkbox.checked && currentFormats.includes(format)) {
        // Remove format
        exportOptions.styleDictionary.formats = currentFormats.filter(f => f !== format);
      }
    }
  });
}