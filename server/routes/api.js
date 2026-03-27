import { Router } from 'express';

const router = Router();

// Get current settings
router.get('/settings', (req, res) => {
  const { config } = req.app.locals;
  res.json({
    theme: config.theme,
    activeMode: config.activeMode,
    enabledModes: config.enabledModes,
    modeRotationInterval: config.modeRotationInterval,
    hasWeatherKey: !!config.openWeatherMapKey,
    hasMastertourUrl: !!config.mastertourUrl
  });
});

// Update settings
router.put('/settings', (req, res) => {
  const { config, saveConfig, broadcast } = req.app.locals;
  const allowed = ['theme', 'activeMode', 'enabledModes', 'modeRotationInterval', 'openWeatherMapKey', 'mastertourUrl'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      config[key] = req.body[key];
    }
  }

  saveConfig(config);
  broadcast({ type: 'settingsUpdated', config: { theme: config.theme, activeMode: config.activeMode, enabledModes: config.enabledModes } });
  res.json({ ok: true });
});

// Push a message to the board
router.post('/message', (req, res) => {
  const { broadcast } = req.app.locals;
  const { lines } = req.body;

  if (!lines || !Array.isArray(lines)) {
    return res.status(400).json({ error: 'lines must be an array of strings' });
  }

  // Pad to 5 lines
  while (lines.length < 5) lines.push('');

  broadcast({ type: 'sendMessage', lines: lines.slice(0, 5) });
  res.json({ ok: true });
});

// Get available modes
router.get('/modes', (req, res) => {
  res.json({
    available: ['clock', 'weather', 'tour', 'quotes', 'custom'],
    enabled: req.app.locals.config.enabledModes,
    active: req.app.locals.config.activeMode
  });
});

export { router as apiRouter };
