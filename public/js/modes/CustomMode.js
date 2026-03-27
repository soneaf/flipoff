export class CustomMode {
  constructor() {
    this.name = 'custom';
    this._timer = null;
    this._messages = [];
    this._msgIndex = 0;
  }

  addMessage(lines) {
    // Pad to 5 lines, truncate to 22 chars
    while (lines.length < 5) lines.push('');
    this._messages.push(lines.slice(0, 5).map(l => l.substring(0, 22)));
  }

  clearMessages() {
    this._messages = [];
    this._msgIndex = 0;
  }

  setMessages(messages) {
    this._messages = messages;
    this._msgIndex = 0;
  }

  getMessages() {
    if (this._messages.length === 0) {
      return [['', '', 'WAITING FOR', 'YOUR MESSAGE', '']];
    }
    return this._messages;
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
