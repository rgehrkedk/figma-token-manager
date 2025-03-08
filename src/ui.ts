import './styles.css';

// Store the extracted tokens
let extractedTokens: any = null;
let selectedCollections: string[] = [];

// Helper function to prettify JSON for display
function prettifyJson(json: any): string {
  return JSON.stringify(json, null, 2);
}

// Helper function to download JSON file
function downloadJson(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

// Helper function to filter tokens based on selected collections
function filterTokensByCollections(tokens: any, collections: string[]): any {
  if (collections.length === 0) return tokens;
  
  const result: any = {};
  for (const collection of collections) {
    if (tokens[collection]) {
      result[collection] = tokens[collection];
    }
  }
  
  return result;
}

// Function to update UI based on selected options
function updateUI() {
  const downloadButton = document.getElementById('download-button') as HTMLButtonElement;
  const previewContent = document.getElementById('preview-content') as HTMLPreElement;
  const statusElement = document.getElementById('status') as HTMLDivElement;
  
  if (extractedTokens) {
    const filteredTokens = filterTokensByCollections(extractedTokens, selectedCollections);
    previewContent.textContent = prettifyJson(filteredTokens);
    downloadButton.disabled = Object.keys(filteredTokens).length === 0;
    
    statusElement.textContent = `Tokens extracted: ${Object.keys(extractedTokens).length} collections found`;
    statusElement.className = 'status success';
  } else {
    previewContent.textContent = '// No tokens extracted yet';
    downloadButton.disabled = true;
  }
}

// Function to update the collection list
function updateCollectionList() {
  const collectionList = document.getElementById('collection-list') as HTMLDivElement;
  
  if (!extractedTokens || Object.keys(extractedTokens).length === 0) {
    collectionList.innerHTML = '<div>No collections found</div>';
    return;
  }
  
  collectionList.innerHTML = '';
  const collections = Object.keys(extractedTokens);
  
  collections.forEach(collection => {
    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'checkbox-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `collection-${collection}`;
    checkbox.value = collection;
    checkbox.checked = true;
    
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        if (!selectedCollections.includes(collection)) {
          selectedCollections.push(collection);
        }
      } else {
        selectedCollections = selectedCollections.filter(c => c !== collection);
      }
      
      updateUI();
    });
    
    // Add to selected collections by default
    if (!selectedCollections.includes(collection)) {
      selectedCollections.push(collection);
    }
    
    const label = document.createElement('label');
    label.htmlFor = `collection-${collection}`;
    
    // Show variable count if available
    if (extractedTokens[collection].variableCount !== undefined) {
      label.textContent = `${collection} (${extractedTokens[collection].variableCount} variables)`;
    } else {
      label.textContent = collection;
    }
    
    checkboxDiv.appendChild(checkbox);
    checkboxDiv.appendChild(label);
    collectionList.appendChild(checkboxDiv);
  });
}

// Initialize UI after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("UI DOM loaded");
  
  // UI Elements
  const extractButton = document.getElementById('extract-button') as HTMLButtonElement;
  const downloadButton = document.getElementById('download-button') as HTMLButtonElement;
  const statusElement = document.getElementById('status') as HTMLDivElement;
  const togglePreviewButton = document.getElementById('toggle-preview') as HTMLButtonElement;
  const previewContainer = document.getElementById('preview-container') as HTMLDivElement;
  const collectionList = document.getElementById('collection-list') as HTMLDivElement;
  
  statusElement.textContent = 'Waiting for plugin to initialize...';
  statusElement.className = 'status info';
  
  // Toggle preview visibility
  togglePreviewButton.addEventListener('click', () => {
    previewContainer.classList.toggle('collapsed');
  });
  
  // Extract tokens
  extractButton.addEventListener('click', () => {
    statusElement.textContent = 'Extracting tokens...';
    statusElement.className = 'status info';
    collectionList.innerHTML = '<div class="loading">Scanning collections...</div>';
    
    console.log("Extract button clicked, sending message to plugin");
    // Request token extraction from the plugin code
    parent.postMessage({ pluginMessage: { type: 'extract-tokens' } }, '*');
  });
  
  // Download JSON
  downloadButton.addEventListener('click', () => {
    if (extractedTokens) {
      const filteredTokens = filterTokensByCollections(extractedTokens, selectedCollections);
      downloadJson(filteredTokens, 'design-tokens.json');
      
      statusElement.textContent = 'Tokens downloaded successfully!';
      statusElement.className = 'status success';
    }
  });
  
  // Handle messages from the plugin code
  window.onmessage = (event) => {
    console.log("Message received from plugin:", event.data);
    
    const message = event.data.pluginMessage;
    if (!message) {
      console.log("Message doesn't contain pluginMessage");
      return;
    }
    
    if (message.type === 'tokens-data') {
      console.log("Received tokens data");
      extractedTokens = message.data;
      
      // Update collection list and UI
      updateCollectionList();
      updateUI();
    } else if (message.type === 'error') {
      console.error("Received error from plugin:", message.message);
      statusElement.textContent = message.message;
      statusElement.className = 'status error';
      collectionList.innerHTML = '<div>Error loading collections</div>';
    }
  };
  
  console.log("UI initialization complete");
});