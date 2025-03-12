/**
 * Component for handling JSON preview functionality
 */

/**
 * Formats JSON data for display
 */
export function prettifyJson(json: any): string {
  return JSON.stringify(json, null, 2);
}

/**
 * Updates the JSON preview content
 */
export function updateJsonPreview(
  container: HTMLPreElement,
  data: any | null
): void {
  if (data) {
    container.textContent = prettifyJson(data);
  } else {
    container.textContent = '// No tokens extracted yet';
  }
}

/**
 * Toggle visibility of JSON preview container
 */
export function toggleJsonPreview(container: HTMLElement): void {
  container.classList.toggle('collapsed');
}

/**
 * Download JSON data as a file
 */
export function downloadJson(data: any, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}
