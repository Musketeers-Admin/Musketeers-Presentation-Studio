const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value, updated_at FROM settings ORDER BY key').all();
  res.json(rows);
});

router.put('/', (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'key is required' });
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, value);
  res.json({ success: true });
});

router.get('/api-key-status', (req, res) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('anthropic_api_key');
  const hasKey = !!(row && row.value && row.value.trim().length > 10);
  res.json({ connected: hasKey });
});

module.exports = router;
