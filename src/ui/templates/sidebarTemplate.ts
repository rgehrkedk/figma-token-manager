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
      <button class="sidebar-tab" data-tab="settings">Settings</button>
    </div>
    
    <div class="sidebar-content">
      <div class="sidebar-panel active" id="collections-panel">
        <!-- Collections & Modes -->
        <div id="collections-container" class="collections-tree"></div>
      </div>
      
      <div class="sidebar-panel" id="settings-panel">
        <!-- Format options -->
        <div class="settings-section">
          <h3 class="settings-heading">Format</h3>
          <div class="settings-options">
            <div class="settings-option">
              <input type="radio" id="format-dtcg" name="format" checked>
              <label for="format-dtcg">DTCG Format</label>
            </div>
            <div class="settings-option">
              <input type="radio" id="format-legacy" name="format">
              <label for="format-legacy">Legacy Format</label>
            </div>
          </div>
        </div>
        
        <!-- Color Format -->
        <div class="settings-section">
          <h3 class="settings-heading">Color Format</h3>
          <div class="settings-options">
            <div class="settings-option">
              <input type="radio" id="color-hex" name="color-format" checked>
              <label for="color-hex">HEX (#ffffff)</label>
            </div>
            <div class="settings-option">
              <input type="radio" id="color-rgba" name="color-format">
              <label for="color-rgba">RGBA (rgba(255, 255, 255, 1))</label>
            </div>
            <div class="settings-option">
              <input type="radio" id="color-hsla" name="color-format">
              <label for="color-hsla">HSLA (hsla(0deg, 0%, 100%, 1))</label>
            </div>
          </div>
        </div>
        
        <!-- Export Options -->
        <div class="settings-section">
          <h3 class="settings-heading">Export Options</h3>
          <div class="settings-options">
            <div class="settings-option">
              <input type="checkbox" id="separate-files" checked>
              <label for="separate-files">Export separate files</label>
            </div>
            <div class="settings-option">
              <input type="checkbox" id="validate-references" checked>
              <label for="validate-references">Validate references</label>
            </div>
            <div class="settings-option">
              <input type="checkbox" id="flat-structure">
              <label for="flat-structure">Flat structure</label>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="sidebar-footer">
      <div class="reference-status">
        <span>References</span>
        <span class="reference-counter">
          0/0 resolved
        </span>
      </div>
      
      <div class="sidebar-actions">
        <button class="extract-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 4V10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1 20V14H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20.49 9C19.2456 6.94681 17.3065 5.36266 15.0186 4.5153C12.7306 3.66794 10.2249 3.61133 7.89923 4.35544C5.57361 5.09955 3.56028 6.60066 2.1872 8.61679C0.814125 10.6329 0.155969 13.0432 0.31 15.46L1 20M23.69 8.54C23.8445 10.9567 23.1871 13.3671 21.8146 15.3832C20.4421 17.3993 18.4293 18.9003 16.1042 19.6445C13.7792 20.3886 11.2739 20.332 8.98669 19.4847C6.69943 18.6374 4.76083 17.0532 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Extract</span>
        </button>
        <button class="export-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Export</span>
        </button>
      </div>
    </div>
  `;
}