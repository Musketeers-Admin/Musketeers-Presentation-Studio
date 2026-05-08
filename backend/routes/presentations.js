const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { generatePresentationContent } = require('../services/claude');
const { generatePPTX } = require('../services/pptx-generator');
const { generatePDF } = require('../services/pdf-generator');

const SLIDE_NAMES = {
  1: 'Cover', 2: 'Who we are', 3: 'Who you are', 4: 'What we noticed',
  5: 'The challenge', 6: 'Our solution for you', 7: 'Discovery questions',
  8: 'Case study', 9: 'What we heard', 10: 'Scope of work',
  11: 'Timeline', 12: 'Investment', 13: 'How we work', 14: 'How revisions work',
  15: 'Day one playbook', 16: 'Your team', 17: "What we're building together",
  18: 'Week 1 expectations', 19: 'Next step', 20: 'Proof + Trusted by'
};

function getSuggestedSlides(meetingType, previousPresentations, learnedPrefs) {
  const previousTypes = previousPresentations.map(p => p.meeting_type);
  const hasHadM1 = previousTypes.includes('M1');
  const hasHadM2 = previousTypes.includes('M2') || previousTypes.includes('M2+M3');
  const hasHadM3 = previousTypes.includes('M3') || previousTypes.includes('M2+M3');
  const isFirstMeeting = previousPresentations.length === 0;

  let slides = [];
  let removedSlides = [];
  let learnedApplied = false;

  if (learnedPrefs && learnedPrefs.length >= 3) {
    const includedSlides = learnedPrefs
      .filter(p => p.included_pct >= 0.5)
      .map(p => p.slide_id)
      .sort((a, b) => a - b);
    if (includedSlides.length > 0) {
      slides = includedSlides;
      learnedApplied = true;
      if (!slides.includes(1)) slides.unshift(1);
      if (!slides.includes(19)) slides.push(19);
      return { slides, removedSlides, learnedApplied };
    }
  }

  if (meetingType === 'M1') {
    slides = [1, 3, 2, 20, 19];
    return { slides, removedSlides: [], learnedApplied };
  }

  slides.push(1);

  if (isFirstMeeting) {
    slides.push(2);
  } else {
    removedSlides.push({ id: 2, name: 'Who we are', reason: 'Client has already seen this in a previous meeting' });
  }

  if (meetingType === 'M2' || meetingType === 'M2+M3') {
    if (!hasHadM1) {
      slides.push(20);
    } else {
      removedSlides.push({ id: 20, name: 'Proof + Trusted by', reason: 'Client saw company numbers in M1' });
    }
  } else if (meetingType === 'M3') {
    if (!hasHadM1 && !hasHadM2) {
      slides.push(20);
    } else {
      removedSlides.push({ id: 20, name: 'Proof + Trusted by', reason: 'Client already seen company proof in earlier meeting' });
    }
  }

  if (meetingType === 'M2' || meetingType === 'M2+M3') {
    slides.push(3);
  } else if (meetingType === 'M3' && !hasHadM2) {
    slides.push(3);
  } else if (meetingType === 'M3' && hasHadM2) {
    removedSlides.push({ id: 3, name: 'Who you are', reason: 'Discovery (M2) already completed — client context established' });
  }

  if (meetingType === 'M3' || meetingType === 'M2+M3') slides.push(4);
  if (meetingType === 'M3' || meetingType === 'M2+M3') slides.push(5);
  if (['M3', 'M2+M3', 'M4'].includes(meetingType)) slides.push(6);
  if (['M2', 'M3', 'M2+M3'].includes(meetingType)) slides.push(7);
  if (['M2', 'M3', 'M2+M3'].includes(meetingType)) slides.push(8);

  if (meetingType === 'M4') { slides.push(9); slides.push(10); }
  if (['M4', 'M5'].includes(meetingType)) slides.push(11);
  if (meetingType === 'M4') slides.push(12);

  if (meetingType === 'M3' || meetingType === 'M2+M3') {
    slides.push(13);
  } else if (meetingType === 'M4') {
    if (!hasHadM3) {
      slides.push(13);
    } else {
      removedSlides.push({ id: 13, name: 'How we work', reason: 'Client saw this in M3 — not repeated (except in M5)' });
    }
  } else if (meetingType === 'M5') {
    slides.push(13);
  }

  if (meetingType === 'M5') {
    slides.push(14); slides.push(15); slides.push(16);
    slides.push(17); slides.push(18);
  }

  slides.push(19);

  return { slides, removedSlides, learnedApplied };
}

