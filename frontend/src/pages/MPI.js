import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const MOCK_MPI = [
  { global_id: 'PAT-GLB-001', local_id: 'LOC-001', hospital_id: 'HOSP_001', name: 'Alice Johnson',  created_at: '2025-01-20' },
  { global_id: 'PAT-GLB-002', local_id: 'LOC-002', hospital_id: 'HOSP_001', name: 'Bob Martinez',   created_at: '2025-01-21' },
  { global_id: 'PAT-GLB-003', local_id: 'LOC-003', hospital_id: 'HOSP_001', name: 'Carol Williams', created_at: '2025-01-22' },
  { global_id: 'PAT-GLB-004', local_id: 'LOC-004', hospital_id: 'HOSP_002', name: 'David Chen',     created_at: '2025-02-10' },
  { global_id: 'PAT-GLB-005', local_id: 'LOC-005', hospital_id: 'HOSP_002', name: 'Eva Rodriguez',  created_at: '2025-02-11' },
  { global_id: 'PAT-GLB-006', local_id: 'LOC-006', hospital_id: 'HOSP_003', name: 'Frank Thompson', created_at: '2025-03-05' },
  { global_id: 'PAT-GLB-007', local_id: 'LOC-007', hospital_id: 'HOSP_003', name: 'Grace Lee',      created_at: '2025-03-06' },
];

const HOSP_NAMES = { HOSP_001: 'City General', HOSP_002: "St. Mary's", HOSP_003: 'Northwest Clinic' };

export default function MPI({ backendUrl }) {
  const [records, setRecords]     = useState(MOCK_MPI);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [lookupLocal, setLookupLocal]   = useState('');
  const [lookupHospital, setLookupHospital] = useState('HOSP_001');
  const [lookupResult, setLookupResult] = useState(null);
  const [looking, setLooking]     = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await API.get('/api/patients');
        if (!alive) return;
        const data = res.data?.patients || res.data || [];
        if (data.length > 0) {
          setRecords(data.map(p => ({
            global_id: p.global_id,
            local_id: p.id || p.local_id,
            hospital_id: p.hospital_id || 'HOSP_001',
            name: `${p.first_name} ${p.last_name}`,
            created_at: p.created_at || new Date().toISOString().slice(0,10)
          })));
        }
      } catch { /* mock */ }
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [backendUrl]);

  const handleLookup = async () => {
    if (!lookupLocal.trim()) { toast.error('Enter a local patient ID'); return; }
    setLooking(true);
    setLookupResult(null);
    try {
      const res = await API.get(`/api/mpi/resolve`, { params: { local_id: lookupLocal, hospital_id: lookupHospital } });
      setLookupResult({ found: true, data: res.data });
    } catch {
      // Fallback to mock search
      const found = records.find(r => r.local_id === lookupLocal && r.hospital_id === lookupHospital);
      setLookupResult(found ? { found: true, data: found } : { found: false });
    }
    setLooking(false);
  };

  const filtered = records.filter(r =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.global_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.local_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🔍 Master Patient Index</h1>
        <p>Global patient identity resolution — maps local hospital IDs to universal UUIDs</p>
      </div>

      <div className="content-grid" style={{ marginBottom: 'var(--sp-5)' }}>
        {/* Lookup tool */}
        <div className="card">
          <div className="card__header">
            <div className="card__title"><div className="card__icon">🔍</div> ID Resolver</div>
          </div>
          <div className="card__body">
            <p style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)' }}>
              Resolve a patient's local hospital ID to their global UUID
            </p>
            <div className="form-group">
              <label className="form-label">Hospital</label>
              <select className="form-control" value={lookupHospital} onChange={e => setLookupHospital(e.target.value)}>
                <option value="HOSP_001">HOSP_001 — City General</option>
                <option value="HOSP_002">HOSP_002 — St. Mary's</option>
                <option value="HOSP_003">HOSP_003 — Northwest Clinic</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Local Patient ID</label>
              <input
                className="form-control"
                placeholder="e.g. LOC-001"
                value={lookupLocal}
                onChange={e => setLookupLocal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
              />
            </div>
            <button className="btn btn--primary" style={{ width: '100%' }} onClick={handleLookup} disabled={looking}>
              {looking ? <><span className="spinner spinner--sm" /> Resolving...</> : '🔍 Resolve Global ID'}
            </button>

            {lookupResult && (
              <div className={`alert alert--${lookupResult.found ? 'success' : 'error'}`} style={{ marginTop: 'var(--sp-4)' }}>
                {lookupResult.found ? (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>✅ Patient Found</div>
                    <div><strong>Global ID:</strong> <code>{lookupResult.data?.global_id || lookupResult.data?.id}</code></div>
                    <div><strong>Name:</strong> {lookupResult.data?.name || '—'}</div>
                    <div><strong>Hospital:</strong> {HOSP_NAMES[lookupResult.data?.hospital_id] || lookupResult.data?.hospital_id}</div>
                  </>
                ) : (
                  '❌ No mapping found for this local ID and hospital combination'
                )}
              </div>
            )}

            <div className="alert alert--info" style={{ marginTop: 'var(--sp-3)' }}>
              💡 Try: <code>LOC-001</code> at <code>HOSP_001</code>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="card">
          <div className="card__header">
            <div className="card__title"><div className="card__icon">📊</div> MPI Statistics</div>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {[
                { label: 'Total Registered Patients', value: records.length, color: 'var(--blue-600)' },
                { label: 'Unique Hospitals',           value: new Set(records.map(r => r.hospital_id)).size, color: '#7c3aed' },
                { label: 'Latest Registration',        value: records[records.length-1]?.created_at || '—', color: '#0d9488' },
              ].map(s => (
                <div key={s.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--sp-3)', background: 'var(--gray-50)',
                  border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)',
                }}>
                  <span style={{ color: 'var(--gray-600)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontWeight: 800, fontSize: 'var(--text-xl)', color: s.color }}>{s.value}</span>
                </div>
              ))}
              <div className="alert alert--info" style={{ marginBottom: 0 }}>
                🔐 Every patient has exactly one global UUID regardless of how many hospitals they visit.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MPI Table */}
      <div className="card animate-fade-up">
        <div className="card__header">
          <div className="card__title"><div className="card__icon">📋</div> All Mappings ({records.length})</div>
          <div className="search-bar" style={{ maxWidth: 280 }}>
            <span className="search-bar__icon">🔍</span>
            <input className="form-control" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? (
          <div className="page-loading"><span className="spinner" /> Loading MPI...</div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Global UUID</th>
                  <th>Patient Name</th>
                  <th>Local ID</th>
                  <th>Hospital</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.global_id}>
                    <td><code>{r.global_id}</code></td>
                    <td style={{ fontWeight: 600 }}>{r.name || '—'}</td>
                    <td><code>{r.local_id}</code></td>
                    <td><span className="badge badge--blue">{HOSP_NAMES[r.hospital_id] || r.hospital_id}</span></td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)' }}>{r.created_at || '—'}</td>
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
