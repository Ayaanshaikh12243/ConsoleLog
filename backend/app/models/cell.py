from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime
from ..core.database import Base

class H3Cell(Base):
    __tablename__ = "h3_cells"

    id = Column(String, primary_key=True) # H3 Index
    resolution = Column(Integer)
    boundary = Column(Geometry('POLYGON', srid=4326))
    
    # Current Metrics
    ndvi = Column(Float)
    soil_moisture = Column(Float)
    temperature = Column(Float)
    seismic_activity = Column(Float)
    
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    anomalies = relationship("Anomaly", back_populates="cell")

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    cell_id = Column(String, ForeignKey("h3_cells.id"))
    type = Column(String) # Environmental, Structural, etc.
    severity = Column(Float) # 0 to 1
    detected_at = Column(DateTime, default=datetime.utcnow)
    
    # Agent insights
    probe_analysis = Column(JSON)
    veritas_score = Column(Float)
    oracle_prediction = Column(JSON)
    
    cell = relationship("H3Cell", back_populates="anomalies")
