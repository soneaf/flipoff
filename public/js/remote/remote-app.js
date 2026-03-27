import { SocketClient } from '../SocketClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const socket = new SocketClient();
  const statusDot = document.getElementById('status-dot');
  const modeGrid = document.getElementById('mode-grid');
  const themeGrid = document.getElementById('theme-grid');
  const messageInput = document.getElementById('message-input');
  const charCount = document.getElementById('char-count');
  const sendBtn = document.getElementById('send-btn');

  let currentMode = 'auto';
  let currentTheme = 'classic';

  // Connect
  socket.connect();

  socket.on('connected', () => {
    statusDot.classList.add('connected');
  });

  socket.on('disconnected', () => {
    statusDot.classList.remove('connected');
  });

  // Receive state from server
  socket.on('state', (msg) => {
    if (msg.config) {
      setActiveMode(msg.config.activeMode);
      setActiveTheme(msg.config.theme);
    }
  });

  socket.on('setMode', (msg) => setActiveMode(msg.mode));
  socket.on('setTheme', (msg) => setActiveTheme(msg.theme));

  // Mode buttons
  modeGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;
    const mode = btn.dataset.mode;
    socket.send({ type: 'setMode', mode });
    setActiveMode(mode);
    showToast(`Mode: ${mode}`);
  });

  function setActiveMode(mode) {
    currentMode = mode;
    modeGrid.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  // Theme buttons
  themeGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-swatch');
    if (!btn) return;
    const theme = btn.dataset.theme;
    socket.send({ type: 'setTheme', theme });
    setActiveTheme(theme);
    showToast(`Theme: ${theme}`);
  });

  function setActiveTheme(theme) {
    currentTheme = theme;
    themeGrid.querySelectorAll('.theme-swatch').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });
  }

  // Message input
  messageInput.addEventListener('input', () => {
    charCount.textContent = `${messageInput.value.length} / 110`;
  });

  sendBtn.addEventListener('click', () => {
    sendMessage();
  });

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Split into lines that fit 22 chars, center on the 5-row grid
    const words = text.toUpperCase().split(/\s+/);
    const rawLines = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= 22) {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      } else {
        if (currentLine) rawLines.push(currentLine);
        currentLine = word.substring(0, 22);
      }
    }
    if (currentLine) rawLines.push(currentLine);

    // Center vertically in 5 rows
    const lines = [];
    const startRow = Math.max(0, Math.floor((5 - rawLines.length) / 2));
    for (let i = 0; i < 5; i++) {
      const idx = i - startRow;
      lines.push(idx >= 0 && idx < rawLines.length ? rawLines[idx] : '');
    }

    socket.send({ type: 'sendMessage', lines });
    messageInput.value = '';
    charCount.textContent = '0 / 110';
    showToast('Message sent');
  }

  // Controls
  document.getElementById('btn-fullscreen').addEventListener('click', () => {
    socket.send({ type: 'requestFullscreen' });
    showToast('Fullscreen');
  });

  document.getElementById('btn-sound').addEventListener('click', () => {
    socket.send({ type: 'toggleSound' });
    showToast('Sound toggled');
  });

  document.getElementById('btn-prev').addEventListener('click', () => {
    socket.send({ type: 'prevMessage' });
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    socket.send({ type: 'nextMessage' });
  });

  // Settings
  document.getElementById('save-weather-key').addEventListener('click', () => {
    const key = document.getElementById('weather-key').value.trim();
    if (!key) return;
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openWeatherMapKey: key })
    }).then(() => {
      showToast('Weather API key saved');
      document.getElementById('weather-key').value = '';
    });
  });

  document.getElementById('save-mastertour-url').addEventListener('click', () => {
    const url = document.getElementById('mastertour-url').value.trim();
    if (!url) return;
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mastertourUrl: url })
    }).then(() => {
      showToast('MasterTour URL saved');
    });
  });

  // Toast
  let toastTimer = null;
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2000);
  }

  // Set initial mode
  setActiveMode('auto');
  setActiveTheme('classic');
});
