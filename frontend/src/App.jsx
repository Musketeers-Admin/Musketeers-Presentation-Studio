import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientRecord from './pages/ClientRecord';
import Presentations from './pages/Presentations';
import NewPresentation from './pages/NewPresentation/index';
import CompanyInfo from './pages/admin/CompanyInfo';
import Services from './pages/admin/Services';
import CaseStudies from './pages/admin/CaseStudies';
import PartnerBrands from './pages/admin/PartnerBrands';
import BrandGuide from './pages/admin/BrandGuide';
import ClientTypes from './pages/admin/ClientTypes';
import Team from './pages/admin/Team';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function AppContent() {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div className="loading-state" style={{ height: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientRecord />} />
          <Route path="/presentations" element={<Presentations />} />
          <Route path="/presentations/new" element={<NewPresentation />} />
          <Route path="/admin/company-info" element={<CompanyInfo />} />
          <Route path="/admin/services" element={<Services />} />
          <Route path="/admin/case-studies" element={<CaseStudies />} />
          <Route path="/admin/partner-brands" element={<PartnerBrands />} />
          <Route path="/admin/brand-guide" element={<BrandGuide />} />
          <Route path="/admin/client-types" element={<ClientTypes />} />
          {user.role === 'admin' && <Route path="/admin/team" element={<Team />} />}
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
