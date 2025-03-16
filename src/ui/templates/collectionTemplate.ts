/**
 * Collection UI templates
 * Defines HTML templates for collection cards with segmented toggle UI
 */

/**
 * Creates the HTML for the collections section title
 */
export function createSectionTitleTemplate(): string {
    return `<h2 class="section-title">Collections & Modes</h2>`;
  }
  
  /**
   * Creates the HTML for the search input
   */
  export function createSearchTemplate(): string {
    return `
      <div class="search-container">
        <div class="search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <input type="text" class="search-input" placeholder="Search tokens...">
      </div>
    `;
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
          <div class="mode-option ${isActive ? 'active' : ''}" 
               data-collection="${collection}" 
               data-mode="${mode}">
            ${mode}
          </div>
        `;
      }).join('');
      
      modesToggleHtml = `
        <div class="modes-toggle" data-collection="${collection}">
          ${modeOptions}
        </div>
      `;
    } else if (modes.length === 1) {
      // Single mode - we don't show the toggle
      modesToggleHtml = `
        <div class="modes-toggle single-mode" data-collection="${collection}">
          <div class="mode-option active" 
               data-collection="${collection}" 
               data-mode="${modes[0]}">
            ${modes[0]}
          </div>
        </div>
      `;
    }
  
    return `
      <div class="collection-card ${isActive ? 'active' : ''}" data-collection="${collection}">
        <div class="collection-header">
          <div class="collection-name">${collection}</div>
          <div class="collection-count">${tokenCount} tokens</div>
        </div>
        ${modesToggleHtml}
      </div>
    `;
  }
  
  /**
   * Creates the HTML for the entire collections container
   */
  export function createCollectionsContainerTemplate(collectionCardsHtml: string): string {
    return `
      ${createSectionTitleTemplate()}
      ${createSearchTemplate()}
      <div class="collections-container">
        ${collectionCardsHtml}
      </div>
    `;
  }