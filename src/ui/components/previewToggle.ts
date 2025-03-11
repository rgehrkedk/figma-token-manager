/**
 * Component for toggling between JSON and Visual token preview modes
 */

/**
 * Setup the preview mode toggle
 */
export function setupPreviewToggle() {
  const jsonToggle = document.querySelector('.segmented-toggle-option[data-mode="json"]') as HTMLElement;
  const visualToggle = document.querySelector('.segmented-toggle-option[data-mode="visual"]') as HTMLElement;
  const jsonPreviewContainer = document.querySelector('.preview-content-json') as HTMLElement;
  const visualPreviewContainer = document.querySelector('.preview-content-visual') as HTMLElement;
  
  // Initialize state
  let currentPreviewMode: 'json' | 'visual' = 'json';
  
  // Add click handlers
  jsonToggle.addEventListener('click', () => {
    if (currentPreviewMode !== 'json') {
      // Update active state
      jsonToggle.classList.add('active');
      visualToggle.classList.remove('active');
      
      // Show/hide appropriate containers
      jsonPreviewContainer.classList.add('active');
      visualPreviewContainer.classList.remove('active');
      
      // Update state
      currentPreviewMode = 'json';
    }
  });
  
  visualToggle.addEventListener('click', () => {
    if (currentPreviewMode !== 'visual') {
      // Update active state
      visualToggle.classList.add('active');
      jsonToggle.classList.remove('active');
      
      // Show/hide appropriate containers
      visualPreviewContainer.classList.add('active');
      jsonPreviewContainer.classList.remove('active');
      
      // Update state
      currentPreviewMode = 'visual';
    }
  });
  
  // Return interface for controlling toggle state programmatically
  return {
    setMode: (mode: 'json' | 'visual') => {
      if (mode === 'json') {
        jsonToggle.click();
      } else {
        visualToggle.click();
      }
    },
    getCurrentMode: () => currentPreviewMode
  };
}