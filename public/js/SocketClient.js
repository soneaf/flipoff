export class SocketClient {
  constructor() {
    this._ws = null;
    this._handlers = {};
    this._reconnectTimer = null;
    this._reconnectDelay = 1000;
  }

  connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this._ws = new WebSocket(`${protocol}//${location.host}/ws`);

    this._ws.onopen = () => {
      this._reconnectDelay = 1000;
      this._emit('connected');
    };

    this._ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._emit(msg.type, msg);
      } catch (e) {
        // ignore
      }
    };

    this._ws.onclose = () => {
      this._emit('disconnected');
      // Auto-reconnect with backoff
      this._reconnectTimer = setTimeout(() => {
        this._reconnectDelay = Math.min(this._reconnectDelay * 2, 30000);
        this.connect();
      }, this._reconnectDelay);
    };

    this._ws.onerror = () => {
      // onclose will fire after this
    };
  }

  send(msg) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(msg));
    }
  }

  on(event, handler) {
    if (!this._handlers[event]) {
      this._handlers[event] = [];
    }
    this._handlers[event].push(handler);
  }

  _emit(event, data) {
    const handlers = this._handlers[event];
    if (handlers) {
      for (const h of handlers) h(data);
    }
  }

  disconnect() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
    }
    if (this._ws) {
      this._ws.close();
    }
  }
}