function getLearnedPrefs(meetingType) {
  const prefs = db.prepare(`
    SELECT slide_id, slide_name,
      SUM(CASE WHEN included = 1 THEN count ELSE 0 END) as included_count,
      SUM(count) as total_count,
      CAST(SUM(CASE WHEN included = 1 THEN count ELSE 0 END) AS REAL) / SUM(count) as included_pct
    FROM slide_preferences
    WHERE meeting_type = ?
    GROUP BY slide_id, slide_name
  `).all(meetingType);
  return prefs;
}

function recordSlidePreferences(meetingType, selectedSlides, allPossibleSlides) {
  const upsert = db.prepare(`
    INSERT INTO slide_preferences (meeting_type, slide_id, slide_name, included, count)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(meeting_type, slide_id) DO UPDATE SET
      included = excluded.included,
      count = slide_preferences.count + 1
  `);
  const upsertMany = db.transaction((items) => {
    for (const item of items) upsert.run(item.meeting_type, item.slide_id, item.slide_name, item.included);
  });
  const items = allPossibleSlides.map(id => ({
    meeting_type: meetingType,
    slide_id: id,
    slide_name: SLIDE_NAMES[id] || `Slide ${id}`,
    included: selectedSlides.includes(id) ? 1 : 0
  }));
  upsertMany(items);
}

router.get('/suggest-slides', (req, res) => {
  const { client_id, meeting_type } = req.query;
  // Use previous presentations (not meetings) for history
  const previousPresentations = db.prepare(
    'SELECT meeting_type, meeting_date FROM presentations WHERE client_id = ? AND meeting_type IS NOT NULL ORDER BY created_at ASC'
  ).all(client_id || 0);
  const learnedPrefs = getLearnedPrefs(meeting_type);
  const totalCount = learnedPrefs.reduce((acc, p) => acc + (p.total_count || 0), 0);
  const hasEnoughData = totalCount >= 3;
  const result = getSuggestedSlides(meeting_type, previousPresentations, hasEnoughData ? learnedPrefs : null);
  result.learnedPrefsAvailable = hasEnoughData;
  result.prefDataPoints = totalCount;
  res.json(result);
});

router.get('/reset-preferences', (req, res) => {
  const { meeting_type } = req.query;
  if (meeting_type) {
    db.prepare('DELETE FROM slide_preferences WHERE meeting_type = ?').run(meeting_type);
  } else {
    db.prepare('DELETE FROM slide_preferences').run();
  }
  res.json({ success: true });
});

router.get('/', (req, res) => {
  const { client_id } = req.query;
  let rows;
  if (client_id) {
    rows = db.prepare(`
      SELECT p.*, c.full_name, c.company_name
      FROM presentations p
      JOIN clients c ON p.client_id = c.id
      WHERE p.client_id = ?
      ORDER BY p.created_at DESC
    `).all(client_id);
  } else {
    rows = db.prepare(`
      SELECT p.*, c.full_name, c.company_name
      FROM presentations p
      JOIN clients c ON p.client_id = c.id
      ORDER BY p.created_at DESC
    `).all();
  }
  rows = rows.map(r => ({ ...r, slide_list: r.slide_list ? JSON.parse(r.slide_list) : [] }));
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM presentations WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.slide_list) row.slide_list = JSON.parse(row.slide_list);
  res.json(row);
});

