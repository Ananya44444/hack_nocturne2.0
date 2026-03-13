import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import Dashboard     from './pages/Dashboard';
import Hospitals     from './pages/Hospitals';
import Patients      from './pages/Patients';
import Consent       from './pages/Consent';
import MPI           from './pages/MPI';
import Audit         from './pages/Audit';
import FHIRExplorer  from './pages/FHIRExplorer';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',       icon: '📊', path: '/',            section: 'OVERVIEW' },
  { id: 'hospitals',    label: 'Hospitals',        icon: '🏥', path: '/hospitals',   section: 'REGISTRY' },
  { id: 'patients',     label: 'Patients',         icon: '👤', path: '/patients',    section: 'REGISTRY' },
  { id: 'mpi',          label: 'Master Patient Index', icon: '🔍', path: '/mpi',    section: 'REGISTRY' },
  { id: 'consent',      label: 'Consent Manager',  icon: '🔐', path: '/consent',    section: 'ACCESS' },
  { id: 'fhir',         label: 'FHIR Explorer',    icon: '📋', path: '/fhir',       section: 'DATA' },
  { id: 'audit',        label: 'Audit Trail',      icon: '⛓️',  path: '/audit',      section: 'DATA' },
];

function Sidebar({ backendUrl }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const sections = ['OVERVIEW', 'REGISTRY', 'ACCESS', 'DATA'];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">🏥</div>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">HealthBridge</span>
          <span className="sidebar__brand-sub">FHIR Platform</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {sections.map(section => {
          const items = NAV_ITEMS.filter(i => i.section === section);
          return (
            <div key={section}>
              <div className="sidebar__section-label">{section}</div>
              {items.map(item => {
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.id}
                    className={`sidebar__item ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="sidebar__item-icon">{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__status">
          <span className="sidebar__status-dot" />
          System Online
        </div>
      </div>
    </aside>
  );
}

function Topbar({ backendUrl, setBackendUrl }) {
  const [showConfig, setShowConfig] = useState(false);
  const [draft, setDraft] = useState(backendUrl);
  const [draftHosp, setDraftHosp] = useState(localStorage.getItem('healthbridge_hosp_id') || 'HOSP_001');
  const [draftKey, setDraftKey] = useState(localStorage.getItem('healthbridge_api_key') || 'key_001');
  const location = useLocation();

  const pageTitles = {
    '/': 'Dashboard',
    '/hospitals': 'Hospital Registry',
    '/patients': 'Patient Records',
    '/mpi': 'Master Patient Index',
    '/consent': 'Consent Manager',
    '/fhir': 'FHIR Explorer',
    '/audit': 'Audit Trail',
  };

  const title = Object.entries(pageTitles).find(
    ([path]) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] || 'HealthBridge';

  const save = () => {
    setBackendUrl(draft);
    localStorage.setItem('healthbridge_backend', draft);
    localStorage.setItem('healthbridge_hosp_id', draftHosp);
    localStorage.setItem('healthbridge_api_key', draftKey);
    // Reload to apply new headers globally easily
    window.location.reload();
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar__left">
          <span className="topbar__page-title">{title}</span>
        </div>
        <div className="topbar__right">
          <div className="topbar__backend-indicator">
            <span style={{ color: '#34d399', fontSize: 9 }}>●</span>
            {backendUrl}
          </div>
          <button className="topbar__config-btn" onClick={() => { setDraft(backendUrl); setShowConfig(true); }}>
            ⚙️ Config
          </button>
        </div>
      </header>

      {showConfig && (
        <div className="modal-backdrop" onClick={() => setShowConfig(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__title">⚙️ API Configuration</div>
            <p className="modal__subtitle">Set the HealthBridge backend URL. The mock backend runs on port 8001.</p>
            <div className="form-group">
              <label className="form-label">Backend URL</label>
              <input
                className="form-control"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="http://localhost:8000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hospital ID</label>
              <input
                className="form-control"
                value={draftHosp}
                onChange={e => setDraftHosp(e.target.value)}
                placeholder="HOSP_001"
              />
            </div>
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input
                type="password"
                className="form-control"
                value={draftKey}
                onChange={e => setDraftKey(e.target.value)}
                placeholder="key_001"
              />
            </div>
            <div className="modal__actions">
              <button className="btn btn--ghost btn--sm" onClick={() => setShowConfig(false)}>Cancel</button>
              <button className="btn btn--primary btn--sm" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AppLayout({ backendUrl, setBackendUrl }) {
  return (
    <div className="app-shell">
      <Sidebar backendUrl={backendUrl} />
      <div className="main-area">
        <Topbar backendUrl={backendUrl} setBackendUrl={setBackendUrl} />
        <main className="page-content">
          <Routes>
            <Route path="/"          element={<Dashboard    backendUrl={backendUrl} />} />
            <Route path="/hospitals" element={<Hospitals    backendUrl={backendUrl} />} />
            <Route path="/patients"  element={<Patients     backendUrl={backendUrl} />} />
            <Route path="/mpi"       element={<MPI          backendUrl={backendUrl} />} />
            <Route path="/consent"   element={<Consent      backendUrl={backendUrl} />} />
            <Route path="/fhir"      element={<FHIRExplorer backendUrl={backendUrl} />} />
            <Route path="/audit"     element={<Audit        backendUrl={backendUrl} />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [backendUrl, setBackendUrl] = useState(
    localStorage.getItem('healthbridge_backend') || 'http://localhost:8000'
  );

  return (
    <BrowserRouter>
      <AppLayout backendUrl={backendUrl} setBackendUrl={setBackendUrl} />
    </BrowserRouter>
  );
}
