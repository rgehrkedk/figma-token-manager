/**
 * HTML templates for sidebar UI components
 * Separates UI structure from functional logic
 * Improved for cleaner interface without search functionality
 */

/**
 * Generates the sidebar container HTML structure
 */
export function createSidebarTemplate(): string {
  return `
    <div class="sidebar-tabs">
      <button class="sidebar-tab active" data-tab="collections">Collections</button>
    </div>
    
    <div class="sidebar-content">
      <div class="sidebar-panel active" id="collections-panel">
        <!-- Collections & Modes -->
        <div id="collections-container" class="collections-tree"></div>
      </div>
    </div>
    
    <div class="sidebar-footer">
      <div class="reference-status">
        <span>References</span>
        <span class="reference-counter">
          0/0 resolved
        </span>
      </div>
    </div>
  `;
}