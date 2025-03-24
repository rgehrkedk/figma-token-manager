/**
 * ExportDialogModal.ts
 * 
 * Main container component for the export dialog
 */

import { ExportDialogOptions, ExportOptions, TokenData, TokenGroup, TokenMode, DTCGToken } from './types';
import { createDialogHeader } from './DialogHeader';
import { createDialogTabs } from './DialogTabs';
import { createContentTab } from './ContentTab';
import { createFormatTab } from './FormatTab';
import { createTransformsTab } from './OptionsTab';
import { createDialogFooter } from './DialogFooter';

/**
 * Creates and shows the improved export dialog
 */
export function showExportDialog(options: ExportDialogOptions): void {
  const { tokenData, onExport, onCancel } = options;

  // Create a modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'ftm-export-dialog-overlay';
  document.body.appendChild(overlay);

  // Create the dialog container
  const dialog = document.createElement('div');
  dialog.className = 'ftm-export-dialog';
  overlay.appendChild(dialog);

  // Add dialog header
  const header = createDialogHeader();
  dialog.appendChild(header);

  // Create main content container with tabs
  const contentContainer = document.createElement('div');
  contentContainer.className = 'ftm-export-dialog-content-container';
  dialog.appendChild(contentContainer);

  // Create tabs
  const { tabsContainer, switchTab } = createDialogTabs();
  contentContainer.appendChild(tabsContainer);

  // Create content area for tabs
  const content = document.createElement('div');
  content.className = 'ftm-export-dialog-content';
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

  // Function to update token count display
  function updateTokenCount(): number {
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
    
    return count;
  }

  // Create content for each tab
  const contentTab = createContentTab(tokenData, exportOptions, updateTokenCount);
  const configTab = createFormatTab(exportOptions); // Using createFormatTab for the config tab
  const transformsTab = createTransformsTab(exportOptions);

  // Add tabs to content
  content.appendChild(contentTab);
  content.appendChild(configTab);
  content.appendChild(transformsTab);

  // Initially show just the content tab
  configTab.style.display = 'none';
  transformsTab.style.display = 'none';

  // Add dialog footer with buttons
  const { footer, setTokenCount } = createDialogFooter(exportOptions, updateTokenCount);
  dialog.appendChild(footer);

  // Get tab elements
  const tabs = Array.from(tabsContainer.querySelectorAll('.ftm-export-tab'));
  
  // Get footer buttons
  const backButton = footer.querySelector('.ftm-export-back-button') as HTMLButtonElement;
  const nextButton = footer.querySelector('.ftm-export-next-button') as HTMLButtonElement;
  const exportButton = footer.querySelector('.ftm-export-export-button') as HTMLButtonElement;
  const cancelButton = footer.querySelector('.ftm-export-cancel-button') as HTMLButtonElement;

  // Current tab tracking
  let currentTabIndex = 0;
  const tabContents = [contentTab, configTab, transformsTab];

  // Function to switch tabs by index
  function switchTabWithIndex(index: number) {
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
    setTokenCount(updateTokenCount());
  }

  // Set up tab clicking
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      switchTabWithIndex(index);
    });
  });

  // Set up back button
  backButton.addEventListener('click', () => {
    if (currentTabIndex > 0) {
      switchTabWithIndex(currentTabIndex - 1);
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
      
      switchTabWithIndex(currentTabIndex + 1);
    }
  });

  // Add event listeners for dialog controls
  const closeButton = header.querySelector('.ftm-export-close-button');
  closeButton?.addEventListener('click', closeDialog);
  cancelButton?.addEventListener('click', closeDialog);
  
  // Export button handler
  exportButton?.addEventListener('click', () => {
    // Perform final validation
    const hasSelection = Object.values(exportOptions.selectedCollections).some(selected => selected);
    
    if (!hasSelection) {
      alert('Please select at least one collection to export.');
      switchTabWithIndex(0); // Go back to content tab
      return;
    }
    
    // For Style Dictionary format, validate required options
    if (exportOptions.format === 'style-dictionary') {
      const sd = exportOptions.styleDictionary;
      
      if (!sd || sd.platforms.length === 0) {
        alert('Please select at least one platform for Style Dictionary export.');
        switchTabWithIndex(2); // Go to transforms tab where platforms now exist
        return;
      }
      
      if (sd.formats.length === 0) {
        alert('Please select at least one format for Style Dictionary export.');
        switchTabWithIndex(2); // Go to transforms tab where platforms now exist
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
  setTokenCount(updateTokenCount());
}