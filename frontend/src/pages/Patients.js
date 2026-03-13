import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './Patients.css';

const MOCK_PATIENTS = [
  { id: 'PAT-GLB-001', local_id: 'LOC-001', hospital_id: 'HOSP_001', name: 'Alice Johnson',    dob: '1985-03-12', gender: 'female', blood_type: 'A+', diagnoses: ['Hypertension', 'Diabetes T2'] },
  { id: 'PAT-GLB-002', local_id: 'LOC-002', hospital_id: 'HOSP_001', name: 'Bob Martinez',     dob: '1972-07-08', gender: 'male',   blood_type: 'O-', diagnoses: ['Coronary Artery Disease'] },
  { id: 'PAT-GLB-003', local_id: 'LOC-003', hospital_id: 'HOSP_001', name: 'Carol Williams',   dob: '1990-11-25', gender: 'female', blood_type: 'B+', diagnoses: ['Asthma'] },
  { id: 'PAT-GLB-004', local_id: 'LOC-004', hospital_id: 'HOSP_002', name: 'David Chen',       dob: '1965-01-30', gender: 'male',   blood_type: 'AB+',diagnoses: ['Chronic Kidney Disease'] },
  { id: 'PAT-GLB-005', local_id: 'LOC-005', hospital_id: 'HOSP_002', name: 'Eva Rodriguez',    dob: '1995-06-14', gender: 'female', blood_type: 'A-', diagnoses: ['Anxiety Disorder'] },
  { id: 'PAT-GLB-006', local_id: 'LOC-006', hospital_id: 'HOSP_003', name: 'Frank Thompson',   dob: '1958-09-03', gender: 'male',   blood_type: 'O+', diagnoses: ['COPD', 'Heart Failure'] },
  { id: 'PAT-GLB-007', local_id: 'LOC-007', hospital_id: 'HOSP_003', name: 'Grace Lee',        dob: '2001-04-22', gender: 'female', blood_type: 'B-', diagnoses: ['Juvenile Diabetes'] },
];

const HOSPITAL_NAMES = {
  HOSP_001: 'City General',
  HOSP_002: "St. Mary's",
  HOSP_003: 'Northwest Clinic',
};

function age(dob) {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000));
}

export default function Patients({ backendUrl }) {
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [hospFilter, setHospFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await API.get('/api/patients');
        if (!alive) return;
        const data = res.data?.patients || res.data || [];
        if (data.length > 0) {
          setPatients(data.map(p => ({
            ...p,
            name: `${p.first_name} ${p.last_name}`,
            dob: p.dob || p.date_of_birth,
            id: p.global_id || p.id
          })));
        }
      } catch { /* mock */ }
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [backendUrl]);

  const filtered = patients.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.id?.toLowerCase().includes(search.toLowerCase());
    const matchHosp   = hospFilter === 'all' || p.hospital_id === hospFilter;
    return matchSearch && matchHosp;
  });

  const hospitals = [...new Set(patients.map(p => p.hospital_id))];

  return (
    <div className="patients animate-fade-in">
      <div className="page-header">
        <h1>👤 Patient Records</h1>
        <p>Global patient registry with cross-hospital identity resolution</p>
      </div>

      {/* Toolbar */}
      <div className="patients__toolbar">
        <div className="search-bar">
          <span className="search-bar__icon">🔍</span>
          <input className="form-control" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 200 }} value={hospFilter} onChange={e => setHospFilter(e.target.value)}>
          <option value="all">All Hospitals</option>
          {hospitals.map(h => <option key={h} value={h}>{HOSPITAL_NAMES[h] || h}</option>)}
        </select>
        <div style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><span className="spinner" /> Loading patients...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Global ID</th>
                  <th>Name</th>
                  <th>Age / DOB</th>
                  <th>Gender</th>
                  <th>Hospital</th>
                  <th>Blood Type</th>
                  <th>Diagnoses</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>No patients found</td></tr>
                ) : filtered.map(p => (
                  <React.Fragment key={p.id}>
                    <tr
                      className={`patients__row ${expanded === p.id ? 'patients__row--expanded' : ''}`}
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><code>{p.id}</code></td>
                      <td>
                        <div className="patients__name">
                          <div className="patients__avatar">{(p.name || '?').charAt(0)}</div>
                          <span style={{ fontWeight: 600 }}>{p.name || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{age(p.dob)} yrs</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>{p.dob}</div>
                      </td>
                      <td>
                        <span className={`badge ${p.gender === 'female' ? 'badge--info' : 'badge--gray'}`}>
                          {p.gender === 'female' ? '♀' : '♂'} {p.gender || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge--blue">{HOSPITAL_NAMES[p.hospital_id] || p.hospital_id || '—'}</span>
                      </td>
                      <td>
                        <span className="badge badge--error">{p.blood_type || '—'}</span>
                      </td>
                      <td>
                        <div className="patients__diagnoses">
                          {(p.diagnoses || []).map(d => (
                            <span key={d} className="badge badge--warning">{d}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {expanded === p.id && (
                      <tr className="patients__detail-row">
                        <td colSpan={7}>
                          <div className="patients__detail">
                            <div className="patients__detail-grid">
                              <div>
                                <div className="patients__detail-label">Local Hospital ID</div>
                                <code>{p.local_id || '—'}</code>
                              </div>
                              <div>
                                <div className="patients__detail-label">Global UUID</div>
                                <code>{p.id}</code>
                              </div>
                              <div>
                                <div className="patients__detail-label">Primary Hospital</div>
                                <strong>{HOSPITAL_NAMES[p.hospital_id] || p.hospital_id}</strong>
                              </div>
                              <div>
                                <div className="patients__detail-label">Date of Birth</div>
                                <span>{p.dob ? new Date(p.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                              </div>
                            </div>
                            <div style={{ marginTop: 'var(--sp-3)', display: 'flex', gap: 'var(--sp-2)' }}>
                              <span className="badge badge--info">📋 FHIR Bundle Available</span>
                              <span className="badge badge--success">✓ MPI Registered</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
