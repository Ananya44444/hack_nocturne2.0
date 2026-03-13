from fastapi import FastAPI
from .routes import router
from . import database
from .config import SERVICE_PORT
import os

app = FastAPI(
    title="Consent Service",
    description="Consent management and validation for FHIR-based healthcare data access",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    database.init_db()

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=SERVICE_PORT, reload=True)
