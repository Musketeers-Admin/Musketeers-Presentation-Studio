// Hero.jsx — Musketeers homepage hero section

const Hero = ({ onCTA }) => {
  return (
    <section style={heroStyles.root}>
      <div style={heroStyles.inner}>
        <div style={heroStyles.eyebrow}>
          <span style={heroStyles.eyebrowDot}></span>
          Brand &amp; Business Solutions
        </div>
        <h1 style={heroStyles.headline}>
          Not a vendor.<br />A lifeline.
        </h1>
        <p style={heroStyles.sub}>
          Musketeers helps entrepreneurs with versatile solutions, driven by persistent innovation that feels vital to their growth.
        </p>
        <div style={heroStyles.actions}>
          <button style={heroStyles.ctaPrimary} onClick={onCTA}>Get Started</button>
          <button style={heroStyles.ctaSecondary} onClick={onCTA}>View Our Work</button>
        </div>
        <div style={heroStyles.pillars}>
          {['Persistent', 'Vital', 'Growth'].map((p, i) => (
            <div key={p} style={{ ...heroStyles.pillar, borderLeft: `3px solid ${['#FC2E12','#0D41FF','#30E047'][i]}` }}>
              <span style={heroStyles.pillarLabel}>{p}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={heroStyles.visual}>
        <div style={heroStyles.logoMark}>
          <img src="../../assets/logomark-dark.svg" alt="" style={heroStyles.logoMarkImg} />
        </div>
        <div style={heroStyles.bigNumber}>01</div>
      </div>
    </section>
  );
};

const heroStyles = {
  root: { background: '#000', minHeight: 560, display: 'flex', alignItems: 'stretch' },
  inner: { maxWidth: 640, padding: '80px 32px 80px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28, flex: 1 },
  eyebrow: { fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#707070', display: 'flex', alignItems: 'center', gap: 10 },
  eyebrowDot: { width: 6, height: 6, borderRadius: '50%', background: '#30E047', display: 'inline-block' },
  headline: { fontFamily: "'Inter Display', 'Inter', sans-serif", fontSize: 'clamp(48px, 6vw, 88px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.04em', color: '#fff', margin: 0 },
  sub: { fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 400, lineHeight: 1.6, color: '#707070', maxWidth: 480, margin: 0 },
  actions: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  ctaPrimary: { fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, background: '#fff', color: '#000', border: 'none', padding: '13px 32px', cursor: 'pointer' },
  ctaSecondary: { fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, background: 'transparent', color: '#fff', border: '1px solid #484848', padding: '12px 32px', cursor: 'pointer' },
  pillars: { display: 'flex', gap: 24 },
  pillar: { padding: '8px 0 8px 12px' },
  pillarLabel: { fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' },
  visual: { flex: '0 0 320px', background: '#0C0C0C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  logoMark: { zIndex: 2 },
  logoMarkImg: { width: 120, height: 'auto', opacity: 0.9 },
  bigNumber: { position: 'absolute', bottom: 24, right: 24, fontFamily: "'Inter Display','Inter',sans-serif", fontSize: 96, fontWeight: 900, color: '#181818', lineHeight: 1, userSelect: 'none' },
};

Object.assign(window, { Hero });
