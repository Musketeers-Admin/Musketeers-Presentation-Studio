const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const visualDir = path.join(process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'), 'visual-library');
if (!fs.existsSync(visualDir)) fs.mkdirSync(visualDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, visualDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({ storage });

router.get('/', (req, res) => {
  const { q } = req.query;
  let rows;
  if (q) {
    rows = db.prepare('SELECT * FROM visual_library WHERE description LIKE ? OR tags LIKE ? OR original_name LIKE ? ORDER BY created_at DESC').all(`%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare('SELECT * FROM visual_library ORDER BY created_at DESC').all();
  }
  res.json(rows);
});

router.post('/', upload.single('image'), (req, res) => {
  const { description, tags } = req.body;
  const filePath = `/uploads/visual-library/${req.file.filename}`;
  const r = db.prepare('INSERT INTO visual_library (filename, original_name, description, tags, file_path) VALUES (?, ?, ?, ?, ?)').run(req.file.filename, req.file.originalname, description, tags, filePath);
  res.json(db.prepare('SELECT * FROM visual_library WHERE id = ?').get(r.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM visual_library WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
