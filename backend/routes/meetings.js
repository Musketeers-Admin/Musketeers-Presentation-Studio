const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { client_id } = req.query;
  let rows;
  if (client_id) {
    rows = db.prepare('SELECT * FROM meetings WHERE client_id = ? ORDER BY meeting_date DESC').all(client_id);
  } else {
    rows = db.prepare('SELECT * FROM meetings ORDER BY meeting_date DESC').all();
  }
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { client_id, meeting_type, meeting_date, service_pitched, notes, extra_context } = req.body;
  const result = db.prepare(`
    INSERT INTO meetings (client_id, meeting_type, meeting_date, service_pitched, notes, extra_context, manually_added)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(client_id, meeting_type, meeting_date, service_pitched, notes, extra_context);
  const row = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);
  res.json(row);
});

router.put('/:id', (req, res) => {
  const { meeting_type, meeting_date, service_pitched, notes, extra_context } = req.body;
  db.prepare(`
    UPDATE meetings SET meeting_type=?, meeting_date=?, service_pitched=?, notes=?, extra_context=?
    WHERE id=?
  `).run(meeting_type, meeting_date, service_pitched, notes, extra_context, req.params.id);
  const row = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM meetings WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
