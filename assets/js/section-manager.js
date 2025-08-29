// Section Manager - Enhanced section card interactions

class SectionManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupSectionToggling();
    this.setupKeyboardNavigation();
    this.setupAccessibility();
  }

  setupSectionToggling() {
    // Remove existing onclick handlers to prevent conflicts
    document.querySelectorAll('.section-header').forEach(header => {
      header.removeAttribute('onclick');
    });
    
    document.addEventListener('click', (e) => {
      const header = e.target.closest('.section-header');
      if (header) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSection(header);
      }
    });
  }

  toggleSection(header) {
    const card = header.closest('.section-card');
    const content = card.querySelector('.section-content');
    const isExpanded = card.classList.contains('expanded');
    
    // Clear any existing inline styles first
    content.removeAttribute('style');
    
    // Simple toggle
    if (isExpanded) {
      card.classList.remove('expanded');
      content.style.display = 'none';
    } else {
      card.classList.add('expanded');
      content.style.display = 'block';
    }
    
    // Update ARIA attributes
    header.setAttribute('aria-expanded', !isExpanded);
    content.setAttribute('aria-hidden', isExpanded);
  }

  expandSection(card, content) {
    card.classList.add('expanded');
    content.style.display = 'block';
  }

  collapseSection(card, content) {
    card.classList.remove('expanded');
    content.style.display = 'none';
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      const header = e.target.closest('.section-header');
      if (header && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.toggleSection(header);
      }
    });
  }

  setupAccessibility() {
    document.querySelectorAll('.section-header').forEach(header => {
      // Make focusable
      if (!header.hasAttribute('tabindex')) {
        header.setAttribute('tabindex', '0');
      }
      
      // Set ARIA attributes
      header.setAttribute('role', 'button');
      const card = header.closest('.section-card');
      const content = card.querySelector('.section-content');
      const isExpanded = card.classList.contains('expanded');
      
      header.setAttribute('aria-expanded', isExpanded);
      content.setAttribute('aria-hidden', !isExpanded);
      
      // Generate IDs if needed
      if (!content.id) {
        const id = 'section-content-' + Math.random().toString(36).substr(2, 9);
        content.id = id;
        header.setAttribute('aria-controls', id);
      }
    });
  }

  isMobile() {
    return window.innerWidth <= 767;
  }

  // Public methods for external use
  expandAllSections() {
    document.querySelectorAll('.section-card:not(.expanded)').forEach(card => {
      const header = card.querySelector('.section-header');
      this.toggleSection(header);
    });
  }

  collapseAllSections() {
    document.querySelectorAll('.section-card.expanded').forEach(card => {
      const header = card.querySelector('.section-header');
      this.toggleSection(header);
    });
  }

  setSectionState(sectionId, state) {
    const card = document.getElementById(sectionId)?.closest('.section-card');
    if (card) {
      card.classList.remove('loading', 'error', 'success');
      if (state) {
        card.classList.add(state);
      }
    }
  }
}

// Initialize section manager
window.addEventListener('DOMContentLoaded', () => {
  window.sectionManager = new SectionManager();
});