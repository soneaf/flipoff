export const THEMES = {
  classic: {
    name: 'Classic',
    description: 'Original dark board with colorful scramble'
  },
  airport: {
    name: 'Airport',
    description: 'White Solari board with yellow accents'
  },
  'train-station': {
    name: 'Train Station',
    description: 'Dark green tiles, warm white text'
  },
  neon: {
    name: 'Neon',
    description: 'Black board with cyan and magenta glow'
  },
  minimal: {
    name: 'Minimal',
    description: 'Clean dark gray, no color scramble'
  }
};

export class ThemeManager {
  constructor() {
    this._currentTheme = 'classic';
  }

  get current() {
    return this._currentTheme;
  }

  apply(themeName) {
    if (!THEMES[themeName]) return;
    this._currentTheme = themeName;

    const board = document.querySelector('.board');
    if (board) {
      board.setAttribute('data-theme', themeName);
    }
  }
}
