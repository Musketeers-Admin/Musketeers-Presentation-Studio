const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const WM_DARK_DEFAULT  = path.join(ASSETS_DIR, 'wordmark-dark.png');
const WM_LIGHT_DEFAULT = path.join(ASSETS_DIR, 'wordmark-light.png');

// Module-level vars updated per generation from DB
let WM_DARK  = WM_DARK_DEFAULT;
let WM_LIGHT = WM_LIGHT_DEFAULT;

// ── Sanitize ───────────────────────────────────────────────
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/[ŁÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/g, c => ({
      'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A','Æ':'AE','Ç':'C',
      'È':'E','É':'E','Ê':'E','Ë':'E','Ì':'I','Í':'I','Î':'I','Ï':'I',
      'Ð':'D','Ñ':'N','Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O','Ø':'O',
      'Ù':'U','Ú':'U','Û':'U','Ü':'U','Ý':'Y','Þ':'TH','ß':'ss',
      'à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','æ':'ae','ç':'c',
      'è':'e','é':'e','ê':'e','ë':'e','ì':'i','í':'i','î':'i','ï':'i',
      'ð':'d','ñ':'n','ò':'o','ó':'o','ô':'o','õ':'o','ö':'o','ø':'o',
      'ù':'u','ú':'u','û':'u','ü':'u','ý':'y','þ':'th','ÿ':'y'
    }[c] || c))
    .replace(/Ł/g,'L').replace(/ł/g,'l').replace(/Ę/g,'E').replace(/ę/g,'e')
    .replace(/Ą/g,'A').replace(/ą/g,'a').replace(/Ś/g,'S').replace(/ś/g,'s')
    .replace(/Ź/g,'Z').replace(/ź/g,'z').replace(/Ż/g,'Z').replace(/ż/g,'z')
    .replace(/Ć/g,'C').replace(/ć/g,'c').replace(/Ń/g,'N').replace(/ń/g,'n')
    .replace(/Ó/g,'O').replace(/ó/g,'o')
    .replace(/[ŠšŽžŒœŸ]/g,c=>({'Š':'S','š':'s','Ž':'Z','ž':'z','Œ':'OE','œ':'oe','Ÿ':'Y'}[c]||c))
    .replace(/[ČčŘřŤťĎďĽľŇňĹĺ]/g,c=>({'Č':'C','č':'c','Ř':'R','ř':'r','Ť':'T','ť':'t','Ď':'D','ď':'d','Ľ':'L','ľ':'l','Ň':'N','ň':'n','Ĺ':'L','ĺ':'l'}[c]||c))
    .replace(/['']/g,"'").replace(/[""]/g,'"').replace(/–/g,'-').replace(/—/g,'--')
    .replace(/…/g,'...').replace(/·/g,'-').replace(/[^\x00-\x7F]/g,'');
}

function sanitizeSlide(slideData) {
  return {
    ...slideData,
    slide_title:    sanitizeText(slideData.slide_title),
    slide_subtitle: sanitizeText(slideData.slide_subtitle),
    body_content:   (slideData.body_content || []).map(sanitizeText),
    speaker_notes:  sanitizeText(slideData.speaker_notes)
  };
}

// ── Design tokens (pptxgenjs uses inches for x/y/w/h, pt for font) ───
// Canvas: 13.33" × 7.5" (LAYOUT_WIDE / 16:9 at 96dpi → 1280×720; at 144dpi → 1920×1080)
// 8% margin → 1.067" H / 0.6" V
const M = { x: 1.07, y: 0.6, r: 12.27, b: 6.9, w: 11.2, h: 6.3 }; // content safe zone edges/dimensions
const CX = 13.33; // canvas width inches
const CY = 7.5;   // canvas height inches

// Type sizes (1920px ref → pt: px/144*72 = px/2)
const TS = {
  displayHero: 90,   // 180px
  displayStat: 100,  // 200px
  sectionTitle: 48,  // 96px
  statement: 28,     // 56px
  heading: 20,       // 40px
  body: 12,          // 24px
  bodySmall: 9,      // 18px
  label: 6,          // 11px (visual label, keep small for deck)
  footer: 9,         // 18px footer
};

