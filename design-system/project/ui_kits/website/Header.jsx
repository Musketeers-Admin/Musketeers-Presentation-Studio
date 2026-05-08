// Header.jsx — Musketeers top navigation
// Shared to window for use in index.html

const Header = ({ currentPage = 'home', onNavigate }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const links = ['Services', 'Work', 'About', 'Contact'];

  return (
    <header style={headerStyles.root}>
      <div style={headerStyles.inner}>
        {/* Logo */}
        <div style={headerStyles.logo} onClick={() => onNavigate?.('home')} role="button">
          <img src="../../assets/logo-full-dark.svg" alt="Musketeers" style={headerStyles.logoImg} />
        </div>
        {/* Desktop nav */}
        <nav style={headerStyles.nav}>
          {links.map(link => (
            <a
              key={link}
              href="#"
              onClick={e => { e.preventDefault(); onNavigate?.(link.toLowerCase()); }}
              style={{
                ...headerStyles.navLink,
                ...(currentPage === link.toLowerCase() ? headerStyles.navLinkActive : {})
              }}
            >{link}</a>
          ))}
        </nav>
        {/* CTA */}
        <button style={headerStyles.cta} onClick={() => onNavigate?.('contact')}>
          Let's Talk
        </button>
        {/* Mobile hamburger */}
        <button style={headerStyles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          <span style={headerStyles.hbar}></span>
          <span style={headerStyles.hbar}></span>
          <span style={headerStyles.hbar}></span>
        </button>
      </div>
      {/* Stripe */}
      <div style={headerStyles.stripe}></div>
      {/* Mobile menu */}
      {menuOpen && (
        <div style={headerStyles.mobileMenu}>
          {links.map(link => (
            <a key={link} href="#" onClick={e => { e.preventDefault(); onNavigate?.(link.toLowerCase()); setMenuOpen(false); }}
              style={headerStyles.mobileLink}>{link}</a>
          ))}
          <button style={headerStyles.mobileCta} onClick={() => { onNavigate?.('contact'); setMenuOpen(false); }}>Let's Talk</button>
        </div>
      )}
    </header>
  );
};

const headerStyles = {
  root: { background: '#fff', borderBottom: '1px solid #E8E8E8', position: 'sticky', top: 0, zIndex: 100 },
  inner: { maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 40 },
  logo: { cursor: 'pointer', flexShrink: 0 },
  logoImg: { height: 28, width: 'auto', display: 'block' },
  nav: { display: 'flex', gap: 32, flex: 1 },
  navLink: { fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, color: '#707070', textDecoration: 'none', letterSpacing: '0.01em', transition: 'color 120ms' },
  navLinkActive: { color: '#000', fontWeight: 600 },
  cta: { fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, background: '#000', color: '#fff', border: 'none', padding: '10px 22px', cursor: 'pointer', flexShrink: 0 },
  hamburger: { display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  hbar: { display: 'block', width: 22, height: 2, background: '#000' },
  stripe: { height: 3, background: 'linear-gradient(to right,#FFD81D 0%,#FC2511 33%,#6A00D0 49%,#2431F3 58%,#0D41FF 67%,#009A88 82%,#30E047 100%)' },
  mobileMenu: { background: '#fff', borderTop: '1px solid #E8E8E8', padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: 0 },
  mobileLink: { fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 500, color: '#000', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #F5F5F5' },
  mobileCta: { fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, background: '#000', color: '#fff', border: 'none', padding: '12px 0', marginTop: 12, cursor: 'pointer' },
};

Object.assign(window, { Header });
