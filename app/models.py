from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from datetime import datetime
from app.database import Base

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    asset_type = Column(String)
    manual_ref = Column(String, nullable=True)

class TopologyEdge(Base):
    __tablename__ = "topology_edges"
    id = Column(Integer, primary_key=True)
    from_asset_id = Column(Integer, ForeignKey("assets.id"))
    to_asset_id = Column(Integer, ForeignKey("assets.id"))
    relation = Column(String, default="feeds_into")

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    sensor_type = Column(String)
    value = Column(Float)
    unit = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    symptom_text = Column(Text)
    diagnosis = Column(Text, nullable=True)
    fix_steps = Column(Text, nullable=True)
    risk_level = Column(String, default="medium")
    resolved = Column(Boolean, default=False)
    operator_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class NodeConfidence(Base):
    __tablename__ = "node_confidence"
    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    confidence_score = Column(Float, default=0.8)
    updated_at = Column(DateTime, default=datetime.utcnow)