// Colors — defaults; updated from DB at generation time
let C = {
  black:      '000000',
  white:      'FFFFFF',
  subtle:     'F5F5F5',
  muted:      '707070',
  subtleText: 'A8A8A8',
  blue:       '0D41FF',
  yellow:     'FFD81D',
  red:        'FC2E12',
  green:      '30E047',
};

function hex(v) { return v ? v.replace(/^#/, '') : null; }

function loadBrandData(backendDir) {
  try {
    const rows = db.prepare('SELECT key, value FROM brand_guide').all();
    const bg = {};
    rows.forEach(r => { bg[r.key] = r.value; });

    C = {
      black:      hex(bg.bg_dark)        || '000000',
      white:      hex(bg.bg_light)       || 'FFFFFF',
      subtle:     'F5F5F5',
      muted:      hex(bg.text_secondary) || '707070',
      subtleText: 'A8A8A8',
      blue:       hex(bg.primary_color)  || '0D41FF',
      yellow:     hex(bg.accent_yellow)  || 'FFD81D',
      red:        hex(bg.accent_red)     || 'FC2E12',
      green:      hex(bg.accent_green)   || '30E047',
    };

    // Resolve wordmark paths from brand_guide, fallback to assets
    const wmDarkKey  = bg.logo_wordmark_dark;
    const wmLightKey = bg.logo_wordmark_light;
    if (wmDarkKey && backendDir) {
      const p = path.join(backendDir, wmDarkKey);
      WM_DARK = fs.existsSync(p) ? p : WM_DARK_DEFAULT;
    } else {
      WM_DARK = WM_DARK_DEFAULT;
    }
    if (wmLightKey && backendDir) {
      const p = path.join(backendDir, wmLightKey);
      WM_LIGHT = fs.existsSync(p) ? p : WM_LIGHT_DEFAULT;
    } else {
      WM_LIGHT = WM_LIGHT_DEFAULT;
    }
  } catch (e) {
    console.error('loadBrandData error:', e.message);
  }
}

// Gradient stripe colors for dark slides (approximate with a colored rect since pptxgenjs can't do CSS gradients)
// We'll add a series of colored segments spanning the bottom.
function addGradientStripe(slide) {
  const segments = [
    { color: 'FFD81D', pct: 0.33 },
    { color: 'FC2511', pct: 0.16 },
    { color: '6A00D0', pct: 0.09 },
    { color: '2431F3', pct: 0.09 },
    { color: '0D41FF', pct: 0.15 },
    { color: '009A88', pct: 0.09 },
    { color: '30E047', pct: 0.09 },
  ];
  const stripeH = 0.03; // ~2px at 72dpi, ~4px visual
  let x = 0;
  segments.forEach(seg => {
    const w = CX * seg.pct;
    slide.addShape('rect', { x, y: CY - stripeH, w, h: stripeH, fill: { color: seg.color }, line: { type: 'none' } });
    x += w;
  });
}

// Wordmark helper
function addWordmark(slide, dark = true, opacity = null, larger = false) {
  const wmPath = dark ? WM_DARK : WM_LIGHT;
  if (!fs.existsSync(wmPath)) return;
  const h = larger ? 0.28 : 0.13;
  const wmAspect = 2890 / 453; // from SVG viewBox
  const w = h * wmAspect;
  const x = (CX - w) / 2;
  const y = larger ? (CY - h) / 2 - 0.4 : 0.38;
  const trans = opacity !== null ? opacity : (dark ? 35 : 25);
  slide.addImage({ path: wmPath, x, y, w, h, transparency: trans });
}

// Footer: "Design Musketeer × Client" bottom-right, on white and dark slides
function addFooter(slide, clientName, dark = false) {
  const text = `Design Musketeer x ${sanitizeText(clientName)}`;
  slide.addText(text, {
    x: M.x, y: M.b + 0.05, w: M.w, h: 0.3,
    fontSize: TS.footer, fontFace: 'Inter',
    color: dark ? 'FFFFFF' : C.subtleText,
    transparency: dark ? 70 : 0,
    align: 'right'
  });
}

// Label text (uppercase, wide tracking, muted)
function addLabel(slide, text, x, y, w, h, dark = false) {
  slide.addText(sanitizeText(text).toUpperCase(), {
    x, y, w, h,
    fontSize: TS.label, fontFace: 'Inter', bold: false,
    color: dark ? 'FFFFFF' : C.subtleText,
    transparency: dark ? 70 : 0,
    charSpacing: 2.5
  });
}

// ─────────────────────────────────────────────────────────────
// LAYOUT 1 — TITLE (white)
// Wordmark top-center quiet. Top-left label. Main headline bottom-left. Bottom-left section.
// ─────────────────────────────────────────────────────────────
function buildLayout1Title(pptx, slideData, clientName) {
  const slide = pptx.addSlide();
  slide.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.white } });

  addWordmark(slide, true, 35);

  // Top-left label (eyebrow)
  if (slideData.slide_subtitle) {
    addLabel(slide, slideData.slide_subtitle, M.x, 0.38, 6, 0.3);
  }

  // Main headline — large, bottom-left positioned (y ≈ 35% from top)
  const title = slideData.slide_title || '';
  slide.addText(title, {
    x: M.x, y: 2.2, w: 9.5, h: 3.8,
    fontSize: TS.displayHero, fontFace: 'Inter Display', bold: true,
    color: C.black, charSpacing: -3.5, lineSpacingMultiple: 0.9,
    valign: 'bottom', wrap: true
  });

  // Bottom-left section label
  const sectionLabel = (slideData.body_content || [])[0] || '';
  if (sectionLabel) addLabel(slide, sectionLabel, M.x, M.b + 0.05, 5, 0.3);
  addFooter(slide, clientName, false);
  if (slideData.speaker_notes) slide.addNotes(slideData.speaker_notes);
  return slide;
}

