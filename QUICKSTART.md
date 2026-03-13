# HealthBridge FHIR Platform — Quickstart & Testing Guide

## Project Structure

```
hack_nocturne2.0/
├── backend/                  # Core FastAPI backend (port 8000)
├── frontend/                 # React frontend (port 3000)
│
└── services/                 # Independent Microservices (Native/Docker ready)
    ├── fhir-service/         # FHIR R4 proxy + formatter (port 8001)
    ├── hospital-registry/    # Hospital registration service (port 9001)
    ├── mpi-service/          # Master Patient Index service (port 9000)
    └── blockchain-audit-service/  # Audit trail tracking (port 8005)
```

---

## Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.10

---

## 🚀 Native Local Setup (Running all 6 services)

No Docker needed! You can run the entire distributed microservice architecture directly in your terminal. You will need **6 separate terminal windows/tabs**.

### 1. Core Backend (Port 8000)
This manages the core database (`healthcare.db`) and routers.
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -c "from app.seed import seed_all; seed_all()"   # Seed sample data
uvicorn app.main:app --reload --port 8000
```

### 2. Set up Microservices Environment
Open a new terminal. All 4 microservices share a Python virtual environment for ease of local development.
```bash
cd services
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install fastapi uvicorn pydantic pydantic-settings python-dotenv httpx web3 sqlalchemy "fhir.resources==7.1.0" requests
```

### 3. Hospital Registry Service (Port 9001)
Open a new terminal.
```bash
cd services/hospital-registry
source ../.venv/bin/activate   # Windows: ..\.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 9001
```

### 4. MPI Service (Port 9000)
Open a new terminal.
```bash
cd services/mpi-service
source ../.venv/bin/activate   # Windows: ..\.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 9000
```

### 5. Blockchain Audit Service (Port 8005)
Open a new terminal. First, create a `.env` file since it requires basic config to start.
```bash
cd services/blockchain-audit-service
echo "BLOCKCHAIN_RPC_URL=http://localhost:8545" > .env
echo "DATABASE_PATH=./audit_events.db" >> .env
source ../.venv/bin/activate   # Windows: ..\.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8005
```

### 6. FHIR Service (Port 8001)
Open a new terminal.
```bash
cd services/fhir-service
source ../.venv/bin/activate   # Windows: ..\.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 7. React Frontend (Port 3000)
Open a new terminal.
```bash
cd frontend
npm install
npm start
```

---

## 🔑 Authentication

All backend endpoints (except `/api/hospitals` and health checks) require two headers:

```
X-Hospital-ID: HOSP_001
X-API-Key: key_001
```

**Seeded Hospitals (Default Data):**
| Hospital ID | Name                      | API Key  |
|-------------|---------------------------|----------|
| HOSP_001    | Apollo Delhi              | key_001  |
| HOSP_002    | Max Mumbai                | key_002  |
| HOSP_003    | Fortis Bangalore          | key_003  |

---

## 🧪 Testing Walkthrough (Frontend UI)

Once all 6 terminals are running, open your browser to `http://localhost:3000`.

### 1. Dashboard Validation
- You should see the dashboard load with stats (e.g., Active Hospitals, Patients, Events).
- The *Live Audit Feed* should populate with events.

### 2. Hospital Registry
- Click **Hospitals** in the sidebar.
- You should see the 3 seeded health systems (Apollo, Max, Fortis).
- Click "Show" to reveal their API keys.

### 3. Patient Records
- Click **Patients** in the sidebar.
- You should see the seeded patients (Rahul Sharma, Priya Patel, etc.).
- Expand a row to see full demographics.

### 4. Master Patient Index (MPI) Resolution
- Click **Master Patient Index** in the sidebar.
- Under **ID Resolver**:
  - Enter Hospital ID: `HOSP_001`
  - Enter Local ID: `APL-001`
  - Click Search. It should successfully resolve to a Global UUID (e.g., `9c8bea7b-...`).

### 5. Consent Management
- Click **Consent Manager** in the sidebar.
- You'll see existing active and revoked consents.
- **Test:** Click "Grant New Consent", select a target hospital (e.g., `HOSP_002`) and click "Grant".

### 6. FHIR Extractor (Microservice Call)
- Click **FHIR Explorer** in the sidebar.
- This page talks to your core backend, which is proxied by the `fhir-service` running on `:8001`.
- Setup a Request:
  - Requesting Hospital: `HOSP_002` (Make sure they have consent!)
  - Patient ID: Enter the Global UUID of `Rahul Sharma`.
- Click **Fetch Bundle**. You should get a properly formatted FHIR R4 JSON Bundle.
- Switch Requesting Hospital to one that *doesn't* have consent (`HOSP_003`), click fetch, and verify you get an **Access Denied** error.

### 7. Blockchain Audit Trail
- Click **Audit Trail** in the sidebar.
- You should see a chronological list of actions (e.g., `DATA_ACCESS`, `CONSENT_GRANTED`, `ACCESS_DENIED`).
- Click the **Verify** button next to an event. The system will cryptographically hash the stored fields and ensure the integrity matches the generated hash, proving the logs haven't been tampered with.

---

## 📡 API Endpoints Reference (cURL)

**Core Backend Testing:**

```bash
# Check Hospitals (No Auth Required)
curl http://localhost:8000/api/hospitals

# Check Patients (Requires Auth)
curl http://localhost:8000/api/patients \
  -H "X-Hospital-ID: HOSP_001" \
  -H "X-API-Key: key_001"
```

**Testing Microservice Integration Directly:**

**FHIR Service (Port 8001) → Proxies to Backend (Port 8000)**
```bash
curl http://localhost:8001/fhir/bundle/<GLOBAL_UUID> \
  -H "X-Hospital-ID: HOSP_001" \
  -H "X-API-Key: key_001"
```

**Hospital Registry Microservice (Port 9001)**
```bash
curl http://localhost:9001/registry/
```

**MPI Microservice (Port 9000)**
```bash
curl http://localhost:9000/docs
```
