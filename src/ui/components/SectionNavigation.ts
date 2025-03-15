/**
 * SectionNavigation Component
 * Creates anchor links for top-level token groups like bg, fg, border, etc.
 */

export interface SectionNavigationProps {
    sections: string[];
    onSectionClick?: (section: string) => void;
  }
  
  export function createSectionNavigation(props: SectionNavigationProps): HTMLElement {
    const { sections, onSectionClick } = props;
  
    // Create container
    const container = document.createElement('div');
    container.className = 'section-navigation';
    
    // Add heading
    const heading = document.createElement('div');
    heading.className = 'section-navigation-heading';
    heading.textContent = 'Go to group:';
    container.appendChild(heading);
    
    // Add links container
    const linksContainer = document.createElement('div');
    linksContainer.className = 'section-navigation-links';
    
    // Add links for each section
    sections.forEach(section => {
      const link = document.createElement('a');
      link.className = 'section-navigation-link';
      link.textContent = section;
      link.href = `#section-${section}`;
      link.dataset.section = section;
      
      // Add click handler for smooth scrolling and callback
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Find the section element
        const sectionElement = document.getElementById(`section-${section}`);
        if (sectionElement) {
          // Smooth scroll to section
          sectionElement.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Call the callback if provided
        if (onSectionClick) {
          onSectionClick(section);
        }
      });
      
      linksContainer.appendChild(link);
    });
    
    container.appendChild(linksContainer);
    return container;
  }
  
  /**
   * Highlight the active section in the navigation
   */
  export function setActiveSection(navigationElement: HTMLElement, activeSection: string): void {
    const links = navigationElement.querySelectorAll('.section-navigation-link');
    
    links.forEach(link => {
      if (link instanceof HTMLElement && link.dataset.section === activeSection) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }