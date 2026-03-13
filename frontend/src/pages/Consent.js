import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import './Consent.css';

const MOCK_CONSENTS = [
  { id: 'CON-001', patient_global_id: 'PAT-GLB-001', patient_name: 'Alice Johnson',   granting_hospital: 'HOSP_001', requesting_hospital: 'HOSP_002', status: 'active',  granted_at: '2025-02-01', expires_at: '2026-02-01', purpose: 'Specialist Referral' },
  { id: 'CON-002', patient_global_id: 'PAT-GLB-002', patient_name: 'Bob Martinez',    granting_hospital: 'HOSP_001', requesting_hospital: 'HOSP_003', status: 'active',  granted_at: '2025-02-10', expires_at: '2025-08-10', purpose: 'Emergency Care' },
  { id: 'CON-003', patient_global_id: 'PAT-GLB-003', patient_name: 'Carol Williams',  granting_hospital: 'HOSP_001', requesting_hospital: 'HOSP_002', status: 'active',  granted_at: '2025-03-01', expires_at: '2026-03-01', purpose: 'Chronic Care Management' },
  { id: 'CON-004', patient_global_id: 'PAT-GLB-004', patient_name: 'David Chen',      granting_hospital: 'HOSP_002', requesting_hospital: 'HOSP_001', status: 'revoked', granted_at: '2025-01-15', expires_at: '2026-01-15', purpose: 'Lab Results Sharing', revoked_at: '2025-04-01' },
  { id: 'CON-005', patient_global_id: 'PAT-GLB-005', patient_name: 'Eva Rodriguez',   granting_hospital: 'HOSP_002', requesting_hospital: 'HOSP_003', status: 'active',  granted_at: '2025-03-15', expires_at: '2026-03-15', purpose: 'Cardiology Consult' },
  { id: 'CON-006', patient_global_id: 'PAT-GLB-006', patient_name: 'Frank Thompson',  granting_hospital: 'HOSP_003', requesting_hospital: 'HOSP_001', status: 'expired', granted_at: '2024-06-01', expires_at: '2025-01-01', purpose: 'Surgical Planning' },
];

const HOSP_NAMES = { HOSP_001: 'City General', HOSP_002: "St. Mary's", HOSP_003: 'Northwest Clinic' };

const STATUS_ORDER = { active: 0, expired: 1, revoked: 2 };

