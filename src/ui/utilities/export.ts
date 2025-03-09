/**
 * Utilities for exporting tokens
 */

/**
 * Downloads a single JSON file
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
  
  /**
   * Downloads multiple files
   */
  export function downloadMultipleFiles(
    files: { name: string, data: any }[],
    validationContent: HTMLElement,
    referenceValidationResults: HTMLElement
  ): void {
    // If only one file, download it directly
    if (files.length === 1) {
      downloadJson(files[0].data, files[0].name);
      return;
    }
    
    // Create a temporary link for each file
    const fileLinks = document.createElement('div');
    fileLinks.style.display = 'none';
    document.body.appendChild(fileLinks);
    
    let html = '<p>Multiple files are ready for download:</p><ul>';
    
    files.forEach((file, index) => {
      const jsonStr = JSON.stringify(file.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.textContent = `Download ${file.name}`;
      a.id = `download-link-${index}`;
      a.className = 'download-link';
      
      fileLinks.appendChild(a);
      
      html += `<li><a href="#" onclick="document.getElementById('download-link-${index}').click(); return false;">${file.name}</a></li>`;
    });
    
    html += '</ul>';
    
    // Show download links in validation panel
    validationContent.innerHTML = html;
    referenceValidationResults.style.display = 'block';
    
    // Auto-click the first download link
    const firstLink = fileLinks.querySelector('.download-link');
    if (firstLink) {
      (firstLink as HTMLAnchorElement).click();
    }
  }