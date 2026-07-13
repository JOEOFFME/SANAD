from fastapi import FastAPI
from app.database import Base, engine
from app import models
from app.routers import assets, incidents, sensors

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SANADIndus Backend")

app.include_router(assets.router)
app.include_router(incidents.router)
app.include_router(sensors.router)

@app.get("/")
def health():
    return {"status": "ok"}
