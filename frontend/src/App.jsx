import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
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
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
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
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
