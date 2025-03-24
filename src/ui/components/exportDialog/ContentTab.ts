/**
 * ContentTab.ts
 * 
 * Component for the content selection tab (collections and modes)
 */

import { ExportOptions, TokenData } from './types';
import { createSearchComponent } from './ui/SearchComponent';

export function createContentTab(
  tokenData: TokenData, 
  exportOptions: ExportOptions,
  updateTokenCount: () => number
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ftm-export-tab-content';
  container.id = 'content-tab';

  // Add intro text
  const intro = document.createElement('div');
  intro.className = 'ftm-export-tab-intro';
  intro.innerHTML = '<p>Select the collections and modes you want to export:</p>';
  container.appendChild(intro);

  // Create collections section
  const collectionsSection = document.createElement('div');
  collectionsSection.className = 'ftm-export-dialog-section';
  
  // Create collections list with search
  const collectionsHeader = document.createElement('div');
  collectionsHeader.className = 'ftm-section-header-with-controls';
  collectionsHeader.innerHTML = `
    <h3>Collections</h3>
    <div class="ftm-header-controls">
      <button class="ftm-export-select-all-button" id="select-all-collections">All</button>
      <button class="ftm-export-deselect-all-button" id="deselect-all-collections">None</button>
    </div>
  `;
  collectionsSection.appendChild(collectionsHeader);
  
  // Add search box
  const { searchContainer, searchInput } = createSearchComponent('collection-search', 'Search collections...');
  collectionsSection.appendChild(searchContainer);

  // Create collections list with a more modern design
  const collectionsList = document.createElement('div');
  collectionsList.className = 'ftm-export-selection-list collections-list';
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
    collectionCard.className = 'ftm-export-selection-card collection-card';
    
    // Store reference for search
    collectionElements.set(collectionName, collectionCard);
    
    // Create header with checkbox
    const cardHeader = document.createElement('div');
    cardHeader.className = 'ftm-export-card-header';
    cardHeader.innerHTML = `
      <div class="ftm-export-card-checkbox-container">
        <input type="checkbox" id="collection-${collectionName}" checked>
        <label for="collection-${collectionName}" class="ftm-export-card-title">${collectionName}</label>
      </div>
      <button class="ftm-export-toggle-button" aria-label="Toggle modes">
        <span class="ftm-export-toggle-icon">▸</span>
      </button>
    `;
    collectionCard.appendChild(cardHeader);

    // Create modes container
    const modesContainer = document.createElement('div');
    modesContainer.className = 'ftm-export-card-content ftm-export-modes-container';
    
    // Create modes header with counter and controls
    const modesHeader = document.createElement('div');
    modesHeader.className = 'ftm-export-modes-header';
    
    // Add modes counter
    const modeCount = Object.keys(tokenData[collectionName]).length;
    const modesCounter = document.createElement('div');
    modesCounter.className = 'ftm-export-modes-counter';
    modesCounter.textContent = `${modeCount} mode${modeCount !== 1 ? 's' : ''}`;
    modesHeader.appendChild(modesCounter);
    
    // Add modes controls
    const modesControls = document.createElement('div');
    modesControls.className = 'ftm-export-modes-controls';
    modesControls.innerHTML = `
      <button class="ftm-export-select-all-button select-all-modes" data-collection="${collectionName}">All</button>
      <button class="ftm-export-deselect-all-button deselect-all-modes" data-collection="${collectionName}">None</button>
    `;
    modesHeader.appendChild(modesControls);
    
    // Add modes header to container
    modesContainer.appendChild(modesHeader);
    
    // Add modes grid
    const modesGrid = document.createElement('div');
    modesGrid.className = 'ftm-export-modes-grid';
    
    // Add modes for this collection
    const collectionData = tokenData[collectionName];
    Object.keys(collectionData).forEach(modeName => {
      // Initialize mode selection state
      exportOptions.selectedModes[collectionName][modeName] = true;
      
      // Create mode item
      const modeItem = document.createElement('div');
      modeItem.className = 'ftm-export-mode-item';
      modeItem.innerHTML = `
        <div class="ftm-export-mode-checkbox-container">
          <input type="checkbox" id="mode-${collectionName}-${modeName}" checked>
          <label for="mode-${collectionName}-${modeName}" class="ftm-export-mode-label">${modeName}</label>
        </div>
      `;
      modesGrid.appendChild(modeItem);

      // Add event listener for mode checkbox
      const modeCheckbox = modeItem.querySelector(`#mode-${collectionName}-${modeName}`) as HTMLInputElement;
      modeCheckbox.addEventListener('change', () => {
        exportOptions.selectedModes[collectionName][modeName] = modeCheckbox.checked;
        updateModeCounter();
        updateTokenCount();
      });
    });
    
    // Add modes grid to modes container
    modesContainer.appendChild(modesGrid);
    
    // Add modes container to collection card
    collectionCard.appendChild(modesContainer);
    
    // Add collection card to list
    collectionsList.appendChild(collectionCard);

    // Get the toggle button reference first
    const toggleButton = cardHeader.querySelector('.ftm-export-toggle-button') as HTMLButtonElement;
    
    // Create compact mode summary for collapsed state
    const modeSummary = document.createElement('div');
    modeSummary.className = 'ftm-export-mode-summary';
    modeSummary.textContent = `${modeCount} mode${modeCount !== 1 ? 's' : ''} selected`;
    modeSummary.style.display = 'inline-block';
    modeSummary.style.fontSize = '11px';
    modeSummary.style.color = '#666';
    modeSummary.style.marginRight = '4px';
    cardHeader.insertBefore(modeSummary, toggleButton);
    
    // Function to update the mode counter display
    const updateModeCounter = () => {
      const selectedCount = Object.values(exportOptions.selectedModes[collectionName])
        .filter(isSelected => isSelected).length;
      modeSummary.textContent = `${selectedCount}/${modeCount} mode${modeCount !== 1 ? 's' : ''} selected`;
      
      // Change the color based on selection status
      if (selectedCount === 0) {
        modeSummary.style.color = '#d73a49'; // red
      } else if (selectedCount < modeCount) {
        modeSummary.style.color = '#f9a825'; // amber
      } else {
        modeSummary.style.color = '#28a745'; // green
      }
    };
    
    // Initialize the counter
    updateModeCounter();
    
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
      
      // Update the mode counter
      if (!checkbox.checked) {
        modeSummary.style.color = '#666';
        modeSummary.textContent = `${modeCount} mode${modeCount !== 1 ? 's' : ''} (disabled)`;
      } else {
        updateModeCounter();
      }
      
      updateTokenCount();
    });
    
    // Add event listener for toggle button
    toggleButton.addEventListener('click', () => {
      const expanded = modesContainer.classList.toggle('expanded');
      const toggleIcon = toggleButton.querySelector('.ftm-export-toggle-icon') as HTMLSpanElement;
      toggleIcon.textContent = expanded ? '▾' : '▸';
      
      // Toggle visibility of mode summary based on expanded state
      modeSummary.style.display = expanded ? 'none' : 'inline-block';
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
      updateModeCounter();
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
      updateModeCounter();
      updateTokenCount();
    });
  });
  
  // Add event listeners for collection search
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
      if (!collectionsList.querySelector('.ftm-export-no-results')) {
        const noResults = document.createElement('div');
        noResults.className = 'ftm-export-no-results';
        noResults.textContent = 'No collections match your search.';
        collectionsList.appendChild(noResults);
      }
    } else {
      const noResults = collectionsList.querySelector('.ftm-export-no-results');
      if (noResults) {
        collectionsList.removeChild(noResults);
      }
    }
  });
  
  // Add event listeners for select/deselect all collections
  const selectAllBtn = collectionsHeader.querySelector('#select-all-collections') as HTMLButtonElement;
  const deselectAllBtn = collectionsHeader.querySelector('#deselect-all-collections') as HTMLButtonElement;
  
  selectAllBtn.addEventListener('click', () => {
    const collectionCheckboxes = collectionsList.querySelectorAll('.ftm-export-card-header input[type="checkbox"]');
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
    const collectionCheckboxes = collectionsList.querySelectorAll('.ftm-export-card-header input[type="checkbox"]');
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