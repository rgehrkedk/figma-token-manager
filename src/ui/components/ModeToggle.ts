/**
 * ModeToggle Component
 * Creates a segmented toggle for switching between design token modes (light/dark, etc.)
 */

export interface ModeToggleProps {
  modes: string[];
  initialMode?: string;
  onModeChange: (mode: string) => void;
}

export function createModeToggle(props: ModeToggleProps): HTMLElement {
  const { modes, initialMode, onModeChange } = props;
  const activeMode = initialMode || (modes.length > 0 ? modes[0] : '');

  // Create the container
  const container = document.createElement('div');
  container.className = 'mode-toggle';

  // Add buttons for each mode
  modes.forEach(mode => {
    const button = document.createElement('button');
    button.className = `mode-toggle-btn ${mode === activeMode ? 'active' : ''}`;
    button.dataset.mode = mode;
    button.textContent = mode;
    
    button.addEventListener('click', () => {
      // Don't do anything if already active
      if (button.classList.contains('active')) return;
      
      // Update UI
      container.querySelectorAll('.mode-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      
      // Trigger callback
      onModeChange(mode);
    });
    
    container.appendChild(button);
  });

  return container;
}

/**
 * Update the active mode in an existing mode toggle
 */
export function updateActiveMode(toggleElement: HTMLElement, mode: string): void {
  const buttons = toggleElement.querySelectorAll('.mode-toggle-btn');
  
  buttons.forEach(button => {
    if (button instanceof HTMLElement && button.dataset.mode === mode) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}