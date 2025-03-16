/**
 * Collection Selector Component
 * Handles selection of collections and modes using segmented toggle UI
 * Improved for cleaner interface without search functionality
 */

import { 
    createCollectionCardTemplate, 
    createCollectionsContainerTemplate, 
    createEmptyCollectionsTemplate 
  } from '../templates/collectionTemplate';
  
  export interface CollectionData {
    id: string;
    name: string;
    modes: string[];
    tokenCounts: Record<string, number>; // Mode name to token count
  }
  
  export interface SelectionState {
    selectedCollections: string[];
    selectedModes: Map<string, string>; // Collection to selected mode
    activeCollection: string | null;
  }
  
  export interface CollectionSelectorCallbacks {
    onActiveCollectionChange: (collection: string | null) => void;
    onModeChange: (collection: string, mode: string) => void;
  }
  
  export class CollectionSelector {
    private containerEl: HTMLElement;
    private collections: CollectionData[] = [];
    private selectionState: SelectionState = {
      selectedCollections: [],
      selectedModes: new Map(),
      activeCollection: null
    };
    private callbacks: CollectionSelectorCallbacks;
  
    constructor(
      containerId: string,
      callbacks: CollectionSelectorCallbacks
    ) {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container element #${containerId} not found`);
      }
      
      this.containerEl = container;
      this.callbacks = callbacks;
    }
  
    /**
     * Initialize the component with token data
     */
    initialize(tokenData: any): SelectionState {
      if (!tokenData) {
        this.renderEmptyState();
        return this.selectionState;
      }
  
      // Extract collections from token data
      this.collections = this.extractCollections(tokenData);
      
      // Initialize selection state
      this.selectionState.selectedCollections = this.collections.map(c => c.id);
      
      // Set default mode selections and active collection
      if (this.collections.length > 0) {
        this.selectionState.activeCollection = this.collections[0].id;
        
        this.collections.forEach(collection => {
          if (collection.modes.length > 0) {
            this.selectionState.selectedModes.set(collection.id, collection.modes[0]);
          }
        });
      }
  
      // Render the UI
      this.render();
      
      return this.selectionState;
    }
  
    /**
     * Extract collections from token data
     */
    private extractCollections(tokenData: any): CollectionData[] {
      const collections: CollectionData[] = [];
      
      for (const collectionId in tokenData) {
        const modes = Object.keys(tokenData[collectionId]);
        const tokenCounts: Record<string, number> = {};
        
        // Count tokens in each mode
        for (const mode of modes) {
          tokenCounts[mode] = this.countTokens(tokenData[collectionId][mode]);
        }
        
        collections.push({
          id: collectionId,
          name: collectionId,
          modes,
          tokenCounts
        });
      }
      
      return collections;
    }
  
    /**
     * Count tokens in an object
     */
    private countTokens(obj: any): number {
      let count = 0;
      
      const traverse = (node: any) => {
        if (!node || typeof node !== 'object') return;
        
        // Count DTCG format tokens
        if (node.$value !== undefined && node.$type !== undefined) {
          count++;
          return;
        }
        
        // Traverse nested objects
        for (const key in node) {
          if (typeof node[key] === 'object' && node[key] !== null) {
            traverse(node[key]);
          }
        }
      };
      
      traverse(obj);
      return count;
    }
  
    /**
     * Render empty state when no collections
     */
    private renderEmptyState(): void {
      this.containerEl.innerHTML = createEmptyCollectionsTemplate();
    }
  
    /**
     * Render the collection selector UI
     */
    private render(): void {
      // Create all collection cards
      const collectionCardsHtml = this.collections.map(collection => {
        const selectedMode = this.selectionState.selectedModes.get(collection.id);
        const isActive = collection.id === this.selectionState.activeCollection;
        const totalTokenCount = selectedMode ? collection.tokenCounts[selectedMode] : 0;
        
        return createCollectionCardTemplate(
          collection.id,
          isActive,
          collection.modes,
          selectedMode,
          totalTokenCount
        );
      }).join('');
      
      // Create container with all cards
      this.containerEl.innerHTML = createCollectionsContainerTemplate(collectionCardsHtml);
      
      // Attach event listeners
      this.attachEventListeners();
    }
  
    /**
     * Attach event listeners to UI elements
     */
    private attachEventListeners(): void {
      // Collection card click events for setting active collection
      const collectionCards = this.containerEl.querySelectorAll('.collection-card');
      collectionCards.forEach(card => {
        card.addEventListener('click', (e) => {
          // Don't handle clicks on mode options here
          if ((e.target as HTMLElement).classList.contains('mode-option')) {
            return;
          }
          
          const collection = card.getAttribute('data-collection');
          if (collection) {
            this.setActiveCollection(collection);
          }
        });
      });
      
      // Mode option click events
      const modeOptions = this.containerEl.querySelectorAll('.mode-option');
      modeOptions.forEach(option => {
        option.addEventListener('click', (e) => {
          e.stopPropagation(); // Don't trigger collection card click
          
          const collection = option.getAttribute('data-collection');
          const mode = option.getAttribute('data-mode');
          
          if (collection && mode) {
            this.selectMode(collection, mode);
          }
        });
      });
    }
  
    /**
     * Set the active collection and update UI
     */
    setActiveCollection(collectionId: string): void {
      if (this.selectionState.activeCollection === collectionId) {
        return; // Already active
      }
      
      // Update state
      this.selectionState.activeCollection = collectionId;
      
      // Update UI
      const allCards = this.containerEl.querySelectorAll('.collection-card');
      allCards.forEach(card => card.classList.remove('active'));
      
      const activeCard = this.containerEl.querySelector(
        `.collection-card[data-collection="${collectionId}"]`
      );
      if (activeCard) {
        activeCard.classList.add('active');
      }
      
      // Trigger callback
      this.callbacks.onActiveCollectionChange(collectionId);
    }
  
    /**
     * Select a mode for a collection
     */
    selectMode(collectionId: string, mode: string): void {
      const previousMode = this.selectionState.selectedModes.get(collectionId);
      
      // Don't do anything if the mode is already selected
      if (previousMode === mode) {
        return;
      }
      
      // Update state
      this.selectionState.selectedModes.set(collectionId, mode);
      
      // Update UI - deactivate all modes for this collection and activate the selected one
      const modeOptions = this.containerEl.querySelectorAll(
        `.mode-option[data-collection="${collectionId}"]`
      );
      
      modeOptions.forEach(option => {
        option.classList.remove('active');
        
        if (option.getAttribute('data-mode') === mode) {
          option.classList.add('active');
        }
      });
      
      // Update the token count display if needed
      const collection = this.collections.find(c => c.id === collectionId);
      if (collection) {
        const countElement = this.containerEl.querySelector(
          `.collection-card[data-collection="${collectionId}"] .collection-count`
        );
        
        if (countElement) {
          const tokenCount = collection.tokenCounts[mode] || 0;
          countElement.textContent = `${tokenCount} tokens`;
        }
      }
      
      // Trigger callback
      this.callbacks.onModeChange(collectionId, mode);
    }
  
    /**
     * Get the current selection state
     */
    getSelectionState(): SelectionState {
      return { ...this.selectionState };
    }
  
    /**
     * Update selected mode for a collection
     */
    updateSelectedMode(collectionId: string, mode: string): void {
      if (!this.collections.find(c => c.id === collectionId)?.modes.includes(mode)) {
        console.warn(`Mode ${mode} not found in collection ${collectionId}`);
        return;
      }
      
      // Update state
      this.selectionState.selectedModes.set(collectionId, mode);
      
      // Update UI by selecting the mode
      this.selectMode(collectionId, mode);
    }
  }