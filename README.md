# Vitals

Vitals is a secure, cross-institution healthcare interoperability platform based on FHIR (Fast Healthcare Interoperability Resources). It enables multiple hospitals to safely exchange patient data, resolve identities, manage data access consent, and maintain immutable audit trails using blockchain technology.
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Enabled-green.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-lightgrey.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-informational.svg)](https://react.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-yellow.svg)](https://developer.mozilla.org/docs/Web/JavaScript)
## Table of Contents
- [Architecture & Microservices](#architecture--microservices)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Running the Platform Locally](#running-the-platform-locally)
- [Features](#features)
- [Tech Stack](#tech-stack)

## Architecture & Microservices

The platform is designed around a microservices architecture, running behind a React frontend and API backend. The core services include:

1. **Backend API (`/backend`)** - Core data layer, FastApi server running on port `8000`.
2. **Frontend (`/frontend`)** - React-based unified dashboard running on port `3000`.
3. **Hospital Registry (`/services/hospital-registry`)** - Manages onboarded institutions and auth credentials (port `9001`).
4. **MPI Service (`/services/mpi-service`)** - Master Patient Index. Resolves local hospital patient IDs (`HOSP_A_123`) to a single Global Patient UUID (`uuid-456`) (port `9000`).
5. **FHIR Service (`/services/fhir-service`)** - Standardized data ingestion and retrieval layer translating local hospital data into FHIR standard bundles (port `8001`).
6. **Consent Service (`/services/consent-service`)** - Manages patient-to-institution data access grants and permissions (port `8002`).
7. **Blockchain Audit Service (`/services/blockchain-audit-service`)** - Interacts with a local Hardhat Ethereum network to create tamper-proof cryptographic audit logs of all data access and consent changes (port `8005`).

## Project Structure

```text
hack_nocturne2.0/
├── backend/                  # Core FastAPI application & SQLite database
├── frontend/                 # React frontend application
├── services/                 # Microservices
│   ├── blockchain-audit-service/ # Blockchain audit logging
│   ├── consent-service/          # Consent management validation
│   ├── fhir-service/             # FHIR data transformation
│   ├── hospital-registry/        # Auth & Institution management
│   └── mpi-service/              # Master Patient Index resolution
└── docker-compose.yml        # Orchestrates all services
```

## Prerequisites

- **Docker & Docker Compose** (Recommended for easiest setup)
- **Node.js 18+** (If running frontend manually)
- **Python 3.9+** (If running backend/services manually)

## Running the Platform Locally

### Option 1: Using Docker Compose (Recommended)

To start the entire platform consisting of the core backend, frontend, and all microservices (except the newly created consent-service which you may need to add to the compose file):

```bash
docker-compose up --build
```

### Option 2: Running Services Manually

To run the services locally without Docker, you will need to start each one individually. Most Python services come with a wrapper script. 

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (or venv\Scripts\activate on Windows)
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

**Microservices (e.g., Consent Service)**
```bash
cd services/consent-service
./start.sh
```

## Features

- **Cross-Hospital Identity Resolution:** Resolves duplicate records across boundaries.
- **Granular Consent Management:** Patients own their data and grant/revoke access.
- **Standardized FHIR Format:** All records are queried and delivered in HL7 FHIR structures.
- **Immutable Audit Trails:** Every access, consent grant, and denial is hashed and logged to a blockchain backend to prevent tampering.
- **Unified Dashboard:** Clinical and Administrative views combined into one React frontend.

## Tech Stack

- **Frontend:** React, React Router, Recharts, Tailwind CSS (via components)
- **Backend & Services:** Python, FastAPI, Pydantic (v2), SQLite3
- **DevOps/Infra:** Docker, Docker Compose
- **Blockchain:** Ethereum/Hardhat, web3.py



