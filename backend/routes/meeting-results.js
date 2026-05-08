const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const resultsDir = path.join(__dirname, '..', 'uploads', 'meeting-results');
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resultsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const { meeting_id, client_id } = req.query;
  let rows;
  if (meeting_id) {
    rows = db.prepare('SELECT * FROM meeting_results WHERE meeting_id = ? ORDER BY created_at DESC').all(meeting_id);
  } else if (client_id) {
    rows = db.prepare('SELECT * FROM meeting_results WHERE client_id = ? ORDER BY created_at DESC').all(client_id);
  } else {
    rows = db.prepare('SELECT * FROM meeting_results ORDER BY created_at DESC').all();
  }
  rows = rows.map(r => ({ ...r, file_paths: r.file_paths ? JSON.parse(r.file_paths) : [] }));
  res.json(rows);
});

router.post('/', upload.array('files', 10), (req, res) => {
  const { meeting_id, client_id, notes, result_date } = req.body;
  if (!meeting_id || !client_id) return res.status(400).json({ error: 'meeting_id and client_id required' });

  const filePaths = (req.files || []).map(f => `/uploads/meeting-results/${f.filename}`);

  const result = db.prepare(`
    INSERT INTO meeting_results (meeting_id, client_id, notes, file_paths, result_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(meeting_id, client_id, notes || '', JSON.stringify(filePaths), result_date || new Date().toISOString().split('T')[0]);

  const row = db.prepare('SELECT * FROM meeting_results WHERE id = ?').get(result.lastInsertRowid);
  res.json({ ...row, file_paths: JSON.parse(row.file_paths || '[]') });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM meeting_results WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
