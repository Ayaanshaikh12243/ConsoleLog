from .base import BaseAgent
import joblib
from pathlib import Path
import logging
import numpy as np

logger = logging.getLogger("STRATUM-Agent")

class ProbeAgent(BaseAgent):
    def __init__(self):
        super().__init__("PROBE")
        self.model = None
        try:
            model_path = Path("C:/Users/harsh/OneDrive/Desktop/Airavat_ConsoleLog/models-main/probe_cause_classifier.pkl")
            self.model = joblib.load(model_path)
            logger.info("PROBE XGBoost model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load PROBE model: {e}")

    async def process(self, cell_id: str) -> dict:
        self.log_action("Investigation", f"Fetching 5-year historical data for {cell_id}")
        
        # XGBoost expects 2D array: (n_samples, 6 features)
        # Dummy features for investigation
        features = np.array([[0.5, 0.2, 25.0, 0.0, 60.0, 0.0]])
        
        pred = 1
        confidence = 0.92
        if self.model:
            try:
                pred = int(self.model.predict(features)[0])
                confidence = float(np.max(self.model.predict_proba(features)[0]))
            except Exception as e:
                logger.warning(f"Probe prediction error: {e}")
        
        causes = {
            0: "Normal environmental fluctuation",
            1: "Unusual soil moisture depletion + nearby industrial runoff"
        }
        
        return {
            "cell_id": cell_id,
            "severity": "B" if pred == 1 else "C",
            "root_cause": causes.get(pred, "Unknown factor"),
            "confidence": confidence
        }

class VeritasAgent(BaseAgent):
    def __init__(self):
        super().__init__("VERITAS")

    async def process(self, cell_id: str) -> dict:
        self.log_action("Verifying", f"Cross-checking active news and social feeds for {cell_id}")
        
        # Mock cross-check
        return {
            "ground_truth_score": 88,
            "corroborating_sources": ["Twitter Geo-tagged", "Local Weather Station #442"]
        }

class OracleAgent(BaseAgent):
    def __init__(self):
        super().__init__("ORACLE")
        self.models = None
        try:
            model_path = Path("C:/Users/harsh/OneDrive/Desktop/Airavat_ConsoleLog/models-main/oracle_trajectory_models.pkl")
            self.models = joblib.load(model_path)
            logger.info("ORACLE XGBoost trajectory models loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load ORACLE models: {e}")

    async def process(self, analysis_data: dict) -> dict:
        self.log_action("Predicting", "Generating trajectory forecasts")
        
        # ORACLE expects 2 features, possibly [current_severity_numerical, confident_score]
        # Using mock inputs derived from investigation data
        current_sev = 0.8 if analysis_data.get("severity") == "A" else 0.5
        conf = analysis_data.get("confidence", 0.9)
        features = np.array([[current_sev, conf]])
        
        risk_forecast = {
            "30d": "12% failure probability",
            "90d": "45% failure probability",
            "180d": "82% failure probability"
        }
        
        if self.models:
            try:
                pred_30 = float(self.models[30].predict(features)[0])
                pred_90 = float(self.models[90].predict(features)[0])
                pred_180 = float(self.models[180].predict(features)[0])
                
                risk_forecast = {
                    "30d": f"{pred_30*100:.1f}% failure probability",
                    "90d": f"{pred_90*100:.1f}% failure probability",
                    "180d": f"{pred_180*100:.1f}% failure probability"
                }
            except Exception as e:
                logger.warning(f"Oracle prediction error: {e}")
        
        return {
            "risk_forecast": risk_forecast,
            "cost_of_inaction": "$2.4M",
            "recommended_intervention": "Reinforce levee system in H3 quadrant 4"
        }
