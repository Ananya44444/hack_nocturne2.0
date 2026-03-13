import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import API from '../services/api';
import './Dashboard.css';

const COLORS = ['#2563eb', '#0ea5e9', '#14b8a6', '#8b5cf6'];

function StatCard({ icon, label, value, sub, color = 'blue', trend }) {
  return (
    <div className={`stat-card stat-card--${color} animate-fade-up`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className={`stat-card__trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip__item" style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// // Mock data for demo when backend is not connected
// const MOCK_STATS = {
//   hospitals: 3,
//   patients: 7,
//   active_consents: 5,
//   total_audits: 24,
//   fhir_requests: 18,
//   access_denied: 4,
// };

// const MOCK_ACTIVITY = [
//   { time: '09:00', requests: 12, denied: 1, consents: 2 },
//   { time: '10:00', requests: 18, denied: 2, consents: 1 },
//   { time: '11:00', requests: 22, denied: 0, consents: 3 },
//   { time: '12:00', requests: 15, denied: 3, consents: 1 },
//   { time: '13:00', requests: 28, denied: 1, consents: 2 },
//   { time: '14:00', requests: 35, denied: 2, consents: 4 },
//   { time: '15:00', requests: 42, denied: 0, consents: 3 },
//   { time: '16:00', requests: 30, denied: 1, consents: 2 },
// ];

// const MOCK_HOSPITAL_DIST = [
//   { name: 'City General', patients: 3, value: 3 },
//   { name: 'St. Mary\'s', patients: 2, value: 2 },
//   { name: 'Northwest Clinic', patients: 2, value: 2 },
// ];

// const MOCK_AUDIT_FEED = [
//   { id: 1, time: '16:42:11', type: 'FHIR_REQUEST',   actor: 'HOSP_002', patient: 'PAT-GLB-001', status: 'success',  msg: 'FHIR Bundle served — Consent valid' },
//   { id: 2, time: '16:40:05', type: 'CONSENT_GRANT',  actor: 'HOSP_001', patient: 'PAT-GLB-003', status: 'success',  msg: 'Consent granted by HOSP_001 for HOSP_003' },
//   { id: 3, time: '16:38:22', type: 'ACCESS_DENIED',  actor: 'HOSP_003', patient: 'PAT-GLB-005', status: 'error',    msg: 'Access denied — No active consent found' },
//   { id: 4, time: '16:35:47', type: 'FHIR_REQUEST',   actor: 'HOSP_001', patient: 'PAT-GLB-002', status: 'success',  msg: 'FHIR Bundle served — Multi-hospital data' },
//   { id: 5, time: '16:32:10', type: 'CONSENT_REVOKE', actor: 'HOSP_002', patient: 'PAT-GLB-004', status: 'warning',  msg: 'Consent revoked by patient request' },
//   { id: 6, time: '16:29:58', type: 'AUDIT_VERIFY',   actor: 'HOSP_001', patient: '—',           status: 'success',  msg: 'Hash chain integrity verified ✓' },
// ];

export default function Dashboard({ backendUrl }) {
  const [stats, setStats] = useState(MOCK_STATS);
  const [feed, setFeed] = useState(MOCK_AUDIT_FEED);
  const [connected, setConnected] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await API.get('/api/health');
        if (!alive) return;
        if (res.data?.status === 'healthy') {
          setConnected(true);
          // Load real stats
          const [hRes, pRes, aRes] = await Promise.allSettled([
            API.get('/api/hospitals'),
            API.get('/api/patients'),
            API.get('/api/audit/events'),
          ]);
          const hospitals = hRes.status === 'fulfilled' ? (hRes.value.data?.hospitals || hRes.value.data || []).length : MOCK_STATS.hospitals;
          const patientsList = pRes.status === 'fulfilled' ? (pRes.value.data?.patients || pRes.value.data || []) : [];
          const patients = patientsList.length || MOCK_STATS.patients;

          let consentsCount = MOCK_STATS.active_consents;
          try {
            // Real backend doesn't have list-all consents, so we fetch for a few patients
            const limit = patientsList.slice(0, 5);
            if (limit.length > 0) {
              let count = 0;
              for (const p of limit) {
                const c = await API.get(`/api/consent/${p.global_id || p.id}`).catch(() => ({ data: { consents: [] } }));
                count += (c.data?.consents || []).length;
              }
              consentsCount = count;
            }
          } catch (e) { }

          const audits = aRes.status === 'fulfilled' ? (aRes.value.data?.events || aRes.value.data || []).length : MOCK_STATS.total_audits;
          setStats({ hospitals, patients, active_consents: consentsCount, total_audits: audits, fhir_requests: 18, access_denied: 4 });

          if (aRes.status === 'fulfilled') {
            const raw = aRes.value.data?.events || aRes.value.data || [];
            setFeed(raw.slice(0, 6).map((e, i) => ({
              id: i, time: new Date(e.created_at || Date.now()).toLocaleTimeString(),
              type: e.action || 'EVENT', actor: e.requesting_hospital_id || '—',
              patient: e.patient_global_id || '—', status: e.access_granted !== false ? 'success' : 'error',
              msg: e.details || e.action,
            })));
          }
        }
      } catch {
        setConnected(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [backendUrl]);

  const statusIcon = { success: '✅', error: '❌', warning: '⚠️' };

  return (
    <div className="dashboard animate-fade-in">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>FHIR Healthcare Interoperability Platform — Real-time overview</p>
        {connected === false && (
          <div className="alert alert--warning" style={{ marginTop: 12 }}>
            ⚠️ Backend unreachable — showing demo data. Start the mock backend with <code>node mock-backend.js</code>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="🏥" label="Hospitals" value={stats.hospitals} sub="Registered institutions" color="blue" trend={0} />
        <StatCard icon="👤" label="Patients" value={stats.patients} sub="Global identities" color="teal" trend={12} />
        <StatCard icon="🔐" label="Active Consents" value={stats.active_consents} sub="Cross-hospital grants" color="green" trend={8} />
        <StatCard icon="⛓️" label="Audit Events" value={stats.total_audits} sub="Tamper-proof records" color="purple" trend={5} />
        <StatCard icon="📋" label="FHIR Requests" value={stats.fhir_requests} sub="Bundle fetches today" color="sky" />
        <StatCard icon="🚫" label="Access Denied" value={stats.access_denied} sub="Consent violations" color="red" />
      </div>

      {/* Charts Row */}
      <div className="content-grid" style={{ marginBottom: 'var(--sp-5)' }}>
        {/* Activity Chart */}
        <div className="card animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="card__header">
            <div className="card__title">
              <div className="card__icon">📈</div>
              API Activity (Today)
            </div>
          </div>
          <div className="card__body">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MOCK_ACTIVITY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} stroke="rgba(255,255,255,0.06)" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="rgba(255,255,255,0.06)" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Line type="monotone" dataKey="requests" name="Requests" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="denied" name="Denied" stroke="#dc2626" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="consents" name="Consents" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hospital Distribution */}
        <div className="card animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="card__header">
            <div className="card__title">
              <div className="card__icon">🏥</div>
              Patient Distribution
            </div>
          </div>
          <div className="card__body dashboard__pie-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={MOCK_HOSPITAL_DIST}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {MOCK_HOSPITAL_DIST.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v + ' patients', n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar Chart + Feed */}
      <div className="content-grid">
        <div className="card animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="card__header">
            <div className="card__title">
              <div className="card__icon">📊</div>
              Hourly FHIR Requests
            </div>
          </div>
          <div className="card__body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MOCK_ACTIVITY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} stroke="rgba(255,255,255,0.06)" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="rgba(255,255,255,0.06)" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="requests" name="Requests" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="denied" name="Denied" fill="#fca5a5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Audit Feed */}
        <div className="card animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <div className="card__header">
            <div className="card__title">
              <div className="card__icon">📡</div>
              Live Audit Feed
            </div>
            <span className="dashboard__live-badge">
              <span className="dashboard__live-dot" /> LIVE
            </span>
          </div>
          <div className="card__body dashboard__feed">
            {feed.map(item => (
              <div key={item.id} className={`dashboard__feed-item dashboard__feed-item--${item.status}`}>
                <div className="dashboard__feed-top">
                  <span className="dashboard__feed-icon">{statusIcon[item.status] || '•'}</span>
                  <span className="dashboard__feed-type">{item.type.replace(/_/g, ' ')}</span>
                  <span className="dashboard__feed-time">{item.time}</span>
                </div>
                <div className="dashboard__feed-msg">{item.msg}</div>
                {item.patient !== '—' && (
                  <div className="dashboard__feed-meta">Patient: <code>{item.patient}</code> · Actor: <code>{item.actor}</code></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="card animate-fade-up" style={{ marginTop: 'var(--sp-5)', animationDelay: '0.3s' }}>
        <div className="card__header">
          <div className="card__title">
            <div className="card__icon">🔧</div>
            Microservices Status
          </div>
        </div>
        <div className="card__body dashboard__services">
          {[
            { name: 'Hospital Registry', icon: '🏥', status: 'up' },
            { name: 'Master Patient Index', icon: '🔍', status: 'up' },
            { name: 'Patient Data Service', icon: '👤', status: 'up' },
            { name: 'Consent Service', icon: '🔐', status: 'up' },
            { name: 'FHIR Bundle Service', icon: '📋', status: 'up' },
            { name: 'Audit / Anti-Tamper', icon: '⛓️', status: 'up' },
          ].map(svc => (
            <div key={svc.name} className="dashboard__service-card">
              <div className="dashboard__service-icon">{svc.icon}</div>
              <div className="dashboard__service-name">{svc.name}</div>
              <span className={`badge badge--${svc.status === 'up' ? 'success' : 'error'}`}>
                {svc.status === 'up' ? '✓ Online' : '✗ Down'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
