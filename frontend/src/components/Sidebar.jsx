import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-dots">
          <div className="sidebar-logo-dot" style={{ background: '#FFD81D' }} />
          <div className="sidebar-logo-dot" style={{ background: '#FC2E12' }} />
          <div className="sidebar-logo-dot" style={{ background: '#0D41FF' }} />
          <div className="sidebar-logo-dot" style={{ background: '#30E047' }} />
        </div>
        <div className="sidebar-logo-name">Design Musketeer</div>
        <div className="sidebar-logo-sub">Presentation Studio</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">🏠</span>
          Dashboard
        </NavLink>

        <NavLink to="/clients" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">👥</span>
          Leads &amp; Clients
        </NavLink>

        <NavLink to="/presentations" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">📊</span>
          Presentations
        </NavLink>

        <div className="sidebar-section-label">Admin</div>

        <NavLink to="/admin/company-info" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">⚙️</span>
          Company Info
        </NavLink>

        <NavLink to="/admin/services" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">📦</span>
          Services
        </NavLink>

        <NavLink to="/admin/case-studies" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">📋</span>
          Case Studies
        </NavLink>

        <NavLink to="/admin/partner-brands" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">🤝</span>
          Partner Brands
        </NavLink>

        <NavLink to="/admin/client-types" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">🏷️</span>
          Client Types
        </NavLink>

        <NavLink to="/admin/brand-guide" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">🎨</span>
          Brand Guide
        </NavLink>

        {user?.role === 'admin' && (
          <NavLink to="/admin/team" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">👤</span>
            Team
          </NavLink>
        )}

        <NavLink to="/settings" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">🔑</span>
          Settings
        </NavLink>
      </nav>

      {/* New Presentation button */}
      <div className="sidebar-bottom">
        <button className="btn-new-presentation" onClick={() => navigate('/presentations/new')}>
          + New Presentation
        </button>
      </div>

      {/* User menu */}
      <div className="sidebar-user" ref={menuRef}>
        {menuOpen && (
          <div className="sidebar-user-menu">
            <NavLink
              to="/profile"
              className="sidebar-user-item"
              onClick={() => setMenuOpen(false)}
            >
              My Profile
            </NavLink>
            <button className="sidebar-user-item sidebar-user-signout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        )}
        <button className="sidebar-user-btn" onClick={() => setMenuOpen(o => !o)}>
          <div className="sidebar-user-avatar">{getInitials(user?.name)}</div>
          <span className="sidebar-user-name">{user?.name}</span>
          <span className="sidebar-user-chevron">{menuOpen ? '▼' : '▲'}</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
