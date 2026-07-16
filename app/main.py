from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app import models
from app.routers import assets, incidents, sensors, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SANADIndus Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets.router)
app.include_router(incidents.router)
app.include_router(sensors.router)
app.include_router(dashboard.router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def serve_dashboard():
    return FileResponse("dashboard/index.html")
