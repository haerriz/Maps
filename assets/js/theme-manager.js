// Theme Manager - Handle light/dark/system theme switching

class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || 'system';
    this.init();
  }

  init() {
    this.createThemeToggle();
    this.applyTheme(this.currentTheme);
    this.setupSystemThemeListener();
  }

  createThemeToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.title = 'Toggle theme (Light/Dark/System)';
    toggle.innerHTML = '<span class="material-icons">brightness_6</span>';
    toggle.addEventListener('click', () => this.cycleTheme());
    document.body.appendChild(toggle);
    this.toggleButton = toggle;
  }

  cycleTheme() {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  setTheme(theme) {
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.storeTheme(theme);
    this.updateToggleIcon(theme);
  }

  applyTheme(theme) {
    const html = document.documentElement;
    
    // Remove existing theme classes
    html.removeAttribute('data-theme');
    
    if (theme === 'system') {
      // Use system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        html.setAttribute('data-theme', 'dark');
      }
    } else {
      html.setAttribute('data-theme', theme);
    }
  }

  updateToggleIcon(theme) {
    const icons = {
      light: 'light_mode',
      dark: 'dark_mode',
      system: 'brightness_auto'
    };
    
    const titles = {
      light: 'Light mode active - Click for dark mode',
      dark: 'Dark mode active - Click for system mode', 
      system: 'System mode active - Click for light mode'
    };
    
    this.toggleButton.innerHTML = `<span class="material-icons">${icons[theme]}</span>`;
    this.toggleButton.title = titles[theme];
  }

  setupSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applyTheme('system');
      }
    });
  }

  getStoredTheme() {
    try {
      return localStorage.getItem('theme-preference');
    } catch (error) {
      return null;
    }
  }

  storeTheme(theme) {
    try {
      localStorage.setItem('theme-preference', theme);
    } catch (error) {
      console.log('Could not store theme preference');
    }
  }

  // Public method to get current effective theme
  getEffectiveTheme() {
    if (this.currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }
}

// Initialize theme manager
window.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});