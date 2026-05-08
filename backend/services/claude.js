const Anthropic = require('@anthropic-ai/sdk');
const db = require('../database');

function getApiKey() {
  // Prefer DB key, fall back to .env
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'anthropic_api_key'").get();
    if (row && row.value && row.value.trim().length > 10) return row.value.trim();
  } catch {}
  return process.env.ANTHROPIC_API_KEY;
}


function getClientTypeData(clientTypeName) {
  if (!clientTypeName) return null;
  try {
    return db.prepare('SELECT * FROM client_types WHERE name = ?').get(clientTypeName);
  } catch { return null; }
}

async function generatePresentationContent({
  client: clientData, meeting, previousMeetings, previousMeetingResults,
  slides, caseStudies, partnerBrands, brandNameToggle, companyInfo, services
}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Go to Settings in the app to add your Claude API key, or set ANTHROPIC_API_KEY in backend/.env');
  }

  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are the presentation engine for Design Musketeer, a full-service creative and technology growth partner. You write personalized, confident, outcome-focused slide content for client meetings. You never use jargon or fluff. You always speak to results. You write in Design Musketeer's brand voice: confident, direct, friendly, professional.

For each slide, return a JSON object with:
- slide_id: the slide number (integer)
- slide_title: the slide heading
- slide_subtitle: optional subheading or eyebrow label (can be null)
- body_content: array of strings (bullet points or paragraphs)
- speaker_notes: one sentence telling the presenter what to say or ask
- layout: one of the following values (pick the best fit per slide):
  "dark"          — dark background, large headline, for cover and section openers
  "title"         — white background, large headline bottom-left
  "big-stat"      — white background, single huge number/stat centered
  "statement"     — white background, large bold statement filling the slide
  "two-column"    — white background, left headline + right body text
  "list"          — white background, items with × prefix, display font
  "content-image" — white background, left text + right image placeholder
  "closing"       — dark background, centered wordmark, for Next Step slide

