const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'dm-studio.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create all tables
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    company_name TEXT,
    role TEXT,
    website_url TEXT,
    linkedin_url TEXT,
    industry TEXT,
    location TEXT,
    email TEXT,
    notes TEXT,
    client_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    meeting_type TEXT NOT NULL,
    meeting_date TEXT,
    service_pitched TEXT,
    notes TEXT,
    extra_context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS presentations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    meeting_id INTEGER,
    slide_list TEXT,
    output_format TEXT,
    file_path_pptx TEXT,
    file_path_pdf TEXT,
    brand_name_toggle INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
  );

  CREATE TABLE IF NOT EXISTS case_studies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    client_name TEXT,
    industry TEXT,
    service_type TEXT,
    client_type_tag TEXT,
    situation TEXT,
    problem TEXT,
    solution TEXT,
    result TEXT,
    metrics TEXT,
    testimonial TEXT,
    nda INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS case_study_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_study_id INTEGER NOT NULL,
    section TEXT,
    image_path TEXT,
    description TEXT,
    tags TEXT,
    FOREIGN KEY (case_study_id) REFERENCES case_studies(id)
  );

  CREATE TABLE IF NOT EXISTS company_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    track TEXT,
    description TEXT,
    pricing_tier_1 TEXT,
    pricing_tier_2 TEXT,
    pricing_tier_3 TEXT,
    pricing_custom INTEGER DEFAULT 0,
    deliverables TEXT
  );

  CREATE TABLE IF NOT EXISTS visual_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    original_name TEXT,
    description TEXT,
    tags TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meeting_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    notes TEXT,
    file_paths TEXT,
    result_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS slide_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_type TEXT NOT NULL,
    slide_id INTEGER NOT NULL,
    slide_name TEXT,
    included INTEGER NOT NULL DEFAULT 1,
    count INTEGER NOT NULL DEFAULT 1,
    UNIQUE(meeting_type, slide_id)
  );

  CREATE TABLE IF NOT EXISTS partner_brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo_path TEXT,
    industry_tag TEXT,
    nda INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS brand_guide (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS client_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    positioning_notes TEXT,
    key_pain_points TEXT,
    recommended_services TEXT,
    example_companies TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Idempotent migrations
try { db.exec(`ALTER TABLE clients ADD COLUMN client_type TEXT`); } catch {}
try { db.exec(`ALTER TABLE clients ADD COLUMN preferred_service TEXT`); } catch {}
try { db.exec(`ALTER TABLE case_study_images ADD COLUMN section TEXT`); } catch {}
try { db.exec(`ALTER TABLE case_study_images ADD COLUMN sort_order INTEGER DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE case_studies ADD COLUMN duration TEXT`); } catch {}
try { db.exec(`ALTER TABLE case_studies ADD COLUMN relationship_status TEXT DEFAULT 'Active'`); } catch {}

// Meetings: distinguish manually-created from auto-created
try { db.exec(`ALTER TABLE meetings ADD COLUMN manually_added INTEGER DEFAULT 0`); } catch {}

// Presentations: store meeting fields directly (decoupled from meetings table)
try { db.exec(`ALTER TABLE presentations ADD COLUMN meeting_type TEXT`); } catch {}
try { db.exec(`ALTER TABLE presentations ADD COLUMN meeting_date TEXT`); } catch {}
try { db.exec(`ALTER TABLE presentations ADD COLUMN service_pitched TEXT`); } catch {}
try { db.exec(`ALTER TABLE presentations ADD COLUMN meeting_notes TEXT`); } catch {}
try { db.exec(`ALTER TABLE presentations ADD COLUMN extra_context TEXT`); } catch {}

// Backfill presentation meeting fields from linked meetings (one-time, safe to re-run)
try {
  db.exec(`
    UPDATE presentations SET
      meeting_type     = (SELECT meeting_type  FROM meetings WHERE id = presentations.meeting_id),
      meeting_date     = (SELECT meeting_date  FROM meetings WHERE id = presentations.meeting_id),
      service_pitched  = (SELECT service_pitched FROM meetings WHERE id = presentations.meeting_id),
      meeting_notes    = (SELECT notes         FROM meetings WHERE id = presentations.meeting_id),
      extra_context    = (SELECT extra_context FROM meetings WHERE id = presentations.meeting_id)
    WHERE meeting_id IS NOT NULL AND meeting_type IS NULL
  `);
} catch {}

// Ensure brand guide has text color keys
try { db.prepare("INSERT OR IGNORE INTO brand_guide (key, value) VALUES ('text_primary', '#000000')").run(); } catch {}
try { db.prepare("INSERT OR IGNORE INTO brand_guide (key, value) VALUES ('text_secondary', '#707070')").run(); } catch {}

// Seed company_info if empty
const companyInfoCount = db.prepare('SELECT COUNT(*) as count FROM company_info').get();
if (companyInfoCount.count === 0) {
  const insertInfo = db.prepare('INSERT INTO company_info (key, value) VALUES (?, ?)');
  const seedCompanyInfo = db.transaction(() => {
    insertInfo.run('name', 'Design Musketeer LLC');
    insertInfo.run('tagline', 'We build the designs that fuel the products you print and ship.');
    insertInfo.run('positioning', 'We are not a design agency — we are a long-term growth partner. We don\'t sell deliverables. We deliver outcomes.');
    insertInfo.run('team_size', '60+');
    insertInfo.run('monthly_deliverables', '60,000+');
    insertInfo.run('clients_served', '1,500+');
    insertInfo.run('years_in_industry', '12+');
    insertInfo.run('revenue_influenced', '$100M+');
    insertInfo.run('locations', 'US, UK, and Bangladesh');
    insertInfo.run('website', 'designmusketeer.com');
    insertInfo.run('email', 'hello@designmusketeer.com');
    insertInfo.run('brand_voice', 'Confident. Direct. Outcome-focused. No jargon, no fluff. Friendly and professional. Always speak to results, never just deliverables.');
  });
  seedCompanyInfo();
}

// Seed services if empty
const servicesCount = db.prepare('SELECT COUNT(*) as count FROM services').get();
if (servicesCount.count === 0) {
  const insertService = db.prepare(`
    INSERT INTO services (name, track, description, pricing_tier_1, pricing_tier_2, pricing_tier_3, pricing_custom, deliverables)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seedServices = db.transaction(() => {
    insertService.run(
      'General Subscription', 'subscription',
      'Diverse ongoing creative support for brands at any stage',
      'Essential — $1,499/mo · 70 hrs/mo · 72h turnaround · solo founders and small brands',
      'Standard — $2,499/mo · 140 hrs/mo · 48h turnaround · growing brands needing full creative team',
      'Ultimate — $4,999/mo · 245 hrs/mo · 24h turnaround · serious brands wanting dedicated design + strategy partner',
      0,
      JSON.stringify(['Branding','Design','Web','Development','AI Studio','Video','Motion','3D','Automation','Unlimited requests','Unlimited revisions','No contracts'])
    );
    insertService.run(
      'POD Subscription', 'subscription',
      'Design subscription built specifically for print-on-demand store owners',
      'Essential — $699/mo · up to 40 POD designs/month · 4 ad creatives · 1 revision per design',
      'Standard — $1,499/mo · up to 100 POD designs/month · 10 ad creatives · 1 custom product mockup',
      'Ultimate — $2,499/mo · up to 160 POD designs/month · 15 marketing creatives · 3 premium mockups · priority support + monthly 1:1 strategy call · AI-powered video edit',
      0,
      JSON.stringify(['POD designs','Ad creatives','Product mockups','Store uploads','Priority support','Strategy calls'])
    );
    insertService.run(
      'Brand & Creative', 'project',
      'Brand strategy, identity systems, and creative design',
      '$2,000–$5,000', '$5,000–$10,000', '$10,000+', 1,
      JSON.stringify(['Brand strategy and messaging','Logo & Identity system','Graphic design','Packaging & product design','Campaign & marketing design'])
    );
    insertService.run(
      'Web & SaaS', 'project',
      'UX/UI design, website development, and e-commerce',
      '$2,000–$5,000', '$5,000–$10,000', '$10,000+', 1,
      JSON.stringify(['UX/UI design','Website & Shopify development','E-commerce experience design','Conversion optimization','Automation setup','Funnel creation'])
    );
    insertService.run(
      'AI Studio', 'project',
      'AI-powered photography, video, and business automation',
      '$2,000–$5,000', '$5,000–$10,000', '$10,000+', 1,
      JSON.stringify(['AI-powered photography & video','AI product & model generation','Business automation & AI integration','Creative production workflows'])
    );
    insertService.run(
      '3D & Motion', 'project',
      'Video production, motion design, 3D modeling, and VFX',
      '$2,000–$5,000', '$5,000–$10,000', '$10,000+', 1,
      JSON.stringify(['Video production & editing','Motion design & animation','3D modeling & visualization','VFX & animation'])
    );
  });
  seedServices();
}

// Seed case studies if empty
const caseStudiesCount = db.prepare('SELECT COUNT(*) as count FROM case_studies').get();
if (caseStudiesCount.count === 0) {
  const insertCS = db.prepare(`
    INSERT INTO case_studies (title, client_name, industry, service_type, client_type_tag, situation, problem, solution, result, metrics, testimonial, nda)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seedCS = db.transaction(() => {
    insertCS.run(
      'From 5-day proof cycle to 24-hour delivery', 'TopShelf', 'Print on Demand', 'POD Subscription', 'POD Platform',
      'TopShelf\'s sellers were arriving without print-ready files, stalling production. Their proof cycle was taking 5 days which was causing sellers to reorder less and refund more.',
      'Slow proof turnaround was throttling their production capacity and seller satisfaction.',
      'Design Musketeer became their white-label design partner. We built a dedicated design pipeline for their seller base, delivering production-ready files directly into their system.',
      'Proof cycle dropped from 5 days to 24 hours. Sellers reordered more, refunded less, and the factory ran hotter.',
      '5 days to 24 hours proof turnaround. Seller reorder rate increased significantly.',
      null, 0
    );
    insertCS.run(
      'Replacing freelance chaos with a reliable creative engine', 'WeScale', 'E-commerce / DTC', 'General Subscription', 'E-commerce',
      'WeScale needed high-quality ad creatives, product designs, email graphics, and website visuals at consistent volume. They were relying on freelance platforms which was slow, inconsistent, and expensive.',
      'Freelance dependency was creating bottlenecks — inconsistent quality, slow turnaround, and no strategic alignment.',
      'Design Musketeer replaced their entire freelance operation with a subscription-based creative engine. One team, one brief process, consistent output across all channels.',
      'Faster delivery, more affordable, greater consistency than freelance ever could.',
      'Replaced 5+ freelancers. Consistent output across Meta ads, product design, email, and website visuals.',
      '"They provide high-quality ad creatives, product designs, email graphics, and website visuals — faster, more affordably, and with greater consistency than freelance platforms ever could. A game-changer for us." — Chris Heckman, Co-founder, WeScale',
      0
    );
  });
  seedCS();
}

// Seed client types if empty
const clientTypesCount = db.prepare('SELECT COUNT(*) as count FROM client_types').get();
if (clientTypesCount.count === 0) {
  const insertCT = db.prepare(`
    INSERT INTO client_types (name, description, positioning_notes, key_pain_points, recommended_services, example_companies)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const seedCT = db.transaction(() => {
    insertCT.run(
      'POD Seller',
      'Individual store owners selling print-on-demand products on platforms like Etsy, Shopify, Amazon, TikTok Shop.',
      'Position DM as their on-demand design team — replacing slow and inconsistent freelancers with a reliable creative engine.',
      'No consistent design support, slow turnaround from freelancers, can\'t scale without better creative, need mockups and ad creatives fast.',
      'POD Subscription, General Subscription',
      'Individual Etsy/Shopify store owners'
    );
    insertCT.run(
      'POD Enterprise',
      'Companies that print, ship and fulfill orders for POD sellers. They run the production infrastructure — not selling products themselves but enabling thousands of sellers to sell.',
      'Position DM as a white-label creative engine that serves their seller network — making their platform stickier, speeding up seller onboarding, and adding a creative layer they don\'t have to build themselves.',
      'Sellers arrive without print-ready files stalling production, slow proof cycles hurting seller satisfaction, need US-side creative capacity, sellers need marketing creative not just product.',
      'General Subscription, POD Subscription (white-label), Partnership model',
      'ShineOn, Fulfillment Engine, SunFrog, TopShelf, Snapwear'
    );
    insertCT.run(
      'E-commerce brand',
      'DTC brands scaling on Shopify, Amazon, TikTok Shop or other platforms. They sell their own products and need consistent creative across all channels.',
      'Position DM as a full creative partner embedded in their growth — replacing fragmented freelance or agency relationships with one reliable team.',
      'Inconsistent brand, slow creative turnaround, high agency costs, need ads + product visuals + email at volume.',
      'General Subscription, Brand & Creative, 3D & Motion',
      'WeScale, DTC fashion brands, Amazon sellers'
    );
    insertCT.run(
      'SaaS / Tech',
      'Software companies and tech startups that need design and development support — UI/UX, product design, marketing creative, landing pages.',
      'Position DM as a design and development partner that understands product — not just a creative vendor.',
      'No in-house design team, slow product iteration, need UI/UX and marketing design simultaneously.',
      'Web & SaaS, General Subscription, AI Studio',
      'SaaS startups, tech platforms'
    );
    insertCT.run(
      'Agency',
      'Marketing or creative agencies that need overflow capacity or white-label creative support for their clients.',
      'Position DM as a silent white-label partner that extends their capacity without them hiring.',
      'Overflow work they can\'t handle, need reliable white-label output, client deadlines they can\'t miss.',
      'General Subscription, white-label partnership',
      'Marketing agencies, creative studios'
    );
    insertCT.run(
      'Creator / Influencer',
      'Content creators, YouTubers, influencers building personal brands and monetizing their audience.',
      'Position DM as the creative team behind their brand — helping them look professional and scale their content.',
      'No design skills, inconsistent brand look, need thumbnails/merch/social graphics fast.',
      'General Subscription, Brand & Creative',
      'YouTubers, TikTokers, newsletter writers'
    );
    insertCT.run(
      'Other',
      'Any client that doesn\'t fit the above categories.',
      'Use general DM positioning — long-term growth partner, outcome-focused, full-service creative and technology partner.',
      'To be discovered in discovery meeting.',
      'General Subscription',
      '—'
    );
  });
  seedCT();
}

// Seed brand guide if empty
const brandGuideCount = db.prepare('SELECT COUNT(*) as count FROM brand_guide').get();
if (brandGuideCount.count === 0) {
  const insertBG = db.prepare('INSERT INTO brand_guide (key, value) VALUES (?, ?)');
  const seedBG = db.transaction(() => {
    insertBG.run('primary_color', '#0D41FF');
    insertBG.run('accent_yellow', '#FFD81D');
    insertBG.run('accent_red', '#FC2E12');
    insertBG.run('accent_green', '#30E047');
    insertBG.run('bg_dark', '#0A0A0A');
    insertBG.run('bg_light', '#FFFFFF');
    insertBG.run('text_primary', '#000000');
    insertBG.run('text_secondary', '#707070');
  });
  seedBG();
}

module.exports = db;
