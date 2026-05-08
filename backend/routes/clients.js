const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*,
      COUNT(DISTINCT p.id) as meeting_count,
      (SELECT meeting_type FROM presentations WHERE client_id = c.id AND meeting_type IS NOT NULL ORDER BY created_at DESC LIMIT 1) as last_meeting_type,
      (SELECT meeting_date  FROM presentations WHERE client_id = c.id AND meeting_type IS NOT NULL ORDER BY created_at DESC LIMIT 1) as last_meeting_date,
      CASE WHEN EXISTS (SELECT 1 FROM presentations WHERE client_id = c.id AND meeting_type = 'M5') THEN 1 ELSE 0 END as is_client
    FROM clients c
    LEFT JOIN presentations p ON c.id = p.client_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(rows);
});

router.get('/search', (req, res) => {
  const { q } = req.query;
  const rows = db.prepare(`
    SELECT * FROM clients
    WHERE full_name LIKE ? OR company_name LIKE ? OR email LIKE ?
    ORDER BY full_name ASC
  `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Not found' });
  const meetings = db.prepare('SELECT * FROM meetings WHERE client_id = ? ORDER BY meeting_date DESC').all(req.params.id);
  const presentations = db.prepare('SELECT * FROM presentations WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ ...client, meetings, presentations });
});

router.post('/', (req, res) => {
  const { full_name, company_name, role, website_url, linkedin_url, industry, location, email, notes, client_type, preferred_service } = req.body;
  const result = db.prepare(`
    INSERT INTO clients (full_name, company_name, role, website_url, linkedin_url, industry, location, email, notes, client_type, preferred_service)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(full_name, company_name, role, website_url, linkedin_url, industry, location, email, notes, client_type || null, preferred_service || null);
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.json(client);
});

router.put('/:id', (req, res) => {
  const { full_name, company_name, role, website_url, linkedin_url, industry, location, email, notes, client_type, preferred_service } = req.body;
  db.prepare(`
    UPDATE clients SET full_name=?, company_name=?, role=?, website_url=?, linkedin_url=?, industry=?, location=?, email=?, notes=?, client_type=?, preferred_service=COALESCE(?, preferred_service)
    WHERE id=?
  `).run(full_name, company_name, role, website_url, linkedin_url, industry, location, email, notes, client_type || null, preferred_service || null, req.params.id);
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  res.json(client);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM meeting_results WHERE client_id = ?').run(req.params.id);
  db.prepare('DELETE FROM meetings WHERE client_id = ?').run(req.params.id);
  db.prepare('DELETE FROM presentations WHERE client_id = ?').run(req.params.id);
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