LAYOUT GUIDANCE per slide type:
- Slide 1 (Cover): layout="dark"
- Slide 2 (Who we are): layout="two-column"
- Slide 3 (Who you are): layout="statement"
- Slide 4 (What we noticed): layout="list"
- Slide 5 (The challenge): layout="statement"
- Slide 6 (Our solution): layout="two-column"
- Slide 7 (Discovery questions): layout="list"
- Slide 8 (Case study): layout="content-image"
- Slide 9 (What we heard): layout="statement"
- Slide 10 (Scope of work): layout="list"
- Slide 11 (Timeline): layout="two-column"
- Slide 12 (Investment): layout="big-stat"
- Slide 13 (How we work): layout="list"
- Slide 14 (How revisions work): layout="two-column"
- Slide 15 (Day one playbook): layout="list"
- Slide 16 (Your team): layout="two-column"
- Slide 17 (What we're building together): layout="statement"
- Slide 18 (Week 1 expectations): layout="list"
- Slide 19 (Next step): layout="closing"
- Slide 20 (Proof + Trusted by): layout="two-column"

For "big-stat" slides: put the main number/stat in slide_subtitle, label in slide_title, explanation in body_content[0].
For "list" slides: put each list item as a separate string in body_content.
For "statement" slides: put the bold statement as slide_title.
For "dark" cover: put meeting type + client name in slide_title, date/context in slide_subtitle.
For "closing": put the call-to-action in slide_title, follow-up detail in slide_subtitle.

Return ONLY a valid JSON array of slide objects. No markdown, no explanation, just the JSON array.`;

  // Build previous meetings summary (including results)
  let previousMeetingsSummary = 'This is the first meeting with this client.';
  if (previousMeetings.length > 0) {
    previousMeetingsSummary = previousMeetings.map(m => {
      const results = (previousMeetingResults || []).filter(r => r.meeting_id === m.id);
      const resultText = results.length > 0
        ? `\n  Meeting results:\n${results.map(r => `  - ${r.result_date}: ${r.notes}`).join('\n')}`
        : '';
      return `${m.meeting_type} on ${m.meeting_date}: ${m.notes || 'No notes'}${resultText}`;
    }).join('\n\n');
  }

  const companyContext = Object.entries(companyInfo).map(([k, v]) => `${k}: ${v}`).join('\n');

  // Look up client type from DB
  const clientTypeData = getClientTypeData(clientData.client_type);

  const clientTypeFraming = clientTypeData
    ? `Client type: ${clientTypeData.name}
Description: ${clientTypeData.description}
Positioning: ${clientTypeData.positioning_notes}
Key pain points: ${clientTypeData.key_pain_points}
Recommended services: ${clientTypeData.recommended_services}
Example companies in this category: ${clientTypeData.example_companies}`
    : '';

  const slideNames = {
    1: 'Cover', 2: 'Who we are', 3: 'Who you are', 4: 'What we noticed',
    5: 'The challenge', 6: 'Our solution for you', 7: 'Discovery questions',
    8: 'Case study', 9: 'What we heard', 10: 'Scope of work',
    11: 'Timeline', 12: 'Investment', 13: 'How we work', 14: 'How revisions work',
    15: 'Day one playbook', 16: 'Your team', 17: "What we're building together",
    18: 'Week 1 expectations', 19: 'Next step', 20: 'Proof + Trusted by'
  };

  // Build partner brands context for Proof slide
  const partnerBrandNames = (partnerBrands || []).map(pb => {
    const showName = brandNameToggle && !pb.nda;
    return showName ? pb.name : (pb.industry_tag || 'Confidential Partner');
  });

  // Build case study context based on meeting type depth
  const caseStudyDepth = ['M2', 'M2+M3'].includes(meeting.meeting_type) ? 'light' : 'full';
  const caseStudyContext = caseStudies.map(cs => {
    const showName = brandNameToggle && !cs.nda;
    const clientLabel = showName ? cs.client_name : 'Confidential Client';
    const statusNote = cs.relationship_status === 'Concluded'
      ? '\n⚠️ IMPORTANT: This is a past/concluded relationship. Do NOT present it as current or ongoing.'
      : '';
    if (caseStudyDepth === 'light') {
      return `Case Study (LIGHT VERSION — one powerful result line only):
Client: ${clientLabel} | Industry: ${cs.industry} | Service: ${cs.service_type}
Relationship status: ${cs.relationship_status || 'Active'}${statusNote}
Key result: ${cs.result}
Metrics: ${cs.metrics}`;
    }
    return `Case Study (FULL VERSION — detailed story):
Client: ${clientLabel} | Industry: ${cs.industry} | Service: ${cs.service_type}
Duration: ${cs.duration || 'Not specified'} | Relationship status: ${cs.relationship_status || 'Active'}${statusNote}
Situation: ${cs.situation}
Problem: ${cs.problem}
Solution: ${cs.solution}
Result: ${cs.result}
Metrics: ${cs.metrics}
${cs.testimonial ? `Testimonial: "${cs.testimonial}"` : ''}`;
  }).join('\n\n');

  const userPrompt = `Generate a ${meeting.meeting_type} presentation for ${clientData.full_name} at ${clientData.company_name || 'their company'}.

Client details:
- Industry: ${clientData.industry || 'Not specified'}
- Client type: ${clientData.client_type || 'Not specified'}
- Website: ${clientData.website_url || 'Not provided'}
- LinkedIn: ${clientData.linkedin_url || 'Not provided'}
- Location: ${clientData.location || 'Not specified'}
- Email: ${clientData.email || 'Not provided'}
- Notes: ${clientData.notes || 'None'}

CLIENT TYPE FRAMING — use this to position DM differently for this client:
${clientTypeFraming || 'Tailor based on their context.'}

Meeting date: ${meeting.meeting_date}
Service to pitch: ${meeting.service_pitched || 'Not specified'}
Extra context: ${meeting.extra_context || 'None provided'}

Previous meeting history (including what happened in each):
${previousMeetingsSummary}

Slides to generate (in this order):
${slides.map(id => `${id}. ${slideNames[id] || 'Unknown'}`).join('\n')}

Case studies to include:
${caseStudyContext || 'None selected'}

Show brand names in case studies: ${brandNameToggle ? 'YES' : 'NO — anonymize all client names'}

Company context:
${companyContext}

Services offered:
${services.map(s => `- ${s.name} (${s.track}): ${s.pricing_tier_1} | ${s.pricing_tier_2} | ${s.pricing_tier_3}`).join('\n')}

SLIDE CONTENT RULES:
- Slide 1 (Cover): Meeting type label, client name + company, date. Layout: cover.
- Slide 2 (Who we are): Adapt depth based on meeting type. M1/M2 first meeting: 50/50 studio story and numbers. M3 first: 80% numbers. Include: 60+ team, 60,000+ monthly deliverables, 1,500+ clients, 12+ years, $100M+ client revenue influenced.
- Slide 3 (Who you are): M1 version — show light research, ask open question, invite them to share more. M2 version — broad and curious, show homework. M3 version — sharper and deeper.
- Slide 4 (What we noticed): 3 sharp specific observations about their situation, gaps, opportunities. Based on previous meeting notes if available.
- Slide 5 (The challenge): ONE core pain framed in their language. Sharp enough to make them nod.
- Slide 6 (Our solution for you): Selling the idea in M3. Confirming scope in M4.
- Slide 7 (Discovery questions): M2: 4-5 open questions. M3: 2-3 confirmation questions. M1: not applicable.
- Slide 8 (Case study): M2 LIGHT VERSION — one result, one line only, build credibility while listening. M3 FULL VERSION — complete story, situation→problem→solution→result→metrics. Match to client's industry and situation as closely as possible.
- Slide 9 (What we heard): Summary of what client told us in previous meetings — their goals, problems, priorities in their own words.
- Slide 10 (Scope of work): Specific numbered deliverables. No ambiguity.
- Slide 11 (Timeline): Concrete phases and milestones. M4: proposal timeline. M5: real and actionable.
- Slide 12 (Investment): Pricing based on service pitched. Present clearly using tiers if multiple options fit.
- Slide 13 (How we work): M3/M2+M3: high level, builds trust. M5: deep operational briefing — tools, turnaround, communication channels.
- Slide 14 (How revisions work): How many rounds, how to give feedback, turnaround time.
- Slide 15 (Day one playbook): Tools, how to submit briefs, communication channels. Action-oriented.
- Slide 16 (Your team): Who works on their account. Use generic roles: Creative Director, Design Lead, POD Specialist, etc.
- Slide 17 (What we're building together): Restate their goals in their language. Alignment moment.
- Slide 18 (Week 1 expectations): Exact first steps — what they receive, what they must do.
- Slide 19 (Next step): Low pressure. M1: plant the seed, hint at next conversation. M2: we take the next action. M3: we can put together a proposal when ready. M4: here's how to move forward. M5: submit your first brief today.
- Slide 20 (Proof + Trusted by): FIXED CONTENT — top section: always use these exact company numbers: 1,500+ clients served globally, 60,000+ monthly deliverables, 12+ years in the industry, $100M+ client revenue influenced, 60+ team members, US/UK/Bangladesh presence. Bottom section: if partner brands are listed below, add a "Trusted by" section referencing those brand names. Layout: two-column or bullets.
${partnerBrandNames.length > 0 ? `Partner brands to mention in Trusted by section: ${partnerBrandNames.join(', ')}` : 'No partner brands selected for this presentation.'}

Return a JSON array of slide objects. Each object must have: slide_id (integer), slide_title, slide_subtitle (or null), body_content (array of strings), speaker_notes (string), layout (string).`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8096,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt
  });

  const content = message.content[0].text;

  let jsonStr = content;
  if (content.includes('```json')) {
    jsonStr = content.split('```json')[1].split('```')[0].trim();
  } else if (content.includes('```')) {
    jsonStr = content.split('```')[1].split('```')[0].trim();
  }

  return JSON.parse(jsonStr);
}

module.exports = { generatePresentationContent };
