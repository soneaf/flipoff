import { Board } from './Board.js';
import { SoundEngine } from './SoundEngine.js';
import { KeyboardController } from './KeyboardController.js';
import { ModeManager } from './ModeManager.js';
import { ThemeManager } from './ThemeManager.js';
import { SocketClient } from './SocketClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const boardContainer = document.getElementById('board-container');
  const soundEngine = new SoundEngine();
  const board = new Board(boardContainer, soundEngine);
  const themeManager = new ThemeManager();
  const modeManager = new ModeManager(board);
  const socket = new SocketClient();

  // Keyboard controller — wrap modeManager to match expected interface
  const rotatorShim = {
    next() { modeManager.stop(); modeManager.start(); },
    prev() { modeManager.stop(); modeManager.start(); }
  };
  const keyboard = new KeyboardController(rotatorShim, soundEngine);

  // Initialize audio on first user interaction
  let audioInitialized = false;
  const initAudio = async () => {
    if (audioInitialized) return;
    audioInitialized = true;
    await soundEngine.init();
    soundEngine.resume();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
  };
  document.addEventListener('click', initAudio);
  document.addEventListener('keydown', initAudio);

  // Volume toggle
  const volumeBtn = document.getElementById('volume-btn');
  if (volumeBtn) {
    volumeBtn.addEventListener('click', () => {
      initAudio();
      const muted = soundEngine.toggleMute();
      volumeBtn.classList.toggle('muted', muted);
    });
  }

  // Connection status indicator
  const statusEl = document.getElementById('connection-status');

  // WebSocket connection
  socket.connect();

  socket.on('connected', () => {
    if (statusEl) statusEl.classList.add('connected');
  });

  socket.on('disconnected', () => {
    if (statusEl) statusEl.classList.remove('connected');
  });

  socket.on('state', (msg) => {
    if (msg.config) {
      themeManager.apply(msg.config.theme);
      if (msg.config.enabledModes) {
        modeManager.setEnabledModes(msg.config.enabledModes);
      }
      if (msg.config.activeMode) {
        modeManager.setActiveMode(msg.config.activeMode);
      }
    }
  });

  socket.on('setMode', (msg) => {
    modeManager.setActiveMode(msg.mode);
  });

  socket.on('setTheme', (msg) => {
    themeManager.apply(msg.theme);
  });

  socket.on('sendMessage', (msg) => {
    initAudio();
    modeManager.displayMessage(msg.lines);
  });

  socket.on('toggleSound', () => {
    initAudio();
    const muted = soundEngine.toggleMute();
    if (volumeBtn) volumeBtn.classList.toggle('muted', muted);
  });

  socket.on('requestFullscreen', () => {
    document.documentElement.requestFullscreen().catch(() => {});
  });

  socket.on('settingsUpdated', (msg) => {
    if (msg.config) {
      if (msg.config.theme) themeManager.apply(msg.config.theme);
      if (msg.config.enabledModes) modeManager.setEnabledModes(msg.config.enabledModes);
      if (msg.config.activeMode) modeManager.setActiveMode(msg.config.activeMode);
    }
  });

  // Fetch initial settings and start
  fetch('/api/settings')
    .then(res => res.json())
    .then(settings => {
      themeManager.apply(settings.theme);
      modeManager.setEnabledModes(settings.enabledModes);
      modeManager.setActiveMode(settings.activeMode);
    })
    .catch(() => {
      modeManager.start();
    });

  // Double-click to go fullscreen (TV mode)
  boardContainer.addEventListener('dblclick', () => {
    initAudio();
    document.documentElement.requestFullscreen().catch(() => {});
  });
});
