/**
 * Segmented Toggle Component
 * Used for creating toggle switches between two or more options
 */

type ToggleOption = {
  id: string;
  label: string;
  // Optional callback when this option is selected
  onSelect?: () => void;
}

interface SegmentedToggleConfig {
  containerId: string;
  options: ToggleOption[];
  initialSelection?: string;
  onChange?: (selectedId: string) => void;
}

/**
 * Create and manage a segmented toggle component
 */
export function setupSegmentedToggle(config: SegmentedToggleConfig): {
  getSelected: () => string;
  setSelected: (id: string) => void;
} {
  const container = document.getElementById(config.containerId);
  if (!container) {
    console.error(`Container ${config.containerId} not found`);
    return {
      getSelected: () => '',
      setSelected: () => {}
    };
  }
  
  // Clear the container
  container.innerHTML = '';
  container.className = 'segmented-toggle';
  
  let selectedId = config.initialSelection || (config.options.length > 0 ? config.options[0].id : '');
  
  // Create toggle options
  config.options.forEach(option => {
    const optionElement = document.createElement('div');
    optionElement.className = 'segmented-toggle-option';
    optionElement.dataset.optionId = option.id;
    optionElement.textContent = option.label;
    
    if (option.id === selectedId) {
      optionElement.classList.add('active');
    }
    
    optionElement.addEventListener('click', () => {
      // Deactivate all options
      container.querySelectorAll('.segmented-toggle-option').forEach(el => {
        el.classList.remove('active');
      });
      
      // Activate the selected option
      optionElement.classList.add('active');
      selectedId = option.id;
      
      // Call the option's callback if provided
      if (option.onSelect) {
        option.onSelect();
      }
      
      // Call the general onChange callback if provided
      if (config.onChange) {
        config.onChange(selectedId);
      }
    });
    
    container.appendChild(optionElement);
  });
  
  // Return methods for external control
  return {
    getSelected: () => selectedId,
    setSelected: (id: string) => {
      const option = container.querySelector(`.segmented-toggle-option[data-option-id="${id}"]`);
      if (option) {
        option.dispatchEvent(new Event('click'));
      }
    }
  };
}
