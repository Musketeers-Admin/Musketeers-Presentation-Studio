const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const csImgDir = path.join(process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'), 'case-study-images');
if (!fs.existsSync(csImgDir)) fs.mkdirSync(csImgDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, csImgDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM case_studies ORDER BY created_at DESC').all();
  rows.forEach(r => {
    const images = db.prepare('SELECT * FROM case_study_images WHERE case_study_id = ?').all(r.id);
    r.images = images;
  });
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM case_studies WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  row.images = db.prepare('SELECT * FROM case_study_images WHERE case_study_id = ?').all(row.id);
  res.json(row);
});

router.post('/', (req, res) => {
  const { title, client_name, industry, service_type, client_type_tag, situation, problem, solution, result, metrics, testimonial, nda, duration, relationship_status } = req.body;
  const r = db.prepare(`
    INSERT INTO case_studies (title, client_name, industry, service_type, client_type_tag, situation, problem, solution, result, metrics, testimonial, nda, duration, relationship_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, client_name, industry, service_type, client_type_tag, situation, problem, solution, result, metrics, testimonial, nda ? 1 : 0, duration || null, relationship_status || 'Active');
  const cs = db.prepare('SELECT * FROM case_studies WHERE id = ?').get(r.lastInsertRowid);
  cs.images = [];
  res.json(cs);
});

router.put('/:id', (req, res) => {
  const { title, client_name, industry, service_type, client_type_tag, situation, problem, solution, result, metrics, testimonial, nda, duration, relationship_status } = req.body;
  db.prepare(`
    UPDATE case_studies SET title=?, client_name=?, industry=?, service_type=?, client_type_tag=?, situation=?, problem=?, solution=?, result=?, metrics=?, testimonial=?, nda=?, duration=?, relationship_status=?
    WHERE id=?
  `).run(title, client_name, industry, service_type, client_type_tag, situation, problem, solution, result, metrics, testimonial, nda ? 1 : 0, duration || null, relationship_status || 'Active', req.params.id);
  const cs = db.prepare('SELECT * FROM case_studies WHERE id = ?').get(req.params.id);
  cs.images = db.prepare('SELECT * FROM case_study_images WHERE case_study_id = ?').all(req.params.id);
  res.json(cs);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM case_study_images WHERE case_study_id = ?').run(req.params.id);
  db.prepare('DELETE FROM case_studies WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Section-based image upload
router.post('/:id/images', upload.single('image'), (req, res) => {
  const { description, tags, section } = req.body;
  const imagePath = `/uploads/case-study-images/${req.file.filename}`;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM case_study_images WHERE case_study_id = ? AND section = ?').get(req.params.id, section || null);
  const sortOrder = (maxOrder?.m ?? -1) + 1;
  const r = db.prepare('INSERT INTO case_study_images (case_study_id, section, image_path, description, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(req.params.id, section || null, imagePath, description, tags, sortOrder);
  res.json(db.prepare('SELECT * FROM case_study_images WHERE id = ?').get(r.lastInsertRowid));
});

router.delete('/:csId/images/:imgId', (req, res) => {
  db.prepare('DELETE FROM case_study_images WHERE id = ? AND case_study_id = ?').run(req.params.imgId, req.params.csId);
  res.json({ success: true });
});

module.exports = router;