// ─────────────────────────────────────────────────────────────
// LAYOUT 2 — BIG STAT (white)
// Wordmark quiet. Top-left stat label. Top-right body. Huge centered stat. Bottom-right qualifier.
// ─────────────────────────────────────────────────────────────
function buildLayout2Stat(pptx, slideData, clientName) {
  const slide = pptx.addSlide();
  slide.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.white } });

  addWordmark(slide, true, 35);

  const items = slideData.body_content || [];
  // Top-left: slide title as label
  addLabel(slide, slideData.slide_title || '', M.x, 0.38, 6, 0.3);

  // Top-right: first body item as brief explanation
  if (items[0]) {
    slide.addText(items[0], {
      x: 8.5, y: 0.38, w: M.r - 8.5, h: 1.2,
      fontSize: TS.bodySmall, fontFace: 'Inter',
      color: C.subtleText, align: 'right', wrap: true
    });
  }

  // Main stat — centered, huge
  const statText = slideData.slide_subtitle || items[1] || items[0] || '';
  slide.addText(statText, {
    x: M.x, y: 1.5, w: M.w, h: 4.5,
    fontSize: TS.displayStat, fontFace: 'Inter Display', bold: true,
    color: C.black, charSpacing: -3.5, align: 'center', valign: 'middle'
  });

  // Bottom-right: qualifier / remaining items
  const qualifier = items.slice(2).join(' · ') || '';
  if (qualifier) addLabel(slide, qualifier, M.x, M.b + 0.05, M.w, 0.3);
  addFooter(slide, clientName, false);
  if (slideData.speaker_notes) slide.addNotes(slideData.speaker_notes);
  return slide;
}

