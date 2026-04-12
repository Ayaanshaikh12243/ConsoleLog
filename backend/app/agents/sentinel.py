from .base import BaseAgent
import numpy as np
import logging

logger = logging.getLogger("STRATUM-Agent")


class SentinelAgent(BaseAgent):
    """
    Statistical anomaly detection using Z-scores.
    No ML model needed — pure math on real baseline data.
    """
    def __init__(self, h3_index: str):
        super().__init__(f"SENTINEL-{h3_index}")
        self.h3_index = h3_index
        # Store rolling 90-day baseline per signal
        # Structure: {"rainfall": [list of values], "temp": [...], ...}
        self.baseline_window = {
            "rainfall": [], "temp": [], "humidity": [],
            "soil_moisture": [], "seismic_mag": [], "ndvi": []
        }
        self.MIN_BASELINE_POINTS = 3  # minimum readings before z-score is valid

    def update_baseline(self, telemetry: dict):
        """Add new reading to rolling baseline window (max 90 days = 90 points)"""
        MAX_WINDOW = 90
        for key in self.baseline_window:
            val = telemetry.get(key)
            if val is not None:
                self.baseline_window[key].append(float(val))
                if len(self.baseline_window[key]) > MAX_WINDOW:
                    self.baseline_window[key].pop(0)

    def compute_z_score(self, signal_name: str, current_value: float) -> float:
        """
        Z = (current - mean) / std_dev
        Returns 0.0 if not enough baseline data yet.
        """
        history = self.baseline_window[signal_name]
        if len(history) < self.MIN_BASELINE_POINTS:
            return 0.0
        mean = sum(history) / len(history)
        variance = sum((x - mean) ** 2 for x in history) / len(history)
        std = variance ** 0.5
        if std < 0.001:  # avoid division by near-zero
            return 0.0
        return (current_value - mean) / std

    async def process(self, telemetry: dict) -> dict:
        """
        Detect multivariate anomaly using z-scores across all signals.
        Escalates if:
        - Any single signal z-score > 3.0 (severe single anomaly)
        - 2+ signals have z-score > 2.0 (correlated multi-signal anomaly)
        """
        # Update baseline with this reading
        self.update_baseline(telemetry)

        # Compute z-scores for all signals
        signals = {}
        for key in self.baseline_window:
            current = telemetry.get(key, 0.0)
            z = self.compute_z_score(key, float(current))
            signals[key] = {
                "current": current,
                "z_score": round(z, 3),
                "anomalous": z > 2.0 if key in ("rainfall", "humidity", "soil_moisture") else abs(z) > 2.0
            }

        # Anomaly decision rules
        max_z = max(abs(s["z_score"]) for s in signals.values())
        anomalous_signals = [k for k, v in signals.items() if v["anomalous"]]
        num_anomalous = len(anomalous_signals)

        # Escalation logic
        escalate = False
        escalation_reason = "NORMAL"

        if max_z > 3.0:
            escalate = True
            escalation_reason = "SEVERE_SINGLE_SIGNAL"
        elif num_anomalous >= 2:
            escalate = True
            escalation_reason = "CORRELATED_MULTI_SIGNAL"

        # Confidence = normalized combination of z-score and signal count
        confidence = round(
            min((max_z / 4.0) * 0.6 + (num_anomalous / 6.0) * 0.4, 1.0), 3
        )

        if escalate:
            self.log_action(
                "ANOMALY ESCALATED",
                f"max_z={max_z:.2f}, signals={anomalous_signals}, reason={escalation_reason}"
            )

        return {
            "cell_id": self.h3_index,
            "escalate": escalate,
            "escalation_reason": escalation_reason,
            "max_z_score": round(max_z, 3),
            "anomalous_signals": anomalous_signals,
            "num_anomalous": num_anomalous,
            "confidence": confidence,
            "signals": signals,
            "type": "ANOMALY" if escalate else "Normal"
        }
