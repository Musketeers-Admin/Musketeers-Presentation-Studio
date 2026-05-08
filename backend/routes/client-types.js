const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM client_types ORDER BY id ASC').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM client_types WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.get('/by-name/:name', (req, res) => {
  const row = db.prepare('SELECT * FROM client_types WHERE name = ?').get(req.params.name);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { name, description, positioning_notes, key_pain_points, recommended_services, example_companies } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const r = db.prepare(`
      INSERT INTO client_types (name, description, positioning_notes, key_pain_points, recommended_services, example_companies)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description, positioning_notes, key_pain_points, recommended_services, example_companies);
    res.json(db.prepare('SELECT * FROM client_types WHERE id = ?').get(r.lastInsertRowid));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, description, positioning_notes, key_pain_points, recommended_services, example_companies } = req.body;
  const existing = db.prepare('SELECT * FROM client_types WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  try {
    db.prepare(`
      UPDATE client_types SET name=?, description=?, positioning_notes=?, key_pain_points=?, recommended_services=?, example_companies=?
      WHERE id=?
    `).run(name || existing.name, description, positioning_notes, key_pain_points, recommended_services, example_companies, req.params.id);
    res.json(db.prepare('SELECT * FROM client_types WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM client_types WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