// ─────────────────────────────────────────────────────────────
// LAYOUT 3 — STATEMENT (white)
// Large statement fills most of slide. Bottom-left label. Bottom-right support text.
// ─────────────────────────────────────────────────────────────
function buildLayout3Statement(pptx, slideData, clientName) {
  const slide = pptx.addSlide();
  slide.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.white } });

  addWordmark(slide, true, 35);

  const items = slideData.body_content || [];
  const statement = slideData.slide_title || items[0] || '';

  // Main statement — large, centered vertically, fills width
  slide.addText(statement, {
    x: M.x, y: 1.4, w: 10.5, h: 4.2,
    fontSize: TS.statement, fontFace: 'Inter Display',
    bold: false, color: C.black, charSpacing: -1.5,
    lineSpacingMultiple: 1.15, valign: 'middle', wrap: true
  });

  // Subtitle as secondary context above headline
  if (slideData.slide_subtitle) {
    addLabel(slide, slideData.slide_subtitle, M.x, 0.38, 6, 0.3);
  }

  // Bottom-left section label
  const sectionLabel = items[0] || '';
  if (sectionLabel && sectionLabel !== statement) {
    addLabel(slide, sectionLabel, M.x, M.b + 0.05, 5, 0.3);
  }

  // Bottom-right support text
  const supportText = items[1] || '';
  if (supportText) {
    slide.addText(supportText, {
      x: 8.5, y: M.b, w: M.r - 8.5, h: 0.4,
      fontSize: TS.bodySmall, fontFace: 'Inter',
      color: C.subtleText, align: 'right', wrap: true
    });
  }

  addFooter(slide, clientName, false);
  if (slideData.speaker_notes) slide.addNotes(slideData.speaker_notes);
  return slide;
}

// ─────────────────────────────────────────────────────────────
// LAYOUT 4 — SECTION DIVIDER (dark)
// Black bg. Wordmark top-center quiet. Headline bottom-left. Body support. Label bottom-right. Stripe.
// ─────────────────────────────────────────────────────────────
function buildLayout4Dark(pptx, slideData, clientName) {
  const slide = pptx.addSlide();
  slide.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.black } });

  addWordmark(slide, false, 75); // light wordmark, 25% opacity = 75% transparency

  const items = slideData.body_content || [];

  // Main headline — large, bottom-left
  const title = slideData.slide_title || '';
  slide.addText(title, {
    x: M.x, y: 2.5, w: 10.0, h: 3.5,
    fontSize: TS.sectionTitle, fontFace: 'Inter Display',
    bold: true, color: C.white, charSpacing: -2.5,
    lineSpacingMultiple: 0.95, valign: 'bottom', wrap: true
  });

  // Subtitle / support body text bottom-left
  if (slideData.slide_subtitle) {
    slide.addText(slideData.slide_subtitle, {
      x: M.x, y: M.b - 0.3, w: 7.5, h: 0.55,
      fontSize: TS.body, fontFace: 'Inter',
      color: C.white, transparency: 50, wrap: true
    });
  } else if (items[0]) {
    slide.addText(items[0], {
      x: M.x, y: M.b - 0.3, w: 7.5, h: 0.55,
      fontSize: TS.body, fontFace: 'Inter',
      color: C.white, transparency: 50, wrap: true
    });
  }

  // Bottom-right section reference
  const sectionRef = items[items.length - 1] || '';
  if (sectionRef) {
    addLabel(slide, sectionRef, 8.5, M.b + 0.05, M.r - 8.5, 0.3, true);
  }

  addGradientStripe(slide);
  // No footer on dark cover/divider slides — wordmark is the brand anchor
  if (slideData.speaker_notes) slide.addNotes(slideData.speaker_notes);
  return slide;
}

