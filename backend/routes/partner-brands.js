const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const uploadDir = path.join(process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'), 'partner-logos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM partner_brands ORDER BY name ASC').all();
  res.json(rows);
});

router.post('/', upload.single('logo'), (req, res) => {
  const { name, industry_tag, nda } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const logo_path = req.file ? `/uploads/partner-logos/${req.file.filename}` : null;
  const result = db.prepare(
    'INSERT INTO partner_brands (name, logo_path, industry_tag, nda) VALUES (?, ?, ?, ?)'
  ).run(name, logo_path, industry_tag || null, nda === 'true' || nda === true ? 1 : 0);
  const row = db.prepare('SELECT * FROM partner_brands WHERE id = ?').get(result.lastInsertRowid);
  res.json(row);
});

router.put('/:id', upload.single('logo'), (req, res) => {
  const { name, industry_tag, nda } = req.body;
  const existing = db.prepare('SELECT * FROM partner_brands WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const logo_path = req.file ? `/uploads/partner-logos/${req.file.filename}` : existing.logo_path;
  db.prepare(
    'UPDATE partner_brands SET name = ?, logo_path = ?, industry_tag = ?, nda = ? WHERE id = ?'
  ).run(name || existing.name, logo_path, industry_tag ?? existing.industry_tag, nda === 'true' || nda === true ? 1 : 0, req.params.id);
  const row = db.prepare('SELECT * FROM partner_brands WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM partner_brands WHERE id = ?').get(req.params.id);
  if (row?.logo_path) {
    const filePath = path.join(__dirname, '..', row.logo_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare('DELETE FROM partner_brands WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
