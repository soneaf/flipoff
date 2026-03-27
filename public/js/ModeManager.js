import { ClockMode } from './modes/ClockMode.js';
import { WeatherMode } from './modes/WeatherMode.js';
import { TourMode } from './modes/TourMode.js';
import { QuoteMode } from './modes/QuoteMode.js';
import { CustomMode } from './modes/CustomMode.js';

export class ModeManager {
  constructor(board) {
    this.board = board;
    this._modes = {
      clock: new ClockMode(),
      weather: new WeatherMode(),
      tour: new TourMode(),
      quotes: new QuoteMode(),
      custom: new CustomMode()
    };
    this._enabledModes = ['clock', 'weather', 'quotes'];
    this._activeMode = 'auto'; // 'auto' rotates, or pin to a specific mode
    this._currentModeIndex = 0;
    this._currentMode = null;
    this._rotationTimer = null;
  }

  get customMode() {
    return this._modes.custom;
  }

  setEnabledModes(modes) {
    this._enabledModes = modes.filter(m => this._modes[m]);
  }

  setActiveMode(mode) {
    this._activeMode = mode;
    this.stop();

    if (mode === 'auto') {
      this._currentModeIndex = 0;
      this._startCurrentMode();
    } else if (this._modes[mode]) {
      this._startMode(this._modes[mode]);
    }
  }

  start() {
    if (this._activeMode === 'auto') {
      this._currentModeIndex = 0;
      this._startCurrentMode();
    } else {
      const mode = this._modes[this._activeMode];
      if (mode) this._startMode(mode);
    }
  }

  stop() {
    if (this._currentMode) {
      this._currentMode.stop();
      this._currentMode = null;
    }
    if (this._rotationTimer) {
      clearTimeout(this._rotationTimer);
      this._rotationTimer = null;
    }
  }

  _startCurrentMode() {
    if (this._enabledModes.length === 0) return;

    const modeName = this._enabledModes[this._currentModeIndex % this._enabledModes.length];
    const mode = this._modes[modeName];

    if (mode) {
      this._startMode(mode, () => {
        // When mode finishes its cycle, advance to next
        this._currentModeIndex = (this._currentModeIndex + 1) % this._enabledModes.length;
        this._startCurrentMode();
      });
    }
  }

  _startMode(mode, onDone) {
    if (this._currentMode) {
      this._currentMode.stop();
    }
    this._currentMode = mode;
    mode.start(this.board, onDone || null);
  }

  // Display a one-off message (from remote control), then resume
  displayMessage(lines) {
    if (this._currentMode) {
      this._currentMode.stop();
    }

    this.board.displayMessage(lines);

    // Resume after showing the message
    this._rotationTimer = setTimeout(() => {
      if (this._activeMode === 'auto') {
        this._startCurrentMode();
      } else {
        const mode = this._modes[this._activeMode];
        if (mode) this._startMode(mode);
      }
    }, 10000);
  }
}
