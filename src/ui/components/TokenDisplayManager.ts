/**
 * TokenDisplayManager Component
 * Manages the display of design tokens with mode toggle, section navigation, and hierarchical display
 */

import { createModeToggle, updateActiveMode } from './ModeToggle';
import { createSectionNavigation, setActiveSection } from './SectionNavigation';
import { createHierarchicalTokens } from './HierarchicalTokens';

export interface TokenDisplayManagerProps {
  containerId: string;
  tokenData: any;
  onTokenClick?: (path: string, value: any, type: string) => void;
}

export interface FilterOptions {
  selectedCollections: string[];
  selectedModes: Map<string, string[]>;
}

export interface TokenDisplayManagerInterface {
  updateTokens: (tokenData: any) => void;
  setActiveMode: (mode: string) => void;
  filterTokens: (options: FilterOptions) => void;
}

export function setupTokenDisplayManager(props: TokenDisplayManagerProps): TokenDisplayManagerInterface {
  const { containerId, onTokenClick } = props;
  // Use let for tokenData so we can update it
  let tokenData = props.tokenData;
  
  // Get container
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return {
      updateTokens: () => {},
      setActiveMode: () => {},
      filterTokens: () => {}
    };
  }
  
  // State
  let currentMode = '';
  let modesToggle: HTMLElement | null = null;
  let sectionsNav: HTMLElement | null = null;
  let currentCollection = Object.keys(tokenData)[0] || '';
  // Filter state
  let filterOptions: FilterOptions = {
    selectedCollections: [],
    selectedModes: new Map()
  };

  // Initialize component
  function init() {
    // If no collections are selected, select all by default
    if (filterOptions.selectedCollections.length === 0) {
      const collections = Object.keys(tokenData);
      filterOptions.selectedCollections = [...collections];
      
      // Select all modes for each collection
      collections.forEach(collection => {
        const modes = Object.keys(tokenData[collection] || {});
        filterOptions.selectedModes.set(collection, [...modes]);
      });
    }
    
    // Render tokens with the current filter options
    renderTokens();
  }
  
  // Render tokens for the current mode
  function renderTokens() {
    // Clear container first
    container.innerHTML = '';
    
    // Check if we have filter options
    if (filterOptions.selectedCollections.length === 0) {
      container.innerHTML = '<div class="empty-message">No collections selected</div>';
      return;
    }

    // Filter token data based on selected collections and modes
    const filteredData: any = {};
    
    // Build filtered token data
    for (const collection of filterOptions.selectedCollections) {
      if (tokenData[collection]) {
        const modesForCollection = filterOptions.selectedModes.get(collection) || [];
        
        if (modesForCollection.length > 0) {
          for (const mode of modesForCollection) {
            if (tokenData[collection][mode]) {
              // Initialize collection and mode in filtered data if needed
              if (!filteredData[collection]) {
                filteredData[collection] = {};
              }
              
              filteredData[collection][mode] = tokenData[collection][mode];
            }
          }
        }
      }
    }
    
    // Check if we have any data after filtering
    if (Object.keys(filteredData).length === 0) {
      container.innerHTML = '<div class="empty-message">No tokens found for selected collections and modes</div>';
      return;
    }
    
    // Get first collection and mode from filtered data
    const firstCollection = Object.keys(filteredData)[0];
    const firstMode = Object.keys(filteredData[firstCollection])[0];
    
    // Update current collection and mode
    currentCollection = firstCollection;
    currentMode = firstMode;
    
    // Get available modes for all selected collections
    const allModes = new Set<string>();
    for (const collection of Object.keys(filteredData)) {
      Object.keys(filteredData[collection]).forEach(mode => allModes.add(mode));
    }
    
    // Create mode toggle if there are multiple modes
    const modes = Array.from(allModes);
    if (modes.length > 1) {
      modesToggle = createModeToggle({
        modes,
        initialMode: currentMode,
        onModeChange: (mode) => {
          currentMode = mode;
          updateContentForMode(mode);
        }
      });
      container.appendChild(modesToggle);
    }
    
    // Call helper to update the content for the current mode
    updateContentForMode(currentMode);
  }
  
  function updateContentForMode(mode: string) {
    // Get tokens for all collections in the current mode
    const tokensForMode: any = {};
    
    for (const collection of filterOptions.selectedCollections) {
      if (tokenData[collection]?.[mode]) {
        tokensForMode[collection] = tokenData[collection][mode];
      }
    }
    
    // Check if we have any data for this mode
    if (Object.keys(tokensForMode).length === 0) {
      // No data for this mode, try to switch to another mode
      const availableModes = Array.from(document.querySelectorAll('.mode-toggle-btn'))
        .map(el => (el as HTMLElement).dataset.mode || '')
        .filter(m => m !== mode);
      
      if (availableModes.length > 0) {
        currentMode = availableModes[0];
        if (modesToggle) {
          updateActiveMode(modesToggle, currentMode);
        }
        updateContentForMode(currentMode);
      } else {
        // No other modes available
        const contentArea = container.querySelector('.token-content-area') || container;
        contentArea.innerHTML = '<div class="empty-message">No tokens found for selected mode</div>';
      }
      return;
    }
    
    // Remove existing section navigation and tokens
    const oldNavigation = container.querySelector('.section-navigation');
    if (oldNavigation) {
      container.removeChild(oldNavigation);
    }
    
    const oldTokens = container.querySelector('.hierarchical-tokens');
    if (oldTokens) {
      container.removeChild(oldTokens);
    }
    
    // Get all available sections from all collections
    const allSections = new Set<string>();
    for (const collection in tokensForMode) {
      Object.keys(tokensForMode[collection]).forEach(section => {
        allSections.add(section);
      });
    }
    
    const sections = Array.from(allSections);
    
    // Create merged tokens object
    const mergedTokens: any = {};
    sections.forEach(section => {
      mergedTokens[section] = {};
      
      for (const collection in tokensForMode) {
        if (tokensForMode[collection][section]) {
          // Merge tokens from this collection
          Object.assign(mergedTokens[section], tokensForMode[collection][section]);
        }
      }
    });
    
    // Process resolved values
    // This step ensures that references are properly resolved
    processResolvedValues(mergedTokens);
    
    // Create section navigation
    sectionsNav = createSectionNavigation({
      sections,
      onSectionClick: (section) => {
        if (sectionsNav) {
          setActiveSection(sectionsNav, section);
        }
      }
    });
    
    // Create hierarchical tokens component
    const tokensComponent = createHierarchicalTokens({
      tokens: mergedTokens,
      onTokenClick
    });
    
    // Add elements to container (after mode toggle)
    if (modesToggle) {
      container.insertBefore(sectionsNav, modesToggle.nextSibling);
    } else {
      container.appendChild(sectionsNav);
    }
    container.appendChild(tokensComponent);
    
    // Set up intersection observer for active section highlighting
    setupSectionObserver();
  }
  
  /**
   * Process token references to ensure all resolved values are available
   */
  function processResolvedValues(tokensObj: any) {
    // First, build a flat map of all tokens for reference resolution
    const referenceMap: {[key: string]: any} = {};
    
    // Function to flatten the token structure
    function buildReferenceMap(obj: any, path: string = '') {
      if (!obj || typeof obj !== 'object') return;
      
      // If this is a token with $value
      if (obj.$value !== undefined) {
        referenceMap[path] = obj;
        return;
      }
      
      // Process nested objects
      for (const key in obj) {
        const newPath = path ? `${path}.${key}` : key;
        buildReferenceMap(obj[key], newPath);
      }
    }
    
    // Function to resolve references in the token structure
    function resolveReferences(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      
      // If this is a token with $value
      if (obj.$value !== undefined) {
        // Check if it's a reference
        if (typeof obj.$value === 'string' && 
            obj.$value.startsWith('{') && 
            obj.$value.endsWith('}')) {
          
          // Extract reference path
          const refPath = obj.$value.substring(1, obj.$value.length - 1);
          
          // Find referenced token
          const referencedToken = referenceMap[refPath];
          if (referencedToken) {
            // Store resolved value
            obj.$resolvedValue = referencedToken.$value;
          }
        }
        return;
      }
      
      // Process nested objects
      for (const key in obj) {
        resolveReferences(obj[key]);
      }
    }
    
    // Build reference map
    buildReferenceMap(tokensObj);
    
    // Resolve references
    resolveReferences(tokensObj);
  }
  
  // Set up intersection observer to highlight active section in navigation
  function setupSectionObserver() {
    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target.id.startsWith('section-')) {
            const sectionId = entry.target.id.replace('section-', '');
            if (sectionsNav) {
              setActiveSection(sectionsNav, sectionId);
            }
          }
        });
      },
      { 
        rootMargin: '-10% 0px -80% 0px' // Trigger when section is near the top
      }
    );
    
    // Observe all sections
    const sections = container.querySelectorAll('.token-section');
    sections.forEach(section => {
      observer.observe(section);
    });
  }
  
  // Initialize the component
  init();
  
  // Return public interface
  return {
    updateTokens: (newTokenData) => {
      // Update the tokenData reference
      tokenData = newTokenData;
      renderTokens();
    },
    setActiveMode: (mode) => {
      if (modesToggle && mode !== currentMode) {
        currentMode = mode;
        updateActiveMode(modesToggle, mode);
        updateContentForMode(mode);
      }
    },
    filterTokens: (options) => {
      // Update filter options
      filterOptions = options;
      renderTokens();
    }
  };
}