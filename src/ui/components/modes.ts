/**
 * Component for handling modes selection
 */

/**
 * Builds the modes list UI elements
 */
export function buildModesList(
    tokenData: any, 
    modeListEl: HTMLElement,
    updatePreviewCallback: () => void
  ): { selectedModes: string[], allModes: string[], areAllModesSelected: boolean } {
    if (!tokenData) {
      return { selectedModes: [], allModes: [], areAllModesSelected: true };
    }
    
    modeListEl.innerHTML = '';
    
    // Get all unique modes from all collections
    const modesSet = new Set<string>();
    for (const collection in tokenData) {
      for (const mode in tokenData[collection]) {
        modesSet.add(mode);
      }
    }
    
    const allModes = Array.from(modesSet);
    
    if (allModes.length === 0) {
      modeListEl.innerHTML = '<div>No modes found</div>';
      return { selectedModes: [], allModes: [], areAllModesSelected: true };
    }
    
    // Clear selected modes and add all by default
    const selectedModes = [...allModes];
    const areAllModesSelected = true;
    
    allModes.forEach(mode => {
      const checkboxDiv = document.createElement('div');
      checkboxDiv.className = 'checkbox-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `mode-${mode}`;
      checkbox.value = mode;
      checkbox.checked = true;
      
      checkbox.addEventListener('change', () => {
        const selectedSet = new Set(selectedModes);
        
        if (checkbox.checked) {
          selectedSet.add(mode);
        } else {
          selectedSet.delete(mode);
        }
        
        // Update the selected modes array
        selectedModes.length = 0;
        selectedSet.forEach(m => selectedModes.push(m));
        
        // Call the preview update
        updatePreviewCallback();
      });
      
      const label = document.createElement('label');
      label.htmlFor = `mode-${mode}`;
      label.textContent = mode;
      
      checkboxDiv.appendChild(checkbox);
      checkboxDiv.appendChild(label);
      modeListEl.appendChild(checkboxDiv);
    });
    
    return { selectedModes, allModes, areAllModesSelected };
  }
  
  /**
   * Toggles all mode checkboxes
   */
  export function toggleAllModes(
    areAllSelected: boolean,
    modeListEl: HTMLElement,
    allModes: string[]
  ): { areAllSelected: boolean, selectedModes: string[] } {
    const newState = !areAllSelected;
    const checkboxes = modeListEl.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
      (checkbox as HTMLInputElement).checked = newState;
    });
    
    // Update the selected modes array
    let selectedModes: string[] = [];
    
    if (newState) {
      selectedModes = [...allModes];
    }
    
    return { areAllSelected: newState, selectedModes };
  }