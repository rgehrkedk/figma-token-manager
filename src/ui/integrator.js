/**
 * Integration script to apply enhanced reference resolution
 * This file helps integrate the Style Dictionary resolver into the existing application
 */

// Reference resolution statistics for display
let referenceStats = {
    resolved: 0,
    unresolved: 0,
    total: 0
  };
  
  /**
   * Apply Style Dictionary reference resolution to the UI
   * This function should be called after the main UI is initialized
   */
  function applyStyleDictionaryResolver() {
    // Import the necessary modules
    import('./utilities/styleReferences.js')
      .then((styleRefModule) => {
        return import('./components/tokenPreviewEnhanced.js')
          .then((previewModule) => {
            return { styleRefModule, previewModule };
          });
      })
      .then(({ styleRefModule, previewModule }) => {
        // Replace the existing token preview function
        window.showVisualTokenPreview = function(tokenData, containerElement, colorFormat) {
          return previewModule.showEnhancedVisualTokenPreview(
            tokenData, 
            containerElement, 
            colorFormat,
            (resolved, unresolved) => {
              // Store the stats for display
              referenceStats.resolved = resolved;
              referenceStats.unresolved = unresolved;
              referenceStats.total = resolved + unresolved;
              
              // Update the UI status
              updateReferenceStatus();
            }
          );
        };
        
        // Add diagnostics button if it doesn't exist
        addDiagnosticsButton();
        
        console.log('Style Dictionary reference resolver integrated successfully');
      })
      .catch(err => {
        console.error('Failed to integrate Style Dictionary resolver:', err);
      });
  }
  
  /**
   * Add a diagnostics button to the UI
   */
  function addDiagnosticsButton() {
    if (document.getElementById('diagnose-references-btn')) {
      return; // Button already exists
    }
    
    const validateBtn = document.getElementById('validate-btn');
    if (!validateBtn) {
      console.warn('Could not find validate button to attach diagnostics button');
      return;
    }
    
    // Create new button
    const diagBtn = document.createElement('button');
    diagBtn.id = 'diagnose-references-btn';
    diagBtn.textContent = 'Reference Diagnoser';
    diagBtn.style.backgroundColor = '#8250df';
    diagBtn.style.marginLeft = '8px';
    
    // Add click handler
    diagBtn.addEventListener('click', showReferenceDiagnostics);
    
    // Add after validate button
    validateBtn.parentNode.insertBefore(diagBtn, validateBtn.nextSibling);
  }
  
  /**
   * Show reference diagnostics panel
   */
  function showReferenceDiagnostics() {
    // Dynamically import the diagnostics component
    import('./components/referenceDiagnoser.js')
      .then((diagModule) => {
        // Get reference elements
        const validationResults = document.getElementById('reference-validation-results');
        const validationContent = document.getElementById('validation-content');
        
        if (!validationResults || !validationContent) {
          console.error('Could not find validation containers');
          return;
        }
        
        // Show the container
        validationResults.style.display = 'block';
        
        // Prepare the content area
        validationContent.innerHTML = '<h3>Reference Diagnosis</h3>';
        const diagContainer = document.createElement('div');
        diagContainer.id = 'reference-diagnosis-container';
        validationContent.appendChild(diagContainer);
        
        // Add the diagnosis styles if not already present
        if (!document.getElementById('reference-diagnosis-styles')) {
          const styleEl = document.createElement('style');
          styleEl.id = 'reference-diagnosis-styles';
          styleEl.textContent = diagModule.getReferenceDiagnoserStyles();
          document.head.appendChild(styleEl);
        }
        
        // Get current token data
        const currentData = getCurrentSelectedTokenData();
        
        // Show the diagnostics
        const diagnosis = diagModule.analyzeReferenceIssues(currentData, diagContainer);
        
        // Setup interaction handlers
        diagModule.setupReferenceDiagnosisListeners(
          diagContainer,
          currentData,
          handleDiagnosisFixes
        );
      })
      .catch(err => {
        console.error('Failed to load reference diagnostics:', err);
      });
  }
  
  /**
   * Handle fixes from the diagnostics panel
   */
  function handleDiagnosisFixes(fixedData) {
    // Get the current token data and update it with fixes
    const currentTabId = document.querySelector('.tab-button.active')?.dataset.tab || 'combined';
    
    if (currentTabId === 'combined') {
      // Update the entire token data
      window.tokenData = fixedData;
    } else {
      // Update just the specific collection/mode
      const [collection, mode] = currentTabId.split('-');
      if (collection && mode && 
          window.tokenData?.[collection] && 
          fixedData?.[collection]?.[mode]) {
        window.tokenData[collection][mode] = fixedData[collection][mode];
      }
    }
    
    // Update the preview
    if (typeof window.updatePreview === 'function') {
      window.updatePreview();
    }
    
    // Show success message
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = "References fixed successfully!";
      statusEl.className = "success";
    }
    
    // Re-analyze to show progress
    import('./components/referenceDiagnoser.js').then(diagModule => {
      const diagContainer = document.getElementById('reference-diagnosis-container');
      if (diagContainer) {
        diagModule.analyzeReferenceIssues(
          getCurrentSelectedTokenData(),
          diagContainer
        );
      }
    });
  }
  
  /**
   * Update the status message with reference resolution info
   */
  function updateReferenceStatus() {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;
    
    if (referenceStats.total === 0) {
      return; // No references to report on
    }
    
    if (referenceStats.unresolved > 0) {
      statusEl.textContent = `Resolved ${referenceStats.resolved}/${referenceStats.total} references. Click "Reference Diagnoser" for details.`;
      statusEl.className = "warning";
    } else {
      statusEl.textContent = `Successfully resolved all ${referenceStats.total} references.`;
      statusEl.className = "success";
    }
  }
  
  /**
   * Get the currently selected token data
   */
  function getCurrentSelectedTokenData() {
    // This is a simplified version - in a real implementation,
    // you would need to access the actual selected collections and modes
    
    const currentTabId = document.querySelector('.tab-button.active')?.dataset.tab || 'combined';
    
    if (currentTabId === 'combined' || !window.tokenData) {
      return window.tokenData || {};
    }
    
    // Extract collection and mode from tab ID
    const [collection, mode] = currentTabId.split('-');
    if (collection && mode && window.tokenData[collection]?.[mode]) {
      return { [collection]: { [mode]: window.tokenData[collection][mode] } };
    }
    
    return window.tokenData;
  }
  
  // Export functions for use in main application
  export {
    applyStyleDictionaryResolver,
    addDiagnosticsButton,
    showReferenceDiagnostics
  };