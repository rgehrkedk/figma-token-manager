/**
 * DialogFooter.ts
 * 
 * Component for the dialog footer with buttons and token count
 */

import { ExportOptions } from './types';

export function createDialogFooter(
  exportOptions: ExportOptions,
  updateTokenCount: () => number
): { 
  footer: HTMLElement; 
  setTokenCount: (count: number) => void;
} {
  const footer = document.createElement('div');
  footer.className = 'ftm-export-dialog-footer';
  footer.innerHTML = `
    <div class="ftm-export-dialog-footer-info">
      <span class="ftm-export-token-count">0 tokens selected</span>
    </div>
    <div class="ftm-export-dialog-footer-buttons">
      <button class="ftm-export-secondary-button ftm-export-cancel-button">Cancel</button>
      <button class="ftm-export-secondary-button ftm-export-back-button" style="display: none;">Back</button>
      <button class="ftm-export-primary-button ftm-export-next-button">Next</button>
      <button class="ftm-export-primary-button ftm-export-export-button" style="display: none;">Export</button>
    </div>
  `;

  const tokenCountElem = footer.querySelector('.ftm-export-token-count') as HTMLSpanElement;
  
  function setTokenCount(count: number): void {
    tokenCountElem.textContent = `${count} tokens selected`;
  }

  return { footer, setTokenCount };
}