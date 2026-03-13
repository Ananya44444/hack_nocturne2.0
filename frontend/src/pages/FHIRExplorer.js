import React, { useState } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import './FHIRExplorer.css';

const EXAMPLE_BUNDLE = {
  resourceType: 'Bundle',
  id: 'fhir-bundle-PAT-GLB-001',
  type: 'document',
  timestamp: '2026-03-13T10:42:00Z',
  entry: [
    {
      resource: {
        resourceType: 'Patient',
        id: 'PAT-GLB-001',
        name: [{ use: 'official', family: 'Johnson', given: ['Alice'] }],
        gender: 'female',
        birthDate: '1985-03-12',
        identifier: [{ system: 'urn:oid:hospital', value: 'LOC-001' }],
      }
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'OBS-001',
        status: 'final',
        code: { text: 'Blood Pressure' },
        valueQuantity: { value: 130, unit: 'mmHg', system: 'http://unitsofmeasure.org' },
        subject: { reference: 'Patient/PAT-GLB-001' },
        effectiveDateTime: '2026-03-10T09:00:00Z',
      }
    },
    {
      resource: {
        resourceType: 'Encounter',
        id: 'ENC-001',
        status: 'finished',
        class: { code: 'AMB', display: 'Ambulatory' },
        type: [{ text: 'Cardiology Consultation' }],
        subject: { reference: 'Patient/PAT-GLB-001' },
        period: { start: '2026-03-10T09:00:00Z', end: '2026-03-10T10:00:00Z' },
      }
    }
  ]
};

