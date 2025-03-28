/**
 * Component for managing preview tabs for the token files
 */

import { formatJson } from '../utilities/formatters';

interface TabDefinition {
  id: string;
  name: string;
  data: any;
}

// Token data structure type
interface TokenDataStructure {
  [collection: string]: {
    [mode: string]: any;
  };
}

/**
 * Setup the preview tabs based on selected tokens
 */
export function setupPreviewTabs(
  tokenData: any,
  selectedCollections: string[],
  selectedModes: Map<string, string[]>,
  flatStructure: boolean,
  isSeparateFiles: boolean,
  tabsContainer: HTMLElement,
  contentContainer: HTMLElement,
  updateVisualPreview?: (data: any) => void // New parameter to update visual preview
): void {
  // Clear existing tabs except combined
  const existingTabs = tabsContainer.querySelectorAll('.tab-button:not([data-tab="combined"])');
  existingTabs.forEach(tab => tab.remove());
  
  // Clear existing tab contents except combined
  const existingContents = contentContainer.querySelectorAll('.tab-content:not(#tab-combined)');
  existingContents.forEach(content => content.remove());
  
  // Get all separate files/tabs 
  const files = getPreviewFiles(tokenData, selectedCollections, selectedModes, flatStructure);
  
  // Create tabs for each file
  files.forEach((file) => {
    // Create tab button
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.dataset.tab = file.id;
    tabButton.textContent = file.name;
    
    // Add click event listener with visual preview update
    tabButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default button behavior
      setActiveTab(file.id, tabsContainer, contentContainer, file.data, updateVisualPreview);
      
      // Update visual preview directly if we have a function to do so
      if (updateVisualPreview) {
        updateVisualPreview(file.data);
      }
    });
    
    tabsContainer.appendChild(tabButton);
    
    // Create tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    tabContent.id = `tab-${file.id}`;
    tabContent.style.display = 'none'; // Hide by default
    
    const preElement = document.createElement('pre');
    preElement.textContent = formatJson(file.data);
    
    tabContent.appendChild(preElement);
    contentContainer.appendChild(tabContent);
  });
  
  // Add event listener to the combined tab if it doesn't have one
  const combinedTab = tabsContainer.querySelector('.tab-button[data-tab="combined"]');
  if (combinedTab) {
    // Remove existing listeners first to avoid duplicates
    const newCombinedTab = combinedTab.cloneNode(true);
    combinedTab.parentNode?.replaceChild(newCombinedTab, combinedTab);
    
    // Create combined data for when combined tab is clicked
    newCombinedTab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Get combined data (all selected collections and modes)
      const combinedData: TokenDataStructure = {};
      for (const collection of selectedCollections) {
        if (tokenData[collection]) {
          combinedData[collection] = {};
          const modesForCollection = selectedModes.get(collection) || [];
          for (const mode of modesForCollection) {
            if (tokenData[collection][mode]) {
              combinedData[collection][mode] = tokenData[collection][mode];
            }
          }
        }
      }
      
      setActiveTab('combined', tabsContainer, contentContainer, combinedData, updateVisualPreview);
    });
  }
  
  // Set the combined tab as active by default
  // Create combined data for initial view
  const combinedData: TokenDataStructure = {};
  for (const collection of selectedCollections) {
    if (tokenData[collection]) {
      combinedData[collection] = {};
      const modesForCollection = selectedModes.get(collection) || [];
      for (const mode of modesForCollection) {
        if (tokenData[collection][mode]) {
          combinedData[collection][mode] = tokenData[collection][mode];
        }
      }
    }
  }
  
  setActiveTab('combined', tabsContainer, contentContainer, combinedData, updateVisualPreview);
}

/**
 * Set the active tab
 */
export function setActiveTab(
  tabId: string, 
  tabsContainer: HTMLElement, 
  contentContainer: HTMLElement,
  tabData?: any, // New parameter for tab-specific data
  updateVisualPreview?: (data: any) => void // New parameter to update visual preview
): void {
  console.log(`Setting active tab: ${tabId}`);
  
  // Get all tab buttons and contents
  const tabButtons = tabsContainer.querySelectorAll('.tab-button');
  const tabContents = contentContainer.querySelectorAll('.tab-content');
  
  // Remove active class from all tabs
  tabButtons.forEach(tab => tab.classList.remove('active'));
  
  // Hide all tab contents
  tabContents.forEach(content => {
    (content as HTMLElement).style.display = 'none';
  });
  
  // Add active class to selected tab
  const selectedButton = tabsContainer.querySelector(`.tab-button[data-tab="${tabId}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  } else {
    console.error(`Tab button not found: ${tabId}`);
  }
  
  // Show selected content
  const selectedContent = document.getElementById(`tab-${tabId}`);
  if (selectedContent) {
    selectedContent.style.display = 'block';
  } else {
    console.error(`Tab content not found: tab-${tabId}`);
  }
  
  // Update visual token preview with the data for this tab
  if (tabData && updateVisualPreview) {
    updateVisualPreview(tabData);
  }
}

/**
 * Get preview files based on selected collections and modes
 */
function getPreviewFiles(
  tokenData: any,
  selectedCollections: string[],
  selectedModes: Map<string, string[]>,
  flatStructure: boolean
): TabDefinition[] {
  const tabs: TabDefinition[] = [];
  
  // Process each selected collection
  for (const collection of selectedCollections) {
    if (tokenData[collection]) {
      const modesForCollection = selectedModes.get(collection) || [];
      
      for (const mode of modesForCollection) {
        if (tokenData[collection][mode]) {
          const fileData = flatStructure
            ? flattenTokenObject(`${collection}.${mode}`, tokenData[collection][mode])
            : { [collection]: { [mode]: tokenData[collection][mode] } };
          
          tabs.push({
            id: `${collection}-${mode}`,
            name: `${collection}/${mode}`,
            data: fileData
          });
        }
      }
    }
  }
  
  return tabs;
}

/**
 * Creates a flattened version of a token object with a prefix
 */
function flattenTokenObject(prefix: string, obj: any): any {
  const result: any = {};
  
  function traverse(node: any, path: string) {
    if (!node || typeof node !== 'object') {
      // For primitive values
      result[path] = node;
      return;
    }
    
    // For DTCG token objects
    if (node.$value !== undefined) {
      result[path] = { ...node };
      return;
    }
    
    // For nested objects
    for (const key in node) {
      const newPath = path ? `${path}.${key}` : key;
      
      if (typeof node[key] === 'object' && node[key] !== null) {
        traverse(node[key], newPath);
      } else {
        result[newPath] = node[key];
      }
    }
  }
  
  traverse(obj, prefix);
  return result;
}