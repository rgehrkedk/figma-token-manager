/**
 * Collection UI templates
 * Defines HTML templates for collection cards with segmented toggle UI
 * Improved for cleaner, more intuitive interface
 */

/**
 * Creates the HTML for the collections section title
 */
export function createSectionTitleTemplate(): string {
    return `<h2 class="section-title">Collections & Modes</h2>`;
  }
  
  /**
   * Creates the HTML for an empty collections state
   */
  export function createEmptyCollectionsTemplate(): string {
    return `<div class="empty-collections">No collections found</div>`;
  }
  
  /**
   * Creates the HTML for a collection card
   */
  export function createCollectionCardTemplate(
    collection: string,
    isActive: boolean,
    modes: string[],
    selectedMode: string | undefined,
    tokenCount: number
  ): string {
    // Create the modes toggle only if there's more than one mode
    let modesToggleHtml = '';
    
    if (modes.length > 1) {
      const modeOptions = modes.map(mode => {
        const isActive = mode === selectedMode;
        return `
          <div class="mode-chip ${isActive ? 'active' : ''}" 
               data-collection="${collection}" 
               data-mode="${mode}">
            ${mode}
          </div>
        `;
      }).join('');
      
      modesToggleHtml = `
        <div class="modes-container" data-collection="${collection}">
          ${modeOptions}
        </div>
      `;
    } else if (modes.length === 1) {
      // Single mode - just show it as selected
      modesToggleHtml = `
        <div class="modes-container single-mode" data-collection="${collection}">
          <div class="mode-chip active" 
               data-collection="${collection}" 
               data-mode="${modes[0]}">
            ${modes[0]}
          </div>
        </div>
      `;
    }
  
    return `
      <div class="collection-card ${isActive ? 'active' : ''}" data-collection="${collection}">
        <div class="collection-content">
          <div class="collection-header">
            <div class="collection-name">${collection}</div>
            <div class="collection-count">${tokenCount} tokens</div>
          </div>
          ${modesToggleHtml}
        </div>
        <div class="collection-click-indicator">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    `;
  }
  
  /**
   * Creates the HTML for the entire collections container
   */
  export function createCollectionsContainerTemplate(collectionCardsHtml: string): string {
    return `
      ${createSectionTitleTemplate()}
      <div class="collections-container">
        ${collectionCardsHtml}
      </div>
    `;
  }