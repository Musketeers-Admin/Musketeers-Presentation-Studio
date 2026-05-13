const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

function requireAdmin(req, res, next) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

router.use(requireAdmin);

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, active, created_at, last_login FROM users ORDER BY created_at ASC').all();
  res.json(users);
});

router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const r = db.prepare('INSERT INTO users (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, 1)')
      .run(name, email.toLowerCase().trim(), hash, role || 'member');
    res.json(db.prepare('SELECT id, email, name, role, active, created_at FROM users WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already in use' });
    throw e;
  }
});

router.put('/:id', async (req, res) => {
  const { name, email, role, active } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE users SET name = ?, email = ?, role = ?, active = ? WHERE id = ?').run(
    name ?? user.name,
    email ? email.toLowerCase().trim() : user.email,
    role ?? user.role,
    active !== undefined ? (active ? 1 : 0) : user.active,
    req.params.id
  );
  res.json(db.prepare('SELECT id, email, name, role, active, created_at, last_login FROM users WHERE id = ?').get(req.params.id));
});

router.post('/:id/reset-password', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'New password required' });
  const hash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  if (parseInt(req.params.id) === req.session.userId) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
