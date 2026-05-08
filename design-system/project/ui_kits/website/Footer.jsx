// Footer.jsx — Musketeers website footer

const Footer = ({ onNavigate }) => {
  const cols = [
    { title: 'Services', links: ['Brand Identity', 'Website Design', 'Product Co-Launch', 'AI Operations', 'Growth Strategy'] },
    { title: 'Company', links: ['About', 'Work', 'Careers', 'Partners', 'Press'] },
    { title: 'Connect', links: ['Contact', 'LinkedIn', 'Instagram', 'Behance', 'Dribbble'] },
  ];

  return (
    <footer style={footerStyles.root}>
      <div style={footerStyles.stripe}></div>
      <div style={footerStyles.inner}>
        <div style={footerStyles.top}>
          <div style={footerStyles.brand}>
            <img src="../../assets/logo-full-light.svg" alt="Musketeers" style={footerStyles.logo} />
            <p style={footerStyles.tagline}>Bold by nature. Built for impact.</p>
          </div>
          {cols.map(col => (
            <div key={col.title} style={footerStyles.col}>
              <div style={footerStyles.colTitle}>{col.title}</div>
              {col.links.map(link => (
                <a key={link} href="#" onClick={e => e.preventDefault()} style={footerStyles.colLink}>{link}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={footerStyles.bottom}>
          <span style={footerStyles.copy}>© 2025 Musketeers. All rights reserved.</span>
          <div style={footerStyles.legal}>
            <a href="#" style={footerStyles.legalLink}>Privacy</a>
            <a href="#" style={footerStyles.legalLink}>Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const footerStyles = {
  root: { background: '#000', color: '#fff' },
  stripe: { height: 4, background: 'linear-gradient(to right,#FFD81D 0%,#FC2511 33%,#6A00D0 49%,#2431F3 58%,#0D41FF 67%,#009A88 82%,#30E047 100%)' },
  inner: { maxWidth: 1200, margin: '0 auto', padding: '64px 64px 32px' },
  top: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, paddingBottom: 48, borderBottom: '1px solid #282828' },
  brand: { display: 'flex', flexDirection: 'column', gap: 16 },
  logo: { height: 28, width: 'auto' },
  tagline: { fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#707070', lineHeight: 1.5, margin: 0 },
  col: { display: 'flex', flexDirection: 'column', gap: 12 },
  colTitle: { fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', marginBottom: 4 },
  colLink: { fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#707070', textDecoration: 'none', transition: 'color 120ms' },
  bottom: { paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  copy: { fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#484848' },
  legal: { display: 'flex', gap: 24 },
  legalLink: { fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#484848', textDecoration: 'none' },
};

Object.assign(window, { Footer });
