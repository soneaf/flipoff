import { MESSAGES } from '../constants.js';

export class QuoteMode {
  constructor() {
    this.name = 'quotes';
    this._timer = null;
    this._msgIndex = 0;
  }

  getMessages() {
    return MESSAGES;
  }

  getInterval() {
    return 8000;
  }

  start(board, onDone) {
    this._msgIndex = 0;
    this._display(board, onDone);
  }

  _display(board, onDone) {
    const msgs = this.getMessages();
    if (msgs.length === 0) return;

    board.displayMessage(msgs[this._msgIndex]);
    this._msgIndex++;

    if (this._msgIndex >= msgs.length) {
      this._msgIndex = 0;
      if (onDone) {
        this._timer = setTimeout(() => onDone(), this.getInterval());
        return;
      }
    }

    this._timer = setTimeout(() => this._display(board, onDone), this.getInterval());
  }

  stop() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}
