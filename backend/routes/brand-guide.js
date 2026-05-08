const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const logoDir = path.join(__dirname, '..', 'uploads', 'brand-logos');
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logoDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.slot || 'logo'}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM brand_guide').all();
  const guide = {};
  rows.forEach(r => { guide[r.key] = r.value; });
  res.json(guide);
});

router.put('/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  db.prepare(`
    INSERT INTO brand_guide (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, value);
  res.json({ key, value });
});

router.put('/', (req, res) => {
  const updates = req.body;
  const upsert = db.prepare(`
    INSERT INTO brand_guide (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  const upsertAll = db.transaction((entries) => {
    for (const [key, value] of entries) upsert.run(key, value);
  });
  upsertAll(Object.entries(updates));
  res.json({ success: true });
});

router.post('/logo/:slot', upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const key = `logo_${req.params.slot}`;
  const logoPath = `/uploads/brand-logos/${req.file.filename}`;
  db.prepare(`
    INSERT INTO brand_guide (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, logoPath);
  res.json({ key, value: logoPath });
});

module.exports = router;