router.post('/generate', async (req, res) => {
  const {
    client_id, meeting_type, meeting_date, service_pitched, notes, extra_context,
    slides: selectedSlides, case_study_ids, partner_brand_ids, output_format, brand_name_toggle,
    record_preferences, all_possible_slides
  } = req.body;

  try {
    const clientData = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id);
    if (!clientData) return res.status(404).json({ error: 'Client not found' });

    // Previous presentations used as meeting history for Claude context
    const previousPresentations = db.prepare(
      'SELECT meeting_type, meeting_date, meeting_notes as notes, extra_context FROM presentations WHERE client_id = ? AND meeting_type IS NOT NULL ORDER BY created_at ASC'
    ).all(client_id);

    // Manual meeting results (user-logged, not auto-created)
    const manualMeetings = db.prepare('SELECT * FROM meetings WHERE client_id = ? ORDER BY meeting_date ASC').all(client_id);
    const previousMeetingResults = manualMeetings.length > 0
      ? db.prepare(`SELECT mr.*, m.meeting_type FROM meeting_results mr JOIN meetings m ON mr.meeting_id = m.id WHERE mr.client_id = ? ORDER BY mr.result_date ASC`).all(client_id)
      : [];

    const caseStudies = case_study_ids && case_study_ids.length > 0
      ? db.prepare(`SELECT * FROM case_studies WHERE id IN (${case_study_ids.map(() => '?').join(',')})`).all(...case_study_ids)
      : [];

    caseStudies.forEach(cs => {
      cs.images = db.prepare('SELECT * FROM case_study_images WHERE case_study_id = ?').all(cs.id);
    });

    const partnerBrands = partner_brand_ids && partner_brand_ids.length > 0
      ? db.prepare(`SELECT * FROM partner_brands WHERE id IN (${partner_brand_ids.map(() => '?').join(',')})`).all(...partner_brand_ids)
      : [];

    const companyInfoRaw = db.prepare('SELECT key, value FROM company_info').all();
    const companyInfo = {};
    companyInfoRaw.forEach(row => { companyInfo[row.key] = row.value; });

    const services = db.prepare('SELECT * FROM services').all();

    if (record_preferences && all_possible_slides && all_possible_slides.length > 0) {
      recordSlidePreferences(meeting_type, selectedSlides, all_possible_slides);
    }

    if (service_pitched) {
      db.prepare('UPDATE clients SET preferred_service = ? WHERE id = ?').run(service_pitched, client_id);
    }

    // Build meeting object for Claude (no DB record created)
    const meeting = { meeting_type, meeting_date, service_pitched, notes, extra_context };

    // Call Claude API
    let slideContent;
    try {
      slideContent = await generatePresentationContent({
        client: clientData,
        meeting,
        previousMeetings: previousPresentations,
        previousMeetingResults,
        slides: selectedSlides,
        caseStudies,
        partnerBrands,
        brandNameToggle: brand_name_toggle,
        companyInfo,
        services
      });
    } catch (claudeError) {
      console.error('Claude API error:', claudeError);
      return res.status(500).json({ error: 'Claude API error: ' + claudeError.message });
    }

    // Generate files — only insert DB record if at least one file succeeds
    const timestamp = Date.now();
    const safeClientName = (clientData.company_name || clientData.full_name).replace(/[^a-zA-Z0-9]/g, '_');
    let filePptx = null;
    let filePdf = null;
    let pptxError = null;
    let pdfError = null;

    if (output_format === 'PPTX' || output_format === 'Both') {
      try {
        const pptxPath = path.join(__dirname, '..', 'outputs', `${safeClientName}_${meeting_type}_${timestamp}.pptx`);
        await generatePPTX({ slides: slideContent, clientName: clientData.full_name, outputPath: pptxPath, partnerBrands, backendDir: path.join(__dirname, '..') });
        filePptx = `/outputs/${safeClientName}_${meeting_type}_${timestamp}.pptx`;
      } catch (e) {
        pptxError = e.message;
        console.error('PPTX generation error:', e);
      }
    }

    if (output_format === 'PDF' || output_format === 'Both') {
      try {
        const pdfPath = path.join(__dirname, '..', 'outputs', `${safeClientName}_${meeting_type}_${timestamp}.pdf`);
        await generatePDF({ slides: slideContent, clientName: clientData.full_name, outputPath: pdfPath });
        filePdf = `/outputs/${safeClientName}_${meeting_type}_${timestamp}.pdf`;
      } catch (e) {
        pdfError = e.message;
        console.error('PDF generation error:', e);
      }
    }

    // If nothing was generated, return error without inserting DB record
    if (!filePptx && !filePdf) {
      const errMsg = [pptxError, pdfError].filter(Boolean).join('; ');
      return res.status(500).json({ error: 'File generation failed: ' + errMsg });
    }

    // Insert presentation record AFTER successful file generation
    const presResult = db.prepare(`
      INSERT INTO presentations (client_id, slide_list, output_format, file_path_pptx, file_path_pdf, brand_name_toggle,
        meeting_type, meeting_date, service_pitched, meeting_notes, extra_context)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      client_id, JSON.stringify(selectedSlides), output_format, filePptx, filePdf, brand_name_toggle ? 1 : 0,
      meeting_type, meeting_date, service_pitched, notes, extra_context
    );

    const response = {
      success: true,
      presentation_id: presResult.lastInsertRowid,
      file_path_pptx: filePptx,
      file_path_pdf: filePdf,
      slide_content: slideContent
    };

    if (pptxError) response.pptx_warning = pptxError;
    if (pdfError) response.pdf_warning = pdfError;

    res.json(response);

  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const pres = db.prepare('SELECT * FROM presentations WHERE id = ?').get(req.params.id);
  if (!pres) return res.status(404).json({ error: 'Not found' });

  // Delete files from disk
  const backendDir = path.join(__dirname, '..');
  if (pres.file_path_pptx) {
    const fullPath = path.join(backendDir, pres.file_path_pptx);
    try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch {}
  }
  if (pres.file_path_pdf) {
    const fullPath = path.join(backendDir, pres.file_path_pdf);
    try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch {}
  }

  db.prepare('DELETE FROM presentations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
module.exports.getSuggestedSlides = getSuggestedSlides;
module.exports.SLIDE_NAMES = SLIDE_NAMES;
