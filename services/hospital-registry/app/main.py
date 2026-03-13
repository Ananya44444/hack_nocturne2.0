from fastapi import FastAPI
from app.routes import router
from app.database import init_db
import uvicorn

app = FastAPI(title="Hospital Registry Service")

@app.on_event("startup")
def startup_event():
    init_db()

app.include_router(router, prefix="/registry")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9001)