// ─────────────────────────────────────────────────────────────
// LAYOUT 5 — TWO COLUMN (white)
// Wordmark quiet. Top-left section label. Left: headline. Right: body bullets. Bottom-right ref.
// ─────────────────────────────────────────────────────────────
function buildLayout5TwoColumn(pptx, slideData, clientName) {
  const slide = pptx.addSlide();
  slide.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.white } });

  addWordmark(slide, true, 35);

  const items = slideData.body_content || [];
  const mid = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, mid);
  const rightItems = items.slice(mid);

  // Top-left section label
  addLabel(slide, slideData.slide_subtitle || '', M.x, 0.38, 6, 0.3);

  // Left column: slide title as headline
  slide.addText(slideData.slide_title || '', {
    x: M.x, y: 1.1, w: 5.5, h: 5.2,
    fontSize: TS.sectionTitle, fontFace: 'Inter Display',
    bold: true, color: C.black, charSpacing: -2.5,
    lineSpacingMultiple: 0.95, valign: 'middle', wrap: true
  });

  // Left column supporting bullets (if more than 2 total items)
  if (leftItems.length > 0) {
    const bulletObjs = leftItems.map(t => ({
      text: t,
      options: { fontSize: TS.body, fontFace: 'Inter', color: C.muted, paraSpaceBefore: 8 }
    }));
    slide.addText(bulletObjs, {
      x: M.x, y: 4.5, w: 5.3, h: 2.0, valign: 'top', bullet: false
    });
  }

  // Right column: body text
  if (rightItems.length > 0) {
    const bodyObjs = rightItems.map(t => ({
      text: t,
      options: { fontSize: TS.body, fontFace: 'Inter', color: C.muted, paraSpaceBefore: 10 }
    }));
    slide.addText(bodyObjs, {
      x: 7.0, y: 1.1, w: M.r - 7.0, h: 5.8, valign: 'top'
    });
  }

  // Thin vertical divider
  slide.addShape('line', {
    x: 6.7, y: 1.0, w: 0, h: 5.5,
    line: { color: 'E8E8E8', width: 0.75 }
  });

  addFooter(slide, clientName, false);
  if (slideData.speaker_notes) slide.addNotes(slideData.speaker_notes);
  return slide;
}

// ─────────────────────────────────────────────────────────────
// LAYOUT 6 — LIST (white)
// Wordmark quiet. List items with × prefix. Bottom-left section label.
// ─────────────────────────────────────────────────────────────
function buildLayout6List(pptx, slideData, clientName) {
  const slide = pptx.addSlide();
  slide.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.white } });

  addWordmark(slide, true, 35);

  // Top label
  addLabel(slide, slideData.slide_subtitle || slideData.slide_title || '', M.x, 0.38, 8, 0.3);

  const items = slideData.body_content || [];
  const count = items.length;
  // Scale font size based on item count to fit
  const baseFontSize = count <= 4 ? TS.sectionTitle : count <= 6 ? 36 : 28;
  const lineH = count <= 4 ? 1.3 : count <= 6 ? 1.0 : 0.85;
  const startY = count <= 4 ? 1.4 : 1.1;

  items.forEach((item, i) => {
    const y = startY + i * lineH;
    if (y + lineH > 7.0) return;
    // × prefix in muted gray
    slide.addText('×', {
      x: M.x, y, w: 0.5, h: lineH,
      fontSize: baseFontSize * 0.7, fontFace: 'Inter',
      color: C.subtleText, valign: 'middle'
    });
    // Item text in black display font
    slide.addText(item, {
      x: M.x + 0.55, y, w: M.r - M.x - 0.55, h: lineH,
      fontSize: baseFontSize, fontFace: 'Inter Display',
      bold: true, color: C.black, charSpacing: -2.0, valign: 'middle', wrap: false
    });
  });

  // Bottom-left section label — use title if subtitle was used above
  const bottomLabel = slideData.slide_subtitle ? slideData.slide_title : '';
  if (bottomLabel) addLabel(slide, bottomLabel, M.x, M.b + 0.05, 5, 0.3);

  addFooter(slide, clientName, false);
  if (slideData.speaker_notes) slide.addNotes(slideData.speaker_notes);
  return slide;
}

