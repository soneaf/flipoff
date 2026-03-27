export class TourMode {
  constructor() {
    this.name = 'tour';
    this._timer = null;
    this._data = null;
    this._msgIndex = 0;
    this._fetchTimer = null;
  }

  async _fetchTourData() {
    try {
      const res = await fetch('/api/tour/next');
      if (res.ok) {
        this._data = await res.json();
      }
    } catch (e) {
      this._data = null;
    }
  }

  _formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }

  getMessages() {
    if (!this._data) {
      return [['', '', 'TOUR DATA', 'UNAVAILABLE', '']];
    }

    const msgs = [];

    // Next show
    if (this._data.nextShow) {
      const s = this._data.nextShow;
      msgs.push([
        '',
        'NEXT SHOW',
        `${s.city}  ${s.state}`,
        `${this._formatDate(s.date)}  ${s.venue}`.substring(0, 22),
        ''
      ]);
    }

    // Next flight
    if (this._data.nextFlight) {
      const f = this._data.nextFlight;
      const flightLabel = f.airline ? `${f.airline} ${f.flightNumber}` : `FLIGHT ${f.flightNumber}`;
      msgs.push([
        '',
        flightLabel.substring(0, 22),
        `${f.origin}  -  ${f.destination}`,
        `DEP ${f.departureTime}`,
        ''
      ]);
    }

    // Next hotel
    if (this._data.nextHotel) {
      const h = this._data.nextHotel;
      msgs.push([
        '',
        'HOTEL',
        h.name.substring(0, 22),
        h.city ? h.city.toUpperCase().substring(0, 22) : '',
        ''
      ]);
    }

    if (msgs.length === 0) {
      msgs.push(['', '', 'NO UPCOMING', 'TOUR DATES', '']);
    }

    return msgs;
  }

  getInterval() {
    return 8000;
  }

  async start(board, onDone) {
    await this._fetchTourData();
    this._msgIndex = 0;
    this._display(board, onDone);

    this._fetchTimer = setInterval(() => this._fetchTourData(), 30 * 60 * 1000);
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
    if (this._fetchTimer) {
      clearInterval(this._fetchTimer);
      this._fetchTimer = null;
    }
  }
}
