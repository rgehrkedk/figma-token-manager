/**
 * Component for managing preview tabs for the token files
 */

import { formatJson } from '../utilities/formatters';
import { getSeparateFiles } from '../utilities/formatters';

interface TabDefinition {
  id: string;
  name: string;
  data: any;
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
  contentContainer: HTMLElement
): void {
  // Clear existing tabs
  const existingTabs = tabsContainer.querySelectorAll('.tab-button:not([data-tab="combined"])');
  existingTabs.forEach(tab => tab.remove());
  
  // Clear existing tab contents except combined
  const existingContents = contentContainer.querySelectorAll('.tab-content:not(#tab-combined)');
  existingContents.forEach(content => content.remove());
  
  if (!isSeparateFiles) {
    // If not using separate files, just show the combined tab
    setActiveTab('combined');
    return;
  }
  
  // Get all separate files
  const files = getPreviewFiles(tokenData, selectedCollections, selectedModes, flatStructure);
  
  // Create tabs for each file
  files.forEach((file, index) => {
    // Create tab button
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.dataset.tab = file.id;
    tabButton.textContent = file.name;
    tabButton.addEventListener('click', () => setActiveTab(file.id));
    
    tabsContainer.appendChild(tabButton);
    
    // Create tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    tabContent.id = `tab-${file.id}`;
    
    const preElement = document.createElement('pre');
    preElement.textContent = formatJson(file.data);
    
    tabContent.appendChild(preElement);
    contentContainer.appendChild(tabContent);
  });
  
  // Set the combined tab as active
  setActiveTab('combined');
}

/**
 * Set the active tab
 */
function setActiveTab(tabId: string): void {
  // Get all tab buttons and contents
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Remove active class from all tabs
  tabButtons.forEach(tab => tab.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  // Add active class to selected tab
  const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
  const selectedContent = document.getElementById(`tab-${tabId}`);
  
  if (selectedButton) {
    selectedButton.classList.add('active');
  }
  
  if (selectedContent) {
    selectedContent.classList.add('active');
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
  
  // Filter the token data based on selections
  const filteredData: any = {};
  
  for (const collection of selectedCollections) {
    if (tokenData[collection]) {
      filteredData[collection] = {};
      
      const modesForCollection = selectedModes.get(collection) || [];
      
      for (const mode of modesForCollection) {
        if (tokenData[collection][mode]) {
          filteredData[collection][mode] = tokenData[collection][mode];
        }
      }
      
      // Remove collection if it has no modes after filtering
      if (Object.keys(filteredData[collection]).length === 0) {
        delete filteredData[collection];
      }
    }
  }
  
  // Generate tabs for separate files
  for (const collection of selectedCollections) {
    const modesForCollection = selectedModes.get(collection) || [];
    
    for (const mode of modesForCollection) {
      if (filteredData[collection] && filteredData[collection][mode]) {
        const fileData = flatStructure
          ? flattenTokenObject(`${collection}.${mode}`, filteredData[collection][mode])
          : { [collection]: { [mode]: filteredData[collection][mode] } };
        
        tabs.push({
          id: `${collection}-${mode}`,
          name: `${collection}/${mode}`,
          data: fileData
        });
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