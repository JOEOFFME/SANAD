from fastapi import FastAPI
from app.database import Base, engine
from app import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SANADIndus Backend")

@app.get("/")
def health():
    return {"status": "ok"}

