/**
 * Action Button Component for the Figma Token Manager
 * Reusable button component for Extract and Export actions
 */

export interface ActionButtonOptions {
  type: 'extract' | 'export';
  title: string;
  onClick: () => void;
}

export interface ActionButtonInterface {
  element: HTMLElement;
}

export function createActionButton(options: ActionButtonOptions): ActionButtonInterface {
  // Create button element
  const button = document.createElement('button');
  button.className = `action-button ${options.type}-button`;
  button.title = options.title;
  
  // Set icon based on type
  const iconSvg = options.type === 'extract' 
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23 4V10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M1 20V14H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20.49 9C19.2456 6.94681 17.3065 5.36266 15.0186 4.5153C12.7306 3.66794 10.2249 3.61133 7.89923 4.35544C5.57361 5.09955 3.56028 6.60066 2.1872 8.61679C0.814125 10.6329 0.155969 13.0432 0.31 15.46L1 20M23.69 8.54C23.8445 10.9567 23.1871 13.3671 21.8146 15.3832C20.4421 17.3993 18.4293 18.9003 16.1042 19.6445C13.7792 20.3886 11.2739 20.332 8.98669 19.4847C6.69943 18.6374 4.76083 17.0532 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
  
  // Get label text from the button type
  const labelText = options.type === 'extract' ? 'Extract' : 'Export';
  
  // Set button content with both icon and text
  button.innerHTML = `
    <span class="action-button-icon">${iconSvg}</span>
    <span class="action-button-text">${labelText}</span>
  `;
  
  // Add event listener for click action
  button.addEventListener('click', options.onClick);
  
  // Return the interface
  return {
    element: button
  };
}