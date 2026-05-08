require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure directories exist
['outputs', 'uploads'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// Startup cleanup
function runStartupCleanup() {
  try {
    // Remove stale presentation records where files no longer exist
    const presentations = db.prepare('SELECT id, file_path_pptx, file_path_pdf FROM presentations').all();
    let removedPres = 0;
    for (const p of presentations) {
      const hasPptx = p.file_path_pptx && fs.existsSync(path.join(__dirname, p.file_path_pptx));
      const hasPdf  = p.file_path_pdf  && fs.existsSync(path.join(__dirname, p.file_path_pdf));
      const hasAnyFile = hasPptx || hasPdf;
      const hasNoPaths = !p.file_path_pptx && !p.file_path_pdf;
      if (!hasAnyFile && !hasNoPaths) {
        db.prepare('DELETE FROM presentations WHERE id = ?').run(p.id);
        removedPres++;
      }
    }
    if (removedPres > 0) console.log(`Startup cleanup: removed ${removedPres} stale presentation record(s).`);

    // Remove auto-created meeting records (manually_added = 0 or NULL)
    // These were created by old presentation generator runs — no longer needed
    db.pragma('foreign_keys = OFF');
    try {
      // Delete orphaned child records in meeting_results first
      const orphanedResults = db.prepare(`
        DELETE FROM meeting_results
        WHERE meeting_id IN (
          SELECT id FROM meetings WHERE manually_added = 0 OR manually_added IS NULL
        )
      `).run();
      if (orphanedResults.changes > 0) {
        console.log(`Startup cleanup: removed ${orphanedResults.changes} orphaned meeting_result record(s).`);
      }

      // Delete the stale meetings
      const staleResult = db.prepare(`
        DELETE FROM meetings WHERE manually_added = 0 OR manually_added IS NULL
      `).run();
      if (staleResult.changes > 0) {
        console.log(`Startup cleanup: removed ${staleResult.changes} auto-created meeting record(s).`);
      }

      // Remove duplicate meetings (same client, type, and day — keep lowest id)
      const dupOrphans = db.prepare(`
        DELETE FROM meeting_results
        WHERE meeting_id IN (
          SELECT id FROM meetings
          WHERE id NOT IN (SELECT MIN(id) FROM meetings GROUP BY client_id, meeting_type, date(created_at))
        )
      `).run();
      if (dupOrphans.changes > 0) {
        console.log(`Startup cleanup: removed ${dupOrphans.changes} duplicate meeting_result record(s).`);
      }

      const dupResult = db.prepare(`
        DELETE FROM meetings
        WHERE id NOT IN (
          SELECT MIN(id) FROM meetings GROUP BY client_id, meeting_type, date(created_at)
        )
      `).run();
      if (dupResult.changes > 0) {
        console.log(`Startup cleanup: removed ${dupResult.changes} duplicate meeting record(s).`);
      }
    } finally {
      db.pragma('foreign_keys = ON');
    }
  } catch (e) {
    console.error('Startup cleanup error:', e.message);
  }
}

runStartupCleanup();

// Routes
app.use('/api/clients', require('./routes/clients'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/presentations', require('./routes/presentations'));
app.use('/api/case-studies', require('./routes/case-studies'));
app.use('/api/company-info', require('./routes/company-info'));
app.use('/api/services', require('./routes/services'));
app.use('/api/visual-library', require('./routes/visual-library'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/meeting-results', require('./routes/meeting-results'));
app.use('/api/partner-brands', require('./routes/partner-brands'));
app.use('/api/brand-guide', require('./routes/brand-guide'));
app.use('/api/client-types', require('./routes/client-types'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