// ─────────────────────────────────────────────────────────────
// LAYOUT 7 — CONTENT + IMAGE (white)
// Left 60%: label + headline + body. Right 40%: image or subtle bg.
// ─────────────────────────────────────────────────────────────
function buildLayout7ContentImage(pptx, slideData, clientName, imageOptions) {
  const slide = pptx.addSlide();
  slide.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.white } });

  addWordmark(slide, true, 35);

  const leftW = 7.5;
  const rightX = 8.0;
  const rightW = CX - rightX;
  const items = slideData.body_content || [];

  // Label
  addLabel(slide, slideData.slide_subtitle || '', M.x, 0.38, leftW, 0.3);

  // Headline
  slide.addText(slideData.slide_title || '', {
    x: M.x, y: 1.0, w: leftW - M.x, h: 3.5,
    fontSize: TS.heading, fontFace: 'Inter Display',
    bold: true, color: C.black, charSpacing: -1.5,
    lineSpacingMultiple: 1.1, valign: 'top', wrap: true
  });

  // Body text
  if (items.length > 0) {
    const bodyObjs = items.map(t => ({
      text: t,
      options: { fontSize: TS.body, fontFace: 'Inter', color: C.muted, paraSpaceBefore: 8 }
    }));
    slide.addText(bodyObjs, {
      x: M.x, y: 4.8, w: leftW - M.x, h: 2.3, valign: 'top'
    });
  }

  // Right image panel
  if (imageOptions && imageOptions.path && fs.existsSync(imageOptions.path)) {
    slide.addImage({
      path: imageOptions.path,
      x: rightX, y: M.y, w: rightW, h: CY - M.y * 2,
      sizing: { type: 'cover', w: rightW, h: CY - M.y * 2 }
    });
  } else {
    // Subtle bg placeholder
    slide.addShape('rect', {
      x: rightX, y: 0, w: rightW, h: CY,
      fill: { color: C.subtle }, line: { type: 'none' }
    });
    slide.addText('IMAGE', {
      x: rightX, y: 0, w: rightW, h: CY,
      fontSize: TS.bodySmall, fontFace: 'Inter',
      color: C.subtleText, align: 'center', valign: 'middle'
    });
  }

  addFooter(slide, clientName, false);
  if (slideData.speaker_notes) slide.addNotes(slideData.speaker_notes);
  return slide;
}

// ─────────────────────────────────────────────────────────────
// LAYOUT 8 — CLOSING (dark)
// Black bg. Wordmark large centered at 90% opacity. Subtitle below. Stripe.
// ─────────────────────────────────────────────────────────────
function buildLayout8Closing(pptx, slideData, clientName) {
  const slide = pptx.addSlide();
  slide.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.black } });

  // Large centered wordmark (not quiet — this is the focal point)
  addWordmark(slide, false, 10, true); // light, ~90% opacity = 10% transparency, larger

  // Tagline/subtitle below wordmark
  const subtitle = slideData.slide_subtitle || (slideData.body_content || [])[0] || '';
  if (subtitle) {
    slide.addText(subtitle, {
      x: M.x, y: 4.2, w: M.w, h: 0.5,
      fontSize: TS.body, fontFace: 'Inter',
      color: C.white, transparency: 40, align: 'center'
    });
  }

  // Slide title as small label above (context)
  if (slideData.slide_title) {
    slide.addText(slideData.slide_title, {
      x: M.x, y: 3.5, w: M.w, h: 0.4,
      fontSize: TS.heading, fontFace: 'Inter Display',
      bold: true, color: C.white, transparency: 15,
      align: 'center', charSpacing: -1.5
    });
  }

  addGradientStripe(slide);
  if (slideData.speaker_notes) slide.addNotes(slideData.speaker_notes);
  return slide;
}

