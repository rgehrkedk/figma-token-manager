/**
 * DialogHeader.ts
 * 
 * Component for the dialog header section
 */

export function createDialogHeader(): HTMLElement {
  const header = document.createElement('div');
  header.className = 'ftm-export-dialog-header';
  header.innerHTML = `
    <h2>Export Tokens</h2>
    <button class="ftm-export-close-button" aria-label="Close">&times;</button>
  `;
  
  return header;
}