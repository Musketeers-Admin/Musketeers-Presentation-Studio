const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM company_info ORDER BY key ASC').all();
  res.json(rows);
});

router.put('/', (req, res) => {
  const updates = req.body; // Array of {key, value}
  const upsert = db.prepare('INSERT OR REPLACE INTO company_info (key, value) VALUES (?, ?)');
  const upsertMany = db.transaction((items) => {
    for (const item of items) upsert.run(item.key, item.value);
  });
  upsertMany(updates);
  res.json({ success: true });
});

module.exports = router;
