// HealthBridge FHIR Platform — Mock Backend
// Run with: node mock-backend.js
// Provides demo data for the React frontend when the real FastAPI backend is offline

const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT    = 8001;

app.use(cors());
app.use(express.json());

// ── Data ─────────────────────────────────────────────────────────────────

const hospitals = [
  { id: 'HOSP_001', name: 'City General Hospital',     location: 'New York, NY',    api_key: 'key_001', patient_count: 3, status: 'active', specialties: ['Cardiology','Oncology','Neurology'],     joined: '2025-01-15' },
  { id: 'HOSP_002', name: "St. Mary's Medical Center", location: 'Los Angeles, CA', api_key: 'key_002', patient_count: 2, status: 'active', specialties: ['Pediatrics','Emergency'],                 joined: '2025-02-10' },
  { id: 'HOSP_003', name: 'Northwest Regional Clinic', location: 'Seattle, WA',     api_key: 'key_003', patient_count: 2, status: 'active', specialties: ['General Medicine','Orthopedics'],        joined: '2025-03-05' },
];

const patients = [
  { id: 'PAT-GLB-001', local_id: 'LOC-001', hospital_id: 'HOSP_001', name: 'Alice Johnson',   dob: '1985-03-12', gender: 'female', blood_type: 'A+',  diagnoses: ['Hypertension','Diabetes T2'] },
  { id: 'PAT-GLB-002', local_id: 'LOC-002', hospital_id: 'HOSP_001', name: 'Bob Martinez',    dob: '1972-07-08', gender: 'male',   blood_type: 'O-',  diagnoses: ['Coronary Artery Disease'] },
  { id: 'PAT-GLB-003', local_id: 'LOC-003', hospital_id: 'HOSP_001', name: 'Carol Williams',  dob: '1990-11-25', gender: 'female', blood_type: 'B+',  diagnoses: ['Asthma'] },
  { id: 'PAT-GLB-004', local_id: 'LOC-004', hospital_id: 'HOSP_002', name: 'David Chen',      dob: '1965-01-30', gender: 'male',   blood_type: 'AB+', diagnoses: ['Chronic Kidney Disease'] },
  { id: 'PAT-GLB-005', local_id: 'LOC-005', hospital_id: 'HOSP_002', name: 'Eva Rodriguez',   dob: '1995-06-14', gender: 'female', blood_type: 'A-',  diagnoses: ['Anxiety Disorder'] },
  { id: 'PAT-GLB-006', local_id: 'LOC-006', hospital_id: 'HOSP_003', name: 'Frank Thompson',  dob: '1958-09-03', gender: 'male',   blood_type: 'O+',  diagnoses: ['COPD','Heart Failure'] },
  { id: 'PAT-GLB-007', local_id: 'LOC-007', hospital_id: 'HOSP_003', name: 'Grace Lee',       dob: '2001-04-22', gender: 'female', blood_type: 'B-',  diagnoses: ['Juvenile Diabetes'] },
];

const mpiMappings = patients.map(p => ({
  global_id:   p.id,
  local_id:    p.local_id,
  hospital_id: p.hospital_id,
  name:        p.name,
  created_at:  '2025-01-20',
}));

let consents = [
  { id: 'CON-001', patient_global_id: 'PAT-GLB-001', patient_name: 'Alice Johnson',  granting_hospital: 'HOSP_001', requesting_hospital: 'HOSP_002', status: 'active',  granted_at: '2025-02-01', expires_at: '2026-02-01', purpose: 'Specialist Referral' },
  { id: 'CON-002', patient_global_id: 'PAT-GLB-002', patient_name: 'Bob Martinez',   granting_hospital: 'HOSP_001', requesting_hospital: 'HOSP_003', status: 'active',  granted_at: '2025-02-10', expires_at: '2025-08-10', purpose: 'Emergency Care' },
  { id: 'CON-003', patient_global_id: 'PAT-GLB-003', patient_name: 'Carol Williams', granting_hospital: 'HOSP_001', requesting_hospital: 'HOSP_002', status: 'active',  granted_at: '2025-03-01', expires_at: '2026-03-01', purpose: 'Chronic Care Management' },
  { id: 'CON-004', patient_global_id: 'PAT-GLB-004', patient_name: 'David Chen',     granting_hospital: 'HOSP_002', requesting_hospital: 'HOSP_001', status: 'revoked', granted_at: '2025-01-15', expires_at: '2026-01-15', purpose: 'Lab Results Sharing', revoked_at: '2025-04-01' },
  { id: 'CON-005', patient_global_id: 'PAT-GLB-005', patient_name: 'Eva Rodriguez',  granting_hospital: 'HOSP_002', requesting_hospital: 'HOSP_003', status: 'active',  granted_at: '2025-03-15', expires_at: '2026-03-15', purpose: 'Cardiology Consult' },
  { id: 'CON-006', patient_global_id: 'PAT-GLB-006', patient_name: 'Frank Thompson', granting_hospital: 'HOSP_003', requesting_hospital: 'HOSP_001', status: 'expired', granted_at: '2024-06-01', expires_at: '2025-01-01', purpose: 'Surgical Planning' },
];

