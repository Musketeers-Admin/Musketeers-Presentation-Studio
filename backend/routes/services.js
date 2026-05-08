const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM services ORDER BY id ASC').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { name, track, description, pricing_tier_1, pricing_tier_2, pricing_tier_3, pricing_custom, deliverables } = req.body;
  const r = db.prepare(`
    INSERT INTO services (name, track, description, pricing_tier_1, pricing_tier_2, pricing_tier_3, pricing_custom, deliverables)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, track, description, pricing_tier_1, pricing_tier_2, pricing_tier_3, pricing_custom ? 1 : 0, typeof deliverables === 'string' ? deliverables : JSON.stringify(deliverables));
  res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, track, description, pricing_tier_1, pricing_tier_2, pricing_tier_3, pricing_custom, deliverables } = req.body;
  db.prepare(`
    UPDATE services SET name=?, track=?, description=?, pricing_tier_1=?, pricing_tier_2=?, pricing_tier_3=?, pricing_custom=?, deliverables=?
    WHERE id=?
  `).run(name, track, description, pricing_tier_1, pricing_tier_2, pricing_tier_3, pricing_custom ? 1 : 0, typeof deliverables === 'string' ? deliverables : JSON.stringify(deliverables), req.params.id);
  res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
