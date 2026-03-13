from fastapi import FastAPI
from .routes import router
from . import database
import os

app = FastAPI(
    title="MPI Service",
    description="Master Patient Index for cross-hospital identity resolution",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    database.init_db()

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    # Enforced port 9000
    uvicorn.run("app.main:app", host="0.0.0.0", port=9000, reload=True)