// ─────────────────────────────────────────────────────────────
// PROOF + TRUSTED BY (Slide 20) — Big stat layout + logos
// ─────────────────────────────────────────────────────────────
function buildProofTrustedBySlide(pptx, slideData, clientName, partnerBrands, backendDir) {
  const slide = pptx.addSlide();
  slide.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.white } });

  addWordmark(slide, true, 35);
  addLabel(slide, slideData.slide_title || 'Proof + Trusted by', M.x, 0.38, 8, 0.3);

  const items = slideData.body_content || [];

  // Numbers grid — two columns of stats
  const mid = Math.ceil(items.length / 2);
  const col1 = items.slice(0, mid);
  const col2 = items.slice(mid);

  const statFontSize = 22;
  const statLineH = 0.7;
  col1.forEach((item, i) => {
    slide.addText(item, {
      x: M.x, y: 1.0 + i * statLineH, w: 5.5, h: statLineH,
      fontSize: statFontSize, fontFace: 'Inter Display', bold: true,
      color: C.black, charSpacing: -1.0, wrap: true
    });
  });
  col2.forEach((item, i) => {
    slide.addText(item, {
      x: 7.0, y: 1.0 + i * statLineH, w: M.r - 7.0, h: statLineH,
      fontSize: statFontSize, fontFace: 'Inter Display', bold: true,
      color: C.black, charSpacing: -1.0, wrap: true
    });
  });

  // Divider before trusted by
  const dividerY = 1.0 + Math.max(col1.length, col2.length) * statLineH + 0.2;
  slide.addShape('line', {
    x: M.x, y: dividerY, w: M.w, h: 0,
    line: { color: 'E8E8E8', width: 0.75 }
  });

  const visiblePartners = (partnerBrands || []).filter(pb => pb.logo_path);
  if (visiblePartners.length > 0) {
    addLabel(slide, 'Trusted by', M.x, dividerY + 0.15, 3, 0.3);
    const logoH = 0.45;
    const logoGap = 0.3;
    let x = M.x;
    const logoY = dividerY + 0.55;
    visiblePartners.slice(0, 12).forEach(pb => {
      if (x + logoH * 3 > M.r) return;
      try {
        const absPath = backendDir ? require('path').join(backendDir, pb.logo_path) : pb.logo_path;
        if (fs.existsSync(absPath)) {
          slide.addImage({ path: absPath, x, y: logoY, w: logoH * 2.5, h: logoH,
            sizing: { type: 'contain', w: logoH * 2.5, h: logoH } });
          x += logoH * 2.5 + logoGap;
        }
      } catch {}
    });
  }

  addFooter(slide, clientName, false);
  if (slideData.speaker_notes) slide.addNotes(slideData.speaker_notes);
  return slide;
}

// ─────────────────────────────────────────────────────────────
// Layout dispatcher — maps Claude's layout field to builder
// ─────────────────────────────────────────────────────────────
const LAYOUT_MAP = {
  'title':         buildLayout1Title,
  'big-stat':      buildLayout2Stat,
  'statement':     buildLayout3Statement,
  'dark':          buildLayout4Dark,
  'two-column':    buildLayout5TwoColumn,
  'list':          buildLayout6List,
  'content-image': buildLayout7ContentImage,
  'closing':       buildLayout8Closing,
  // legacy aliases
  'cover':         buildLayout4Dark,
  'bullets':       buildLayout3Statement,
  'quote':         buildLayout3Statement,
  'text-only':     buildLayout3Statement,
};

// ─────────────────────────────────────────────────────────────
async function generatePPTX({ slides: slideDataArray, clientName, outputPath, partnerBrands, backendDir }) {
  // Load brand colors + logos from DB before building slides
  loadBrandData(backendDir);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33" × 7.5"
  pptx.author = 'Design Musketeer';
  pptx.subject = `Presentation for ${sanitizeText(clientName)}`;

  // Embed Inter fonts
  const fontsDir = path.join(ASSETS_DIR, 'fonts');
  const fontFiles = [
    { name: 'Inter', weight: 400, file: 'Inter-Regular.otf' },
    { name: 'Inter', weight: 500, file: 'Inter-Medium.otf' },
    { name: 'Inter', weight: 600, file: 'Inter-SemiBold.otf' },
    { name: 'Inter', weight: 700, file: 'Inter-Bold.otf' },
    { name: 'Inter Display', weight: 600, file: 'InterDisplay-SemiBold.otf' },
    { name: 'Inter Display', weight: 700, file: 'InterDisplay-Bold.otf' },
  ];
  fontFiles.forEach(f => {
    const fp = path.join(fontsDir, f.file);
    if (fs.existsSync(fp)) {
      try { pptx.defineFontFace(f.name, fp); } catch {}
    }
  });

  const safeClientName = sanitizeText(clientName);

  for (const rawSlide of slideDataArray) {
    const slideData = sanitizeSlide(rawSlide);

    // Slide 20 always gets its own builder
    if (slideData.slide_id === 20) {
      buildProofTrustedBySlide(pptx, slideData, safeClientName, partnerBrands, backendDir);
      continue;
    }

    const layout = slideData.layout || 'bullets';
    const builder = LAYOUT_MAP[layout] || buildLayout3Statement;
    builder(pptx, slideData, safeClientName);
  }

  await pptx.writeFile({ fileName: outputPath });
  return outputPath;
}

module.exports = { generatePPTX };
