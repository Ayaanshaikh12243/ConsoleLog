from .base import BaseAgent
import numpy as np

class SentinelAgent(BaseAgent):
    def __init__(self, h3_index: str):
        super().__init__(f"SENTINEL-{h3_index}")
        self.h3_index = h3_index
        self.baseline = {} # 90-day baseline data

    async def process(self, telemetry: dict) -> dict:
        # Detect multivariate anomalies (NDVI, Soil Moisture, Temp)
        is_anomaly = self.detect_anomaly(telemetry)
        
        if is_anomaly:
            self.log_action("ANOMALY DETECTED", f"Significant deviation in NDVI and Soil Moisture")
            return {"cell_id": self.h3_index, "type": "Environmental", "severity": 0.8}
            
        return {"cell_id": self.h3_index, "type": "Normal", "severity": 0.1}

    def detect_anomaly(self, data: dict) -> bool:
        # Simplified threshold detection
        ndvi = data.get("ndvi", 0.5)
        soil = data.get("soil_moisture", 0.2)
        if ndvi < 0.3 and soil < 0.1: # Potential drought/fire risk
            return True
        return False