let auditEvents = [
  { id: 1, action: 'FHIR_BUNDLE_SERVED',  requesting_hospital_id: 'HOSP_002', patient_global_id: 'PAT-GLB-001', access_granted: true,  details: 'Bundle served — active consent verified',         created_at: '2026-03-13T10:42:11Z', hash: 'a3f2c8d1e9b4f7a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4' },
  { id: 2, action: 'CONSENT_GRANTED',      requesting_hospital_id: 'HOSP_001', patient_global_id: 'PAT-GLB-003', access_granted: true,  details: 'Consent granted by HOSP_001 for HOSP_003',        created_at: '2026-03-13T10:40:05Z', hash: 'b7e1a2c9f3d8e2b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8' },
  { id: 3, action: 'ACCESS_DENIED',        requesting_hospital_id: 'HOSP_003', patient_global_id: 'PAT-GLB-005', access_granted: false, details: 'No active consent found',                         created_at: '2026-03-13T10:38:22Z', hash: 'c9f4d3b2e1a7c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7' },
  { id: 4, action: 'FHIR_BUNDLE_SERVED',  requesting_hospital_id: 'HOSP_001', patient_global_id: 'PAT-GLB-002', access_granted: true,  details: 'Multi-hospital FHIR bundle compiled',             created_at: '2026-03-13T10:35:47Z', hash: 'd2a8e7c1f4b9a8f6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9' },
  { id: 5, action: 'CONSENT_REVOKED',      requesting_hospital_id: 'HOSP_002', patient_global_id: 'PAT-GLB-004', access_granted: null,  details: 'Consent revoked by patient request',              created_at: '2026-03-13T10:32:10Z', hash: 'e8b3a1f6c4d2b7e9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2' },
  { id: 6, action: 'PATIENT_REGISTERED',   requesting_hospital_id: 'HOSP_003', patient_global_id: 'PAT-GLB-007', access_granted: null,  details: 'Patient enrolled via MPI',                        created_at: '2026-03-13T10:29:58Z', hash: 'f1c7b4e2a9d3f4c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5' },
  { id: 7, action: 'ACCESS_DENIED',        requesting_hospital_id: 'HOSP_002', patient_global_id: 'PAT-GLB-006', access_granted: false, details: 'Consent expired — renewal required',              created_at: '2026-03-13T10:24:33Z', hash: 'a9d6c3f8b1e4d1a9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2' },
  { id: 8, action: 'FHIR_BUNDLE_SERVED',  requesting_hospital_id: 'HOSP_003', patient_global_id: 'PAT-GLB-001', access_granted: true,  details: 'Cardiology referral bundle delivered',            created_at: '2026-03-13T10:19:01Z', hash: 'b4e9a2d7f1c6e8b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6' },
];

// ── Helper ────────────────────────────────────────────────────────────────

function buildFHIRBundle(patient, requestingHospId) {
  const obs = [
    { code: 'Blood Pressure', value: 130, unit: 'mmHg', date: '2026-03-10T09:00:00Z' },
    { code: 'Heart Rate',     value: 72,  unit: 'bpm',  date: '2026-03-11T08:30:00Z' },
    { code: 'Blood Glucose',  value: 98,  unit: 'mg/dL',date: '2026-03-12T07:00:00Z' },
  ];

  return {
    resourceType: 'Bundle',
    id: `fhir-bundle-${patient.id}`,
    type: 'document',
    timestamp: new Date().toISOString(),
    meta: { requesting_hospital: requestingHospId },
    entry: [
      {
        resource: {
          resourceType: 'Patient',
          id: patient.id,
          name: [{ use: 'official', family: patient.name.split(' ')[1], given: [patient.name.split(' ')[0]] }],
          gender: patient.gender,
          birthDate: patient.dob,
          identifier: [{ system: 'urn:oid:hospital', value: patient.local_id }],
        }
      },
      ...obs.map((o, i) => ({
        resource: {
          resourceType: 'Observation',
          id: `OBS-${patient.id}-${i+1}`,
          status: 'final',
          code: { text: o.code },
          subject: { reference: `Patient/${patient.id}` },
          effectiveDateTime: o.date,
          valueQuantity: { value: o.value, unit: o.unit, system: 'http://unitsofmeasure.org' },
        }
      })),
      {
        resource: {
          resourceType: 'Condition',
          id: `COND-${patient.id}`,
          clinicalStatus: { coding: [{ code: 'active' }] },
          subject: { reference: `Patient/${patient.id}` },
          code: { text: (patient.diagnoses || []).join(', ') },
        }
      },
    ]
  };
}

function logAudit(action, hospId, patientId, granted, details) {
  const id = auditEvents.length + 1;
  const hash = Buffer.from(`${id}${action}${hospId}${patientId}${Date.now()}`).toString('hex').padEnd(64,'0').slice(0,64);
  auditEvents.unshift({ id, action, requesting_hospital_id: hospId, patient_global_id: patientId, access_granted: granted, details, created_at: new Date().toISOString(), hash });
}

