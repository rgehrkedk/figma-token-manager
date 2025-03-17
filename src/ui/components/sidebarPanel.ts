/**
 * Sidebar Panel component for the Figma Token Manager
 * Functionality separated from UI structure
 */

import { createSidebarTemplate } from '../templates/sidebarTemplate';
import { CollectionSelector, SelectionState, CollectionSelectorCallbacks } from './collectionSelector';

import { ColorFormat } from '../../code/formatters/colorUtils';

interface SidebarState {
  activeCollection: string | null;
  selectedModes: Map<string, string>; // Single mode per collection
  activeSidebarTab: 'collections' | 'settings';
  colorFormat: ColorFormat;
  exportFormat: 'dtcg' | 'legacy';
  separateFiles: boolean;
  validateReferences: boolean;
  flatStructure: boolean;
}

export interface SidebarCallbacks {
  onActiveCollectionChange: (collection: string | null) => void;
  onModeChange: (collection: string, mode: string) => void;
  onSettingsChange: (setting: string, value: any) => void;
  onExtract: () => void;
  onExport: () => void;
}

export interface SidebarInterface {
  getState: () => SidebarState;
  setReferenceCounts: (resolved: number, unresolved: number) => void;
  updateTokenData: (tokenData: any) => void;
}

export function setupSidebarPanel(
  containerId: string,
  callbacks: SidebarCallbacks
): SidebarInterface {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Sidebar container #${containerId} not found`);
    return createEmptySidebarInterface();
  }

  // Initialize state
  const state: SidebarState = {
    activeCollection: null,
    selectedModes: new Map(),
    activeSidebarTab: 'collections',
    colorFormat: 'hex',
    exportFormat: 'dtcg',
    separateFiles: true,
    validateReferences: true,
    flatStructure: false
  };

  // Reference counts for status display
  let referenceStatus = {
    resolved: 0,
    unresolved: 0
  };

  // Initialize UI
  container.innerHTML = createSidebarTemplate();

  // Setup collection selector with callbacks
  const collectionSelectorCallbacks: CollectionSelectorCallbacks = {
    onActiveCollectionChange: (collection) => {
      state.activeCollection = collection;
      callbacks.onActiveCollectionChange(collection);
    },
    onModeChange: (collection, mode) => {
      state.selectedModes.set(collection, mode);
      callbacks.onModeChange(collection, mode);
    }
  };

  const collectionSelector = new CollectionSelector(
    'collections-container',
    collectionSelectorCallbacks
  );

  // Setup UI event handlers
  setupTabSwitching();
  setupSettingsHandlers();
  setupActionButtons();
  setupSearch();

  /**
   * Setup sidebar tab switching
   */
  function setupTabSwitching(): void {
    const tabs = container.querySelectorAll('.sidebar-tab');
    const panels = container.querySelectorAll('.sidebar-panel');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab') as 'collections' | 'settings';
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active panel
        panels.forEach(panel => panel.classList.remove('active'));
        const activePanel = container.querySelector(`#${tabName}-panel`);
        if (activePanel) {
          activePanel.classList.add('active');
        }
        
        // Update state
        state.activeSidebarTab = tabName;
      });
    });
  }

  /**
   * Setup settings option handlers
   */
  function setupSettingsHandlers(): void {
    // Format radio buttons
    const formatRadios = container.querySelectorAll('input[name="format"]');
    formatRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if ((radio as HTMLInputElement).checked) {
          const format = radio.id === 'format-dtcg' ? 'dtcg' : 'legacy';
          state.exportFormat = format;
          callbacks.onSettingsChange('exportFormat', format);
        }
      });
    });
    
    // Color format radio buttons
    const colorFormatRadios = container.querySelectorAll('input[name="color-format"]');
    colorFormatRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if ((radio as HTMLInputElement).checked) {
          const format = radio.id.replace('color-', '') as 'hex' | 'rgba' | 'hsla';
          state.colorFormat = format;
          callbacks.onSettingsChange('colorFormat', format);
        }
      });
    });
    
    // Checkbox options
    const separateFilesCheckbox = container.querySelector('#separate-files') as HTMLInputElement;
    const validateReferencesCheckbox = container.querySelector('#validate-references') as HTMLInputElement;
    const flatStructureCheckbox = container.querySelector('#flat-structure') as HTMLInputElement;
    
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
  function setupActionButtons(): void {
    const extractBtn = container.querySelector('.extract-btn');
    const exportBtn = container.querySelector('.export-btn');
    
    if (extractBtn) {
      extractBtn.addEventListener('click', callbacks.onExtract);
    }
    
    if (exportBtn) {
      exportBtn.addEventListener('click', callbacks.onExport);
    }
  }

  /**
   * Setup search functionality
   */
  function setupSearch(): void {
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    if (!searchInput) return;
    
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      // Implement search filtering logic here
      console.log('Search query:', query);
    });
  }

  /**
   * Set reference counts and update UI
   */
  function setReferenceCounts(resolved: number, unresolved: number): void {
    referenceStatus.resolved = resolved;
    referenceStatus.unresolved = unresolved;
    
    const referenceCounter = container.querySelector('.reference-counter');
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
    setReferenceCounts,
    updateTokenData: (tokenData: any) => {
      // Initialize collection selector with the new token data
      // This handles all the collection/mode UI updates
      const selectionState = collectionSelector.initialize(tokenData);
      
      // Update our state with the selection state
      state.activeCollection = selectionState.activeCollection;
      state.selectedModes = selectionState.selectedModes;
    }
  };
}

/**
 * Create empty sidebar interface for when container is not found
 */
function createEmptySidebarInterface(): SidebarInterface {
  return {
    getState: () => ({
      activeCollection: null,
      selectedModes: new Map(),
      activeSidebarTab: 'collections',
      colorFormat: 'hex' as ColorFormat,
      exportFormat: 'dtcg',
      separateFiles: true,
      validateReferences: true,
      flatStructure: false
    }),
    setReferenceCounts: () => {},
    updateTokenData: () => {}
  };
}