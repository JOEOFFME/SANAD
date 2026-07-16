from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    asset_type = Column(String)
    manual_ref = Column(String, nullable=True)

    readings = relationship("SensorReading", back_populates="asset", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="asset", cascade="all, delete-orphan")
    confidence = relationship("NodeConfidence", back_populates="asset", cascade="all, delete-orphan")
    edges_from = relationship("TopologyEdge", foreign_keys="TopologyEdge.from_asset_id", back_populates="from_asset", cascade="all, delete-orphan")
    edges_to = relationship("TopologyEdge", foreign_keys="TopologyEdge.to_asset_id", back_populates="to_asset", cascade="all, delete-orphan")

class TopologyEdge(Base):
    __tablename__ = "topology_edges"
    id = Column(Integer, primary_key=True)
    from_asset_id = Column(Integer, ForeignKey("assets.id"), index=True)
    to_asset_id = Column(Integer, ForeignKey("assets.id"), index=True)
    relation = Column(String, default="feeds_into")

    from_asset = relationship("Asset", foreign_keys=[from_asset_id], back_populates="edges_from")
    to_asset = relationship("Asset", foreign_keys=[to_asset_id], back_populates="edges_to")

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), index=True)
    sensor_type = Column(String, index=True)
    value = Column(Float)
    unit = Column(String)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)

    asset = relationship("Asset", back_populates="readings")

    __table_args__ = (
        Index("ix_readings_asset_sensor_time", "asset_id", "sensor_type", "timestamp"),
    )

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), index=True)
    symptom_text = Column(Text)
    diagnosis = Column(Text, nullable=True)
    fix_steps = Column(Text, nullable=True)
    risk_level = Column(String, default="medium")
    resolved = Column(Boolean, default=False)
    operator_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    asset = relationship("Asset", back_populates="incidents")

class NodeConfidence(Base):
    __tablename__ = "node_confidence"
    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), index=True)
    confidence_score = Column(Float, default=0.8)
    updated_at = Column(DateTime(timezone=True), default=utcnow)

    asset = relationship("Asset", back_populates="confidence")

