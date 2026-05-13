const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/me', (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.prepare('SELECT id, email, name, role, last_login FROM users WHERE id = ?').get(req.session.userId);
  if (!user) { req.session.destroy(); return res.status(401).json({ error: 'User not found' }); }
  res.json(user);
});

router.put('/profile', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { name, currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Current password required to set a new one' });
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET name = ?, password_hash = ? WHERE id = ?').run(name || user.name, hash, user.id);
  } else {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name || user.name, user.id);
  }
  res.json(db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(user.id));
});

module.exports = router;
