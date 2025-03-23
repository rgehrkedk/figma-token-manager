/**
 * Settings Modal component for the Figma Token Manager
 * Displays settings in a modal dialog accessible from the header
 */

import { ColorFormat } from '../../code/formatters/colorUtils';

interface SettingsModalCallbacks {
  onSettingsChange: (setting: string, value: any) => void;
  onExtract: () => void;
  onExport: () => void;
}

interface SettingsModalInterface {
  element: HTMLElement;
  open: () => void;
  close: () => void;
  updateReferenceCount: (resolved: number, unresolved: number) => void;
}

export function createSettingsModal(callbacks: SettingsModalCallbacks): SettingsModalInterface {
  // Default settings values
  let settings = {
    colorFormat: 'hex' as ColorFormat,
    exportFormat: 'dtcg' as 'dtcg' | 'legacy',
  };
  
  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.className = 'settings-modal';
  modalContainer.style.display = 'none';
  
  // Create modal overlay (background)
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'settings-modal-overlay';
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'settings-modal-content';
  
  // Create modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'settings-modal-header';
  
  const modalTitle = document.createElement('h2');
  modalTitle.className = 'settings-modal-title';
  modalTitle.textContent = 'Settings';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'settings-modal-close';
  closeButton.innerHTML = '&times;';
  closeButton.setAttribute('aria-label', 'Close settings');
  
  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeButton);
  
  // Create modal body
  const modalBody = document.createElement('div');
  modalBody.className = 'settings-modal-body';
  
  // Format options section
  const formatSection = document.createElement('div');
  formatSection.className = 'settings-section';
  
  const formatHeading = document.createElement('h3');
  formatHeading.className = 'settings-heading';
  formatHeading.textContent = 'Format';
  
  const formatOptions = document.createElement('div');
  formatOptions.className = 'settings-options';
  
  const dtcgOption = createRadioOption('format-dtcg', 'format', 'DTCG Format', true);
  const legacyOption = createRadioOption('format-legacy', 'format', 'Legacy Format', false);
  
  formatOptions.appendChild(dtcgOption);
  formatOptions.appendChild(legacyOption);
  
  formatSection.appendChild(formatHeading);
  formatSection.appendChild(formatOptions);
  
  // Color Format section
  const colorFormatSection = document.createElement('div');
  colorFormatSection.className = 'settings-section';
  
  const colorFormatHeading = document.createElement('h3');
  colorFormatHeading.className = 'settings-heading';
  colorFormatHeading.textContent = 'Color Format';
  
  const colorFormatOptions = document.createElement('div');
  colorFormatOptions.className = 'settings-options';
  
  const hexOption = createRadioOption('color-hex', 'color-format', 'HEX (#ffffff)', true);
  const rgbaOption = createRadioOption('color-rgba', 'color-format', 'RGBA (rgba(255, 255, 255, 1))', false);
  const hslaOption = createRadioOption('color-hsla', 'color-format', 'HSLA (hsla(0deg, 0%, 100%, 1))', false);
  
  colorFormatOptions.appendChild(hexOption);
  colorFormatOptions.appendChild(rgbaOption);
  colorFormatOptions.appendChild(hslaOption);
  
  colorFormatSection.appendChild(colorFormatHeading);
  colorFormatSection.appendChild(colorFormatOptions);
  
  // References section
  const referencesSection = document.createElement('div');
  referencesSection.className = 'settings-section references-section';
  
  const referencesHeading = document.createElement('h3');
  referencesHeading.className = 'settings-heading';
  referencesHeading.textContent = 'References';
  
  const referenceCounter = document.createElement('div');
  referenceCounter.className = 'reference-counter';
  referenceCounter.textContent = '0/0 resolved';
  
  referencesSection.appendChild(referencesHeading);
  referencesSection.appendChild(referenceCounter);
  
  
  // Add all sections to modal body
  modalBody.appendChild(formatSection);
  modalBody.appendChild(colorFormatSection);
  modalBody.appendChild(referencesSection);
  
  // Assemble modal
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContainer.appendChild(modalOverlay);
  modalContainer.appendChild(modalContent);
  
  // Setup event listeners
  closeButton.addEventListener('click', close);
  modalOverlay.addEventListener('click', close);
  
  // Handle format option changes
  const formatRadios = modalContainer.querySelectorAll('input[name="format"]');
  formatRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if ((radio as HTMLInputElement).checked) {
        const format = radio.id === 'format-dtcg' ? 'dtcg' : 'legacy';
        settings.exportFormat = format;
        callbacks.onSettingsChange('exportFormat', format);
      }
    });
  });
  
  // Handle color format option changes
  const colorFormatRadios = modalContainer.querySelectorAll('input[name="color-format"]');
  colorFormatRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if ((radio as HTMLInputElement).checked) {
        const format = radio.id.replace('color-', '') as ColorFormat;
        settings.colorFormat = format;
        callbacks.onSettingsChange('colorFormat', format);
      }
    });
  });
  
  
  // Helper to create radio option
  function createRadioOption(id: string, name: string, label: string, checked: boolean): HTMLDivElement {
    const option = document.createElement('div');
    option.className = 'settings-option';
    
    const input = document.createElement('input');
    input.type = 'radio';
    input.id = id;
    input.name = name;
    if (checked) input.checked = true;
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    
    option.appendChild(input);
    option.appendChild(labelElement);
    
    return option;
  }
  
  // Modal control functions
  function open(): void {
    modalContainer.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  }
  
  function close(): void {
    modalContainer.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }
  
  function updateReferenceCount(resolved: number, unresolved: number): void {
    const referenceCounter = modalContainer.querySelector('.reference-counter');
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
    element: modalContainer,
    open,
    close,
    updateReferenceCount
  };
}