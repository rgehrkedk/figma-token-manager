/**
 * FormatTab.ts
 * 
 * Renamed to ConfigTab.ts - Component for configuration settings
 */

import { ExportOptions } from './types';

export function createFormatTab(exportOptions: ExportOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ftm-export-tab-content';
  container.id = 'config-tab'; // This now matches the data-tab attribute 'config' in DialogTabs.ts

  // Add intro text
  const intro = document.createElement('div');
  intro.className = 'ftm-export-tab-intro';
  intro.innerHTML = `
    <p>Configure how your tokens will be exported:</p>
  `;
  container.appendChild(intro);

  // Create formats section
  const formatsSection = document.createElement('div');
  formatsSection.className = 'ftm-export-dialog-section';
  formatsSection.innerHTML = `<h3>Export Format</h3>`;
  
  // Create format cards
  const formatCards = document.createElement('div');
  formatCards.className = 'ftm-export-format-cards';
  
  // DTCG Format Card
  const dtcgCard = createFormatCard(
    'dtcg', 
    'Design Token Community Group (DTCG)', 
    'The standard format for design tokens with type information and metadata.',
    `{
  "color": {
    "primary": {
      "$value": "#0366D6",
      "$type": "color",
      "$description": "Primary brand color"
    }
  }
}`,
    ['Industry Standard', 'Type Information', 'Metadata Support']
  );
  formatCards.appendChild(dtcgCard);
  
  // Legacy Format Card
  const legacyCard = createFormatCard(
    'legacy', 
    'Legacy Format', 
    'Simple key-value format without type information or metadata.',
    `{
  "color": {
    "primary": "#0366D6"
  }
}`,
    ['Simple Structure', 'Broad Compatibility']
  );
  formatCards.appendChild(legacyCard);
  
  formatsSection.appendChild(formatCards);
  container.appendChild(formatsSection);
  
  // File structure options section
  const fileStructureSection = document.createElement('div');
  fileStructureSection.className = 'ftm-export-dialog-section';
  fileStructureSection.innerHTML = `
    <h3>File Structure Options</h3>
    <div class="ftm-export-options-grid">
      <div class="ftm-export-option-card">
        <div class="ftm-export-option-card-header">
          <input type="checkbox" id="flatten-structure" ${exportOptions.flattenStructure ? 'checked' : ''}>
          <label for="flatten-structure">Flatten JSON</label>
        </div>
        <div class="ftm-export-option-card-content">
          <p>Use flat key structure instead of nested objects.</p>
        </div>
      </div>
      
      <div class="ftm-export-option-card">
        <div class="ftm-export-option-card-header">
          <input type="checkbox" id="include-complete-file" ${exportOptions.includeCompleteFile ? 'checked' : ''}>
          <label for="include-complete-file">Combine all collections/modes</label>
        </div>
        <div class="ftm-export-option-card-content">
          <p>Create a single file with all selected collections and modes.</p>
        </div>
      </div>
    </div>
  `;
  container.appendChild(fileStructureSection);
  
  // Add event listeners for format selection
  const formatRadios = container.querySelectorAll('input[name="format"]');
  formatRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      // Update the active card visual state
      formatCards.querySelectorAll('.ftm-export-format-card').forEach(card => {
        card.classList.remove('active');
      });
      
      // Get the selected format
      const selectedRadio = radio as HTMLInputElement;
      if (selectedRadio.checked) {
        const formatCard = selectedRadio.closest('.ftm-export-format-card');
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
  
  // Add event listeners for format cards (to make the whole card clickable)
  formatCards.querySelectorAll('.ftm-export-format-card').forEach(card => {
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

  // Set up file structure option event listeners
  const flattenCheckbox = container.querySelector('#flatten-structure') as HTMLInputElement;
  flattenCheckbox.addEventListener('change', () => {
    exportOptions.flattenStructure = flattenCheckbox.checked;
  });

  const includeCompleteFileCheckbox = container.querySelector('#include-complete-file') as HTMLInputElement;
  includeCompleteFileCheckbox.addEventListener('change', () => {
    exportOptions.includeCompleteFile = includeCompleteFileCheckbox.checked;
  });
  
  return container;
}

/**
 * Helper function to create a format card
 */
function createFormatCard(
  formatId: string, 
  formatName: string, 
  description: string, 
  example: string = '',
  benefits: string[] = []
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'ftm-export-format-card';
  card.setAttribute('data-format', formatId);
  
  const cardHeader = document.createElement('div');
  cardHeader.className = 'ftm-export-format-card-header';
  cardHeader.innerHTML = `
    <input type="radio" id="format-${formatId}" name="format">
    <label for="format-${formatId}">${formatName}</label>
  `;
  
  const cardContent = document.createElement('div');
  cardContent.className = 'ftm-export-format-card-content';
  
  let contentHTML = `<p>${description}</p>`;
  
  // Add example if provided
  if (example) {
    contentHTML += `
      <div class="ftm-export-format-example">
        <pre><code>${example}</code></pre>
      </div>
    `;
  }
  
  // Add benefits
  if (benefits.length > 0) {
    contentHTML += '<div class="ftm-export-format-benefits">';
    benefits.forEach(benefit => {
      contentHTML += `<span class="ftm-export-benefit-tag">✓ ${benefit}</span>`;
    });
    contentHTML += '</div>';
  }
  
  cardContent.innerHTML = contentHTML;
  
  card.appendChild(cardHeader);
  card.appendChild(cardContent);
  
  return card;
}