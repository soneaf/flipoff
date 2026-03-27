export class WeatherMode {
  constructor() {
    this.name = 'weather';
    this._timer = null;
    this._data = null;
    this._msgIndex = 0;
    this._fetchTimer = null;
  }

  async _fetchWeather() {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const { latitude, longitude } = pos.coords;
      const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
      if (res.ok) {
        this._data = await res.json();
      }
    } catch (e) {
      // Geolocation denied or weather API failed — show fallback
      this._data = null;
    }
  }

  getMessages() {
    if (!this._data) {
      return [['', '', 'WEATHER', 'LOADING ...', '']];
    }

    const msgs = [];
    const d = this._data;

    // Current conditions
    msgs.push([
      '',
      `${d.city}   ${d.temp} F`,
      d.description,
      `H ${d.high}   L ${d.low}`,
      ''
    ]);

    // Wind and humidity
    msgs.push([
      '',
      `${d.city}`,
      `WIND ${d.wind} MPH`,
      `HUMIDITY ${d.humidity} PCT`,
      ''
    ]);

    // Tomorrow forecast
    if (d.tomorrow) {
      msgs.push([
        '',
        'TOMORROW',
        d.tomorrow.description,
        `H ${d.tomorrow.high}   L ${d.tomorrow.low}`,
        ''
      ]);
    }

    return msgs;
  }

  getInterval() {
    return 8000;
  }

  async start(board, onDone) {
    await this._fetchWeather();
    this._msgIndex = 0;
    this._display(board, onDone);

    // Refresh weather data every 15 minutes
    this._fetchTimer = setInterval(() => this._fetchWeather(), 15 * 60 * 1000);
  }

  _display(board, onDone) {
    const msgs = this.getMessages();
    if (msgs.length === 0) return;

    board.displayMessage(msgs[this._msgIndex]);
    this._msgIndex++;

    if (this._msgIndex >= msgs.length) {
      this._msgIndex = 0;
      // Signal we've shown all our messages — mode manager can move on
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
    if (this._fetchTimer) {
      clearInterval(this._fetchTimer);
      this._fetchTimer = null;
    }
  }
}
