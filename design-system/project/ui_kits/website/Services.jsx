// Services.jsx — Musketeers services grid section

const SERVICES = [
  { tag: 'Brand', title: 'Brand Identity', desc: 'Logo, language, and visual system — built to last and scale.', accent: '#FC2E12' },
  { tag: 'Web', title: 'Website Design', desc: 'Conversion-optimized, beautifully crafted, and built to perform.', accent: '#0D41FF' },
  { tag: 'SaaS', title: 'Product Co-Launch', desc: 'Partner with our Genesys ecosystem to launch your next software venture.', accent: '#30E047' },
  { tag: 'AI', title: 'AI Operations', desc: 'SOPs, CRM, and productivity — simplified by intelligence.', accent: '#FFD81D' },
  { tag: 'Strategy', title: 'Growth Strategy', desc: 'Clarity calls, funnel systems, and a roadmap to 20% YoY growth.', accent: '#FC2E12' },
  { tag: 'Content', title: 'Content & SEO', desc: 'Blog, social, YouTube, and UGC that builds lasting authority.', accent: '#0D41FF' },
];

const Services = ({ onSelect }) => {
  const [hovered, setHovered] = React.useState(null);

  return (
    <section style={servicesStyles.root}>
      <div style={servicesStyles.header}>
        <div style={servicesStyles.eyebrow}>What We Do</div>
        <h2 style={servicesStyles.headline}>Versatile solutions.<br />One ecosystem.</h2>
      </div>
      {/* Stripe divider */}
      <div style={servicesStyles.stripe}></div>
      <div style={servicesStyles.grid}>
        {SERVICES.map((s, i) => (
          <div
            key={i}
            style={{
              ...servicesStyles.card,
              ...(hovered === i ? servicesStyles.cardHover : {}),
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect?.(s)}
          >
            <div style={{ ...servicesStyles.cardTag, color: s.accent }}>{s.tag}</div>
            <div style={servicesStyles.cardTitle}>{s.title}</div>
            <div style={servicesStyles.cardDesc}>{s.desc}</div>
            <div style={{ ...servicesStyles.arrow, color: hovered === i ? s.accent : '#484848' }}>→</div>
          </div>
        ))}
      </div>
    </section>
  );
};

const servicesStyles = {
  root: { background: '#fff', padding: '80px 64px' },
  header: { maxWidth: 1200, margin: '0 auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 32 },
  eyebrow: { position: 'absolute', display: 'none' },
  headline: { fontFamily: "'Inter Display','Inter',sans-serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#000', margin: 0 },
  stripe: { height: 4, background: 'linear-gradient(to right,#FFD81D 0%,#FC2511 33%,#6A00D0 49%,#2431F3 58%,#0D41FF 67%,#009A88 82%,#30E047 100%)', maxWidth: 1200, margin: '0 auto 48px' },
  grid: { maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#E8E8E8' },
  card: { background: '#fff', padding: '32px 28px', cursor: 'pointer', transition: 'background 120ms', display: 'flex', flexDirection: 'column', gap: 10 },
  cardHover: { background: '#F5F5F5' },
  cardTag: { fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' },
  cardTitle: { fontFamily: "'Inter Display','Inter',sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#000', lineHeight: 1.1 },
  cardDesc: { fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: '#707070', flex: 1 },
  arrow: { fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 400, transition: 'color 120ms', marginTop: 4 },
};

Object.assign(window, { Services });
