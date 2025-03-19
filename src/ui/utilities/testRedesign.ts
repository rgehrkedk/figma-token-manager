/**
 * Testing utility for the redesigned export dialog
 * This script allows toggling between the original and redesigned export dialog
 */

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    __USE_REDESIGNED_EXPORT_DIALOG?: boolean;
  }
}

/**
 * Enable the redesigned export dialog
 * Should be called before showing the export dialog
 */
export function enableRedesignedExportDialog(): void {
  window.__USE_REDESIGNED_EXPORT_DIALOG = true;
  console.log('Redesigned export dialog enabled');
}

/**
 * Disable the redesigned export dialog
 * Should be called before showing the export dialog
 */
export function disableRedesignedExportDialog(): void {
  window.__USE_REDESIGNED_EXPORT_DIALOG = false;
  console.log('Redesigned export dialog disabled');
}

/**
 * Check if the redesigned export dialog is enabled
 * @returns True if the redesigned dialog is enabled
 */
export function isRedesignedExportDialogEnabled(): boolean {
  return !!window.__USE_REDESIGNED_EXPORT_DIALOG;
}

// Default to enabled
enableRedesignedExportDialog();