function checkAuth(req) {
  const hospId = req.headers['x-hospital-id'];
  const apiKey = req.headers['x-api-key'];
  if (!hospId || !apiKey) return null;
  const hosp = hospitals.find(h => h.id === hospId && h.api_key === apiKey);
  return hosp || null;
}

// ── Routes ────────────────────────────────────────────────────────────────

// Health
app.get('/',           (_, res) => res.json({ status: 'healthy', service: 'HealthBridge Mock Backend', version: '1.0.0' }));
app.get('/api/health', (_, res) => res.json({ status: 'healthy', services: { hospital_registry:'up', patient_data:'up', mpi:'up', consent:'up', fhir:'up', audit:'up' } }));

// Hospitals
app.get('/api/hospitals', (_, res) => res.json({ hospitals, total: hospitals.length }));

// Patients
app.get('/api/patients', (req, res) => {
  const { hospital_id } = req.query;
  const data = hospital_id ? patients.filter(p => p.hospital_id === hospital_id) : patients;
  res.json({ patients: data, total: data.length });
});

// MPI
app.get('/api/mpi', (_, res) => res.json({ mappings: mpiMappings, total: mpiMappings.length }));
app.get('/api/mpi/resolve', (req, res) => {
  const { local_id, hospital_id } = req.query;
  const mapping = mpiMappings.find(m => m.local_id === local_id && m.hospital_id === hospital_id);
  if (!mapping) return res.status(404).json({ error: 'No mapping found' });
  res.json(mapping);
});

// Consents
app.get('/api/consents', (_, res) => res.json({ consents, total: consents.length }));

app.post('/api/consents', (req, res) => {
  const { patient_global_id, granting_hospital, requesting_hospital, expires_at, purpose } = req.body;
  if (!patient_global_id || !granting_hospital || !requesting_hospital) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const patient = patients.find(p => p.id === patient_global_id);
  const id = `CON-${String(consents.length + 1).padStart(3,'0')}`;
  const newConsent = {
    id, patient_global_id, patient_name: patient?.name || '—',
    granting_hospital, requesting_hospital, expires_at, purpose,
    status: 'active', granted_at: new Date().toISOString().slice(0,10),
  };
  consents.push(newConsent);
  logAudit('CONSENT_GRANTED', granting_hospital, patient_global_id, true, `Consent granted for ${requesting_hospital}`);
  res.status(201).json(newConsent);
});

app.post('/api/consents/:id/revoke', (req, res) => {
  const consent = consents.find(c => c.id === req.params.id);
  if (!consent) return res.status(404).json({ error: 'Consent not found' });
  consent.status = 'revoked';
  consent.revoked_at = new Date().toISOString().slice(0,10);
  logAudit('CONSENT_REVOKED', consent.granting_hospital, consent.patient_global_id, null, 'Consent revoked');
  res.json(consent);
});

// FHIR Bundle — consent-gated
app.get('/api/bundle/:globalId', (req, res) => {
  const { globalId } = req.params;
  const requestingHospId = req.headers['x-hospital-id'] || 'HOSP_001';

  const patient = patients.find(p => p.id === globalId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Check consent
  const today = new Date();
  const hasConsent = consents.some(c =>
    c.patient_global_id === globalId &&
    c.requesting_hospital === requestingHospId &&
    c.status === 'active' &&
    new Date(c.expires_at) > today
  );

  if (!hasConsent && requestingHospId !== patient.hospital_id) {
    logAudit('ACCESS_DENIED', requestingHospId, globalId, false, 'No active consent found');
    return res.status(403).json({ error: 'Access denied — no active consent for this patient/hospital pair' });
  }

  logAudit('FHIR_BUNDLE_SERVED', requestingHospId, globalId, true, 'FHIR Bundle compiled and served');
  res.json(buildFHIRBundle(patient, requestingHospId));
});

// Audit
app.get('/api/audit', (_, res) => res.json({ events: auditEvents, total: auditEvents.length }));

app.get('/api/audit/verify/:id', (req, res) => {
  const event = auditEvents.find(e => String(e.id) === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  // In production this would recompute SHA-256 and compare
  res.json({ valid: true, message: `SHA-256 hash chain intact ✓ — Event ${event.id} unmodified`, hash: event.hash });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏥 HealthBridge Mock Backend running at http://localhost:${PORT}`);
  console.log(`   → Hospitals: ${hospitals.length} | Patients: ${patients.length} | Consents: ${consents.length}`);
  console.log(`\n   Endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/hospitals`);
  console.log(`   GET  /api/patients`);
  console.log(`   GET  /api/mpi`);
  console.log(`   GET  /api/mpi/resolve?local_id=LOC-001&hospital_id=HOSP_001`);
  console.log(`   GET  /api/consents`);
  console.log(`   POST /api/consents`);
  console.log(`   POST /api/consents/:id/revoke`);
  console.log(`   GET  /api/bundle/:globalId   (requires X-Hospital-ID header)`);
  console.log(`   GET  /api/audit`);
  console.log(`   GET  /api/audit/verify/:id\n`);
});
