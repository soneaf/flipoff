export class ClockMode {
  constructor() {
    this.name = 'clock';
    this._timer = null;
  }

  getMessages() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();

    const timeStr = `${hours} : ${minutes}   ${ampm}`;

    return [[
      '',
      timeStr,
      dayName,
      `${monthName} ${date}  ${year}`,
      ''
    ]];
  }

  getInterval() {
    return 60000; // Update every minute
  }

  start(board, onDone) {
    this._display(board);
    this._timer = setInterval(() => this._display(board), 60000);
  }

  _display(board) {
    const msgs = this.getMessages();
    if (msgs.length > 0) {
      board.displayMessage(msgs[0]);
    }
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}