function JsonNode({ data, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(depth > 2);

  if (data === null) return <span className="fhir__null">null</span>;
  if (typeof data === 'boolean') return <span className="fhir__bool">{String(data)}</span>;
  if (typeof data === 'number') return <span className="fhir__number">{data}</span>;
  if (typeof data === 'string') return <span className="fhir__string">"{data}"</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="fhir__bracket">[]</span>;
    return (
      <span>
        <button className="fhir__toggle" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '▶' : '▼'} [{data.length}]
        </button>
        {!collapsed && (
          <div className="fhir__nested" style={{ marginLeft: 20 * (depth + 1) + 'px' }}>
            {data.map((item, i) => (
              <div key={i} className="fhir__row">
                <span className="fhir__index">[{i}]</span>
                <span className="fhir__colon">: </span>
                <JsonNode data={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span className="fhir__bracket">{'{}'}</span>;
    const isResource = data.resourceType;
    return (
      <span>
        <button className="fhir__toggle" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '▶' : '▼'} {isResource ? <span className="fhir__resource-type">{data.resourceType}</span> : `{${keys.length}}`}
        </button>
        {!collapsed && (
          <div className="fhir__nested">
            {keys.map(k => (
              <div key={k} className="fhir__row">
                <span className={`fhir__key ${k === 'resourceType' ? 'fhir__key--type' : ''}`}>"{k}"</span>
                <span className="fhir__colon">: </span>
                <JsonNode data={data[k]} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }

  return <span>{String(data)}</span>;
}

export default function FHIRExplorer({ backendUrl }) {
  const [globalId, setGlobalId]     = useState('PAT-GLB-001');
  const [hospitalId, setHospitalId] = useState('HOSP_002');
  const [bundle, setBundle]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [rawMode, setRawMode]       = useState(false);
  const [error, setError]           = useState('');

  const fetchBundle = async () => {
    if (!globalId.trim()) { toast.error('Enter a patient Global ID'); return; }
    setLoading(true);
    setError('');
    setBundle(null);
    try {
      const res = await API.get(`/api/bundle/${globalId}`, {
        headers: { 'X-Hospital-ID': hospitalId, 'X-API-Key': `key_${hospitalId.slice(-3)}` }
      });
      setBundle(res.data);
      toast.success('FHIR Bundle loaded!');
    } catch (e) {
      if (e.response?.status === 403) {
        setError('🚫 Access Denied — No active consent found for this hospital/patient combination. Grant consent in the Consent Manager first.');
      } else {
        // Demo fallback
        setBundle({ ...EXAMPLE_BUNDLE, id: `fhir-bundle-${globalId}` });
        toast.success('FHIR Bundle loaded (demo)!');
      }
    }
    setLoading(false);
  };

  const loadExample = () => {
    setBundle(EXAMPLE_BUNDLE);
    setGlobalId('PAT-GLB-001');
    toast.success('Example bundle loaded!');
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="fhir-explorer animate-fade-in">
      <div className="page-header">
        <h1>📋 FHIR Bundle Explorer</h1>
        <p>Fetch and inspect FHIR R4 patient bundles — consent-gated cross-hospital data</p>
      </div>

      <div className="content-grid" style={{ marginBottom: 'var(--sp-5)' }}>
        {/* Fetch Tool */}
        <div className="card">
          <div className="card__header">
            <div className="card__title"><div className="card__icon">🔗</div>Fetch FHIR Bundle</div>
          </div>
          <div className="card__body">
            <div className="form-group">
              <label className="form-label">Requesting Hospital (actor)</label>
              <select className="form-control" value={hospitalId} onChange={e => setHospitalId(e.target.value)}>
                <option value="HOSP_001">HOSP_001 — City General</option>
                <option value="HOSP_002">HOSP_002 — St. Mary's</option>
                <option value="HOSP_003">HOSP_003 — Northwest Clinic</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Patient Global ID</label>
              <input
                className="form-control"
                placeholder="PAT-GLB-001"
                value={globalId}
                onChange={e => setGlobalId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchBundle()}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={fetchBundle} disabled={loading}>
                {loading ? <><span className="spinner spinner--sm" /> Fetching...</> : '📋 Fetch Bundle'}
              </button>
              <button className="btn btn--secondary" onClick={loadExample}>Load Example</button>
            </div>

            {error && <div className="alert alert--error" style={{ marginTop: 'var(--sp-4)' }}>{error}</div>}

            <div className="alert alert--info" style={{ marginTop: 'var(--sp-3)' }}>
              💡 Try <code>HOSP_002</code> fetching <code>PAT-GLB-001</code> (consent active)
            </div>
          </div>
        </div>

        {/* FHIR Standard Info */}
        <div className="card">
          <div className="card__header">
            <div className="card__title"><div className="card__icon">ℹ️</div>FHIR R4 Standard</div>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {[
                { icon: '📦', label: 'Bundle', desc: 'Container for a set of resources (document, transaction, etc.)' },
                { icon: '👤', label: 'Patient',  desc: 'Demographics and administrative info about a subject of care' },
                { icon: '🔬', label: 'Observation', desc: 'Measurements & simple assertions (vitals, lab results)' },
                { icon: '🏥', label: 'Encounter', desc: 'An interaction between patient and healthcare provider' },
                { icon: '🔐', label: 'Consent Gate', desc: 'Access controlled — must have active consent to receive bundle' },
              ].map(r => (
                <div key={r.label} style={{
                  display: 'flex', gap: 'var(--sp-3)',
                  background: 'var(--gray-50)',
                  border: '1px solid var(--gray-100)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--sp-3)',
                }}>
                  <span style={{ fontSize: 22 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--gray-800)' }}>{r.label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bundle Viewer */}
      {bundle && (
        <div className="card fhir-viewer animate-fade-up">
          <div className="card__header">
            <div className="card__title">
              <div className="card__icon">📄</div>
              Bundle: <code style={{ marginLeft: 6, fontSize: 'var(--text-sm)', background: 'var(--blue-100)', padding: '2px 8px', borderRadius: 4 }}>{bundle.id}</code>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
              <span className="badge badge--success">✓ {bundle.type || 'document'}</span>
              <span className="badge badge--blue">{bundle.entry?.length || 0} entries</span>
              <button className="btn btn--ghost btn--sm" onClick={() => setRawMode(r => !r)}>
                {rawMode ? '🌳 Tree View' : '{ } Raw JSON'}
              </button>
              <button className="btn btn--secondary btn--sm" onClick={copyJson}>📋 Copy</button>
            </div>
          </div>
          <div className="card__body fhir-viewer__body">
            {rawMode ? (
              <pre className="fhir-viewer__raw">{JSON.stringify(bundle, null, 2)}</pre>
            ) : (
              <div className="fhir-viewer__tree">
                <JsonNode data={bundle} depth={0} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
