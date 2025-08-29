// UX Enhancements - Improved user experience without affecting functionality

class UXEnhancements {
  constructor() {
    this.init();
  }

  init() {
    this.addLoadingStates();
    this.addHapticFeedback();
    this.addKeyboardShortcuts();
    this.addProgressIndicators();
    this.addTooltips();
  }

  // Add loading states to buttons
  addLoadingStates() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn')) {
        this.showButtonLoading(e.target);
      }
    });
  }

  showButtonLoading(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="material-icons">hourglass_empty</span>';
    button.disabled = true;
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 1000);
  }

  // Add haptic feedback for mobile
  addHapticFeedback() {
    if ('vibrate' in navigator) {
      document.addEventListener('click', (e) => {
        if (e.target.matches('.btn, .chip, .nearby-place')) {
          navigator.vibrate(10);
        }
      });
    }
  }

  // Add keyboard shortcuts
  addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'l':
            e.preventDefault();
            if (window.locationManager) {
              window.locationManager.useMyLocation();
            }
            break;
          case 'c':
            e.preventDefault();
            if (window.tourManager) {
              window.tourManager.clearTour();
            }
            break;
        }
      }
    });
  }

  // Add progress indicators
  addProgressIndicators() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList?.contains('loading-text')) {
              this.animateProgress(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  animateProgress(element) {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
    }, 200);
  }

  // Add tooltips for better guidance
  addTooltips() {
    const tooltips = {
      '[onclick*="useMyLocation"]': 'Get your current location (Ctrl+L)',
      '[onclick*="clearTour"]': 'Clear all stops (Ctrl+C)',
      '.traffic-toggle': 'Toggle real-time traffic data',
      '.mode-select': 'Choose your travel method'
    };

    Object.entries(tooltips).forEach(([selector, text]) => {
      document.querySelectorAll(selector).forEach(el => {
        el.title = text;
      });
    });
  }

  // Section animations now handled by section-manager.js
  static initSectionAnimations() {
    // Removed to prevent conflicts with section-manager.js
  }

  // Add stagger animations to lists
  static addStaggerAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const items = entry.target.children;
          Array.from(items).forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('animate-in');
          });
        }
      });
    });

    document.querySelectorAll('.nearby-places, .tour-stops').forEach(list => {
      observer.observe(list);
    });
  }
}

// Initialize UX enhancements
window.addEventListener('DOMContentLoaded', () => {
  window.uxEnhancements = new UXEnhancements();
  UXEnhancements.initSectionAnimations();
  UXEnhancements.addStaggerAnimations();
});