export default function Consent({ backendUrl }) {
  const [consents, setConsents]   = useState(MOCK_CONSENTS);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({
    patient_global_id: '',
    granting_hospital: 'HOSP_001',
    requesting_hospital: 'HOSP_002',
    expires_at: '',
    purpose: '',
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const pRes = await API.get('/api/patients');
        if (!alive) return;
        const patients = pRes.data?.patients || pRes.data || [];
        
        let allConsents = [];
        for (const p of patients) {
          try {
            const cRes = await API.get(`/api/consent/${p.global_id || p.id}`);
            allConsents.push(...(cRes.data?.consents || cRes.data || []));
          } catch(e) {}
        }
        if (allConsents.length > 0) {
          setConsents(allConsents.map(c => ({
              ...c,
              id: c.consent_id || c.id,
              granting_hospital: c.granting_institution || c.granting_hospital,
              requesting_hospital: c.requesting_institution || c.requesting_hospital,
          })));
        }
      } catch { /* mock */ }
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [backendUrl]);

  const revoke = async (c) => {
    try {
      await API.post(`/api/consent/revoke`, {
        patient_id: c.patient_id || c.patient_global_id,
        institution_id: c.requesting_hospital || c.requesting_institution
      });
      toast.success('Consent revoked');
    } catch { /* mock offline */ }
    setConsents(prev => prev.map(item => item.id === c.id ? { ...item, status: 'revoked', revoked_at: new Date().toISOString().slice(0,10) } : item));
  };

  const grantConsent = async () => {
    if (!form.patient_global_id || !form.expires_at || !form.purpose) {
      toast.error('Please fill all required fields'); return;
    }
    try {
      await API.post('/api/consent/grant', {
        patient_id: form.patient_global_id,
        institution_id: form.requesting_hospital,
        expiry: form.expires_at,
        purpose: form.purpose
      });
      toast.success('Consent granted!');
    } catch(err) { 
      toast.success(err.response?.data?.detail?.message || 'Consent granted! (demo mode)'); 
    }
    const newId = `CON-${String(consents.length + 1).padStart(3,'0')}`;
    setConsents(prev => [...prev, {
      ...form, id: newId, status: 'active',
      granted_at: new Date().toISOString().slice(0,10),
      patient_name: '—',
      granting_hospital: form.granting_hospital,
      requesting_hospital: form.requesting_hospital,
    }]);
    setShowForm(false);
    setForm({ patient_global_id: '', granting_hospital: 'HOSP_001', requesting_hospital: 'HOSP_002', expires_at: '', purpose: '' });
  };

  const displayed = [...consents]
    .filter(c => filter === 'all' || c.status === filter)
    .sort((a,b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  const active  = consents.filter(c => c.status === 'active').length;
  const revoked = consents.filter(c => c.status === 'revoked').length;
  const expired = consents.filter(c => c.status === 'expired').length;

  return (
    <div className="consent animate-fade-in">
      <div className="page-header">
        <h1>🔐 Consent Manager</h1>
        <p>Grant, view, and revoke cross-hospital data access permissions</p>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 'var(--sp-5)' }}>
        {[
          { label: 'Active Consents',  value: active,  color: 'green',  icon: '✅' },
          { label: 'Revoked',          value: revoked, color: 'red',    icon: '❌' },
          { label: 'Expired',          value: expired, color: 'gray',   icon: '⏰' },
          { label: 'Total',            value: consents.length, color: 'blue', icon: '🔐' },
        ].map(s => (
          <div key={s.label} className={`stat-card stat-card--${s.color} animate-fade-up`}>
            <div className="stat-card__icon">{s.icon}</div>
            <div className="stat-card__body">
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="consent__toolbar">
        <div className="consent__filters">
          {['all','active','revoked','expired'].map(f => (
            <button
              key={f}
              className={`consent__filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="consent__filter-count">
                  {f === 'active' ? active : f === 'revoked' ? revoked : expired}
                </span>
              )}
            </button>
          ))}
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Grant New Consent'}
        </button>
      </div>

      {/* Grant Form */}
      {showForm && (
        <div className="card consent__form animate-fade-up">
          <div className="card__header">
            <div className="card__title"><div className="card__icon">➕</div>Grant New Consent</div>
          </div>
          <div className="card__body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 'var(--sp-4)' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Patient Global ID *</label>
                <input className="form-control" placeholder="PAT-GLB-001" value={form.patient_global_id} onChange={e => setForm(f => ({...f, patient_global_id: e.target.value}))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Granting Hospital *</label>
                <select className="form-control" value={form.granting_hospital} onChange={e => setForm(f => ({...f, granting_hospital: e.target.value}))}>
                  <option value="HOSP_001">HOSP_001 — City General</option>
                  <option value="HOSP_002">HOSP_002 — St. Mary's</option>
                  <option value="HOSP_003">HOSP_003 — Northwest Clinic</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Requesting Hospital *</label>
                <select className="form-control" value={form.requesting_hospital} onChange={e => setForm(f => ({...f, requesting_hospital: e.target.value}))}>
                  <option value="HOSP_001">HOSP_001 — City General</option>
                  <option value="HOSP_002">HOSP_002 — St. Mary's</option>
                  <option value="HOSP_003">HOSP_003 — Northwest Clinic</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Expires At *</label>
                <input type="date" className="form-control" value={form.expires_at} onChange={e => setForm(f => ({...f, expires_at: e.target.value}))} />
              </div>
              <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                <label className="form-label">Purpose *</label>
                <input className="form-control" placeholder="e.g. Cardiology Referral" value={form.purpose} onChange={e => setForm(f => ({...f, purpose: e.target.value}))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)', justifyContent: 'flex-end' }}>
              <button className="btn btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={grantConsent}>✅ Grant Consent</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card animate-fade-up" style={{ marginTop: 'var(--sp-4)' }}>
        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Consent ID</th>
                  <th>Patient</th>
                  <th>Grantor</th>
                  <th>Requestor</th>
                  <th>Purpose</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--gray-400)', padding: 32 }}>No consents match this filter</td></tr>
                ) : displayed.map(c => (
                  <tr key={c.id}>
                    <td><code>{c.id}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.patient_name || '—'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>{c.patient_global_id}</div>
                    </td>
                    <td><span className="badge badge--blue">{HOSP_NAMES[c.granting_hospital] || c.granting_hospital}</span></td>
                    <td><span className="badge badge--info">{HOSP_NAMES[c.requesting_hospital] || c.requesting_hospital}</span></td>
                    <td style={{ fontSize: 'var(--text-sm)' }}>{c.purpose || '—'}</td>
                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                      {c.expires_at || '—'}
                      {c.revoked_at && <div style={{ color: 'var(--color-error)', fontSize: 11 }}>Revoked: {c.revoked_at}</div>}
                    </td>
                    <td>
                      <span className={`badge badge--${c.status === 'active' ? 'success' : c.status === 'revoked' ? 'error' : 'gray'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.status === 'active' && (
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => { if (window.confirm('Revoke this consent?')) revoke(c); }}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
