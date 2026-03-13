from fastapi import FastAPI
from app.routes import router

app = FastAPI(
    title="FHIR Microservice",
    description="Converts hospital data to HL7 FHIR R4 Bundles",
    version="1.0.0",
)

# router already has prefix="/fhir" set inside routes.py
app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "fhir_service", "port": 8001}
