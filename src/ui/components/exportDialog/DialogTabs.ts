/**
 * DialogTabs.ts
 * 
 * Component for the dialog tabs navigation
 */

export function createDialogTabs(): { 
  tabsContainer: HTMLElement; 
  switchTab: (tabId: string) => void;
} {
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'ftm-export-dialog-tabs';
  tabsContainer.innerHTML = `
    <button class="ftm-export-tab active" data-tab="content">1. Content</button>
    <button class="ftm-export-tab" data-tab="config">2. Config</button>
    <button class="ftm-export-tab" data-tab="transforms">3. Transforms</button>
  `;
  
  // Function to switch tab by ID
  function switchTab(tabId: string): void {
    const tabs = Array.from(tabsContainer.querySelectorAll('.ftm-export-tab'));
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  return { tabsContainer, switchTab };
}