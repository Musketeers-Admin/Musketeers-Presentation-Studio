require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const fs = require('fs');
const db = require('./database');

const DATA_DIR    = process.env.DATA_DIR   || __dirname;
const OUTPUTS_DIR = process.env.OUTPUTS_DIR || path.join(DATA_DIR, 'outputs');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(DATA_DIR, 'uploads');

process.env._OUTPUTS_DIR = OUTPUTS_DIR;
process.env._UPLOADS_DIR = UPLOADS_DIR;

const app = express();

// Trust Railway's proxy so secure cookies work over HTTPS
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// CORS — reflect origin so credentials (session cookies) work in development
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Session middleware
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: DATA_DIR }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
}));

app.use('/outputs', express.static(OUTPUTS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Ensure data directories exist
[OUTPUTS_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Auth middleware — applied after /api/auth routes
function requireAuth(req, res, next) {
  if (req.session?.userId) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Startup cleanup
function runStartupCleanup() {
  try {
    const presentations = db.prepare('SELECT id, file_path_pptx, file_path_pdf FROM presentations').all();
    let removedPres = 0;
    for (const p of presentations) {
      const hasPptx = p.file_path_pptx && fs.existsSync(path.join(__dirname, p.file_path_pptx));
      const hasPdf  = p.file_path_pdf  && fs.existsSync(path.join(__dirname, p.file_path_pdf));
      const hasNoPaths = !p.file_path_pptx && !p.file_path_pdf;
      if (!hasPptx && !hasPdf && !hasNoPaths) {
        db.prepare('DELETE FROM presentations WHERE id = ?').run(p.id);
        removedPres++;
      }
    }
    if (removedPres > 0) console.log(`Startup cleanup: removed ${removedPres} stale presentation record(s).`);

    db.pragma('foreign_keys = OFF');
    try {
      const orphanedResults = db.prepare(`
        DELETE FROM meeting_results
        WHERE meeting_id IN (SELECT id FROM meetings WHERE manually_added = 0 OR manually_added IS NULL)
      `).run();
      if (orphanedResults.changes > 0) console.log(`Startup cleanup: removed ${orphanedResults.changes} orphaned meeting_result record(s).`);

      const staleResult = db.prepare(`DELETE FROM meetings WHERE manually_added = 0 OR manually_added IS NULL`).run();
      if (staleResult.changes > 0) console.log(`Startup cleanup: removed ${staleResult.changes} auto-created meeting record(s).`);

      const dupOrphans = db.prepare(`
        DELETE FROM meeting_results
        WHERE meeting_id IN (
          SELECT id FROM meetings
          WHERE id NOT IN (SELECT MIN(id) FROM meetings GROUP BY client_id, meeting_type, date(created_at))
        )
      `).run();
      if (dupOrphans.changes > 0) console.log(`Startup cleanup: removed ${dupOrphans.changes} duplicate meeting_result record(s).`);

      const dupResult = db.prepare(`
        DELETE FROM meetings WHERE id NOT IN (
          SELECT MIN(id) FROM meetings GROUP BY client_id, meeting_type, date(created_at)
        )
      `).run();
      if (dupResult.changes > 0) console.log(`Startup cleanup: removed ${dupResult.changes} duplicate meeting record(s).`);
    } finally {
      db.pragma('foreign_keys = ON');
    }
  } catch (e) {
    console.error('Startup cleanup error:', e.message);
  }
}

runStartupCleanup();

// Unprotected: auth routes (login, logout, me)
app.use('/api/auth', require('./routes/auth'));

// All other /api routes require a valid session
app.use('/api', requireAuth);

// Protected routes
app.use('/api/clients',       require('./routes/clients'));
app.use('/api/meetings',      require('./routes/meetings'));
app.use('/api/presentations', require('./routes/presentations'));
app.use('/api/case-studies',  require('./routes/case-studies'));
app.use('/api/company-info',  require('./routes/company-info'));
app.use('/api/services',      require('./routes/services'));
app.use('/api/visual-library',require('./routes/visual-library'));
app.use('/api/settings',      require('./routes/settings'));
app.use('/api/meeting-results',require('./routes/meeting-results'));
app.use('/api/partner-brands',require('./routes/partner-brands'));
app.use('/api/brand-guide',   require('./routes/brand-guide'));
app.use('/api/client-types',  require('./routes/client-types'));
app.use('/api/users',         require('./routes/users'));

// Production: serve React build
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../frontend/build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get('*', (_req, res) => res.sendFile(path.join(buildPath, 'index.html')));
  }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`UPLOADS_DIR: ${UPLOADS_DIR}`);
  console.log(`OUTPUTS_DIR: ${OUTPUTS_DIR}`);
});
