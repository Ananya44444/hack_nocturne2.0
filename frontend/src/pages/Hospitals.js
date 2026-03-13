import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import './Hospitals.css';

const MOCK_HOSPITALS = [
  {
    id: 'HOSP_001',
    name: 'City General Hospital',
    location: 'New York, NY',
    api_key: 'key_001',
    patient_count: 3,
    status: 'active',
    specialties: ['Cardiology', 'Oncology', 'Neurology'],
    joined: '2025-01-15',
  },
  {
    id: 'HOSP_002',
    name: "St. Mary's Medical Center",
    location: 'Los Angeles, CA',
    api_key: 'key_002',
    patient_count: 2,
    status: 'active',
    specialties: ['Pediatrics', 'Emergency'],
    joined: '2025-02-10',
  },
  {
    id: 'HOSP_003',
    name: 'Northwest Regional Clinic',
    location: 'Seattle, WA',
    api_key: 'key_003',
    patient_count: 2,
    status: 'active',
    specialties: ['General Medicine', 'Orthopedics'],
    joined: '2025-03-05',
  },
];

export default function Hospitals({ backendUrl }) {
  const [hospitals, setHospitals] = useState(MOCK_HOSPITALS);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await API.get('/api/hospitals');
        if (!alive) return;
        const data = res.data?.hospitals || res.data || [];
        if (data.length > 0) setHospitals(data);
      } catch { /* Use mock */ }
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [backendUrl]);

  const filtered = hospitals.filter(h =>
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.id?.toLowerCase().includes(search.toLowerCase()) ||
    h.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="hospitals animate-fade-in">
      <div className="page-header">
        <h1>🏥 Hospital Registry</h1>
        <p>All registered institutions in the HealthBridge network</p>
      </div>

      {/* Toolbar */}
      <div className="hospitals__toolbar">
        <div className="search-bar">
          <span className="search-bar__icon">🔍</span>
          <input
            className="form-control"
            placeholder="Search hospitals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="hospitals__count">
          {filtered.length} hospital{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="page-loading"><span className="spinner" /> Loading hospitals...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">🏥</span>
          <span className="empty-state__text">No hospitals found</span>
        </div>
      ) : (
        <div className="hospitals__grid">
          {filtered.map(h => (
            <div
              key={h.id}
              className={`hospital-card card animate-fade-up ${selected === h.id ? 'hospital-card--selected' : ''}`}
              onClick={() => setSelected(selected === h.id ? null : h.id)}
            >
              <div className="hospital-card__header">
                <div className="hospital-card__icon">🏥</div>
                <div className="hospital-card__meta">
                  <div className="hospital-card__name">{h.name}</div>
                  <div className="hospital-card__location">📍 {h.location || 'N/A'}</div>
                </div>
                <span className={`badge badge--${h.status === 'active' ? 'success' : 'error'}`}>
                  {h.status || 'active'}
                </span>
              </div>

              <div className="hospital-card__body">
                <div className="hospital-card__field">
                  <span className="hospital-card__field-label">Hospital ID</span>
                  <code>{h.id}</code>
                </div>
                <div className="hospital-card__field">
                  <span className="hospital-card__field-label">API Key</span>
                  <code className="hospital-card__apikey">
                    {selected === h.id ? h.api_key : h.api_key?.replace(/./g, '•') || '••••••••'}
                  </code>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={e => { e.stopPropagation(); toast.success('API key revealed!'); setSelected(h.id); }}
                  >
                    {selected === h.id ? '🙈 Hide' : '👁️ Show'}
                  </button>
                </div>
                <div className="hospital-card__field">
                  <span className="hospital-card__field-label">Patients</span>
                  <span className="hospital-card__stat">{h.patient_count ?? '—'}</span>
                </div>
                <div className="hospital-card__field">
                  <span className="hospital-card__field-label">Joined</span>
                  <span>{h.joined ? new Date(h.joined).toLocaleDateString() : '—'}</span>
                </div>
              </div>

              {h.specialties?.length > 0 && (
                <div className="hospital-card__specialties">
                  {h.specialties.map(s => (
                    <span key={s} className="badge badge--blue">{s}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats Banner */}
      <div className="card hospitals__summary animate-fade-up">
        <div className="card__body">
          <div className="hospitals__summary-grid">
            <div className="hospitals__summary-item">
              <span className="hospitals__summary-value">{hospitals.length}</span>
              <span className="hospitals__summary-label">Total Hospitals</span>
            </div>
            <div className="hospitals__summary-item">
              <span className="hospitals__summary-value">
                {hospitals.reduce((s, h) => s + (h.patient_count || 0), 0)}
              </span>
              <span className="hospitals__summary-label">Total Patients</span>
            </div>
            <div className="hospitals__summary-item">
              <span className="hospitals__summary-value">
                {hospitals.filter(h => h.status === 'active').length}
              </span>
              <span className="hospitals__summary-label">Active</span>
            </div>
            <div className="hospitals__summary-item">
              <span className="hospitals__summary-value">3</span>
              <span className="hospitals__summary-label">States</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
