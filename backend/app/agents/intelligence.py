import math
import numpy as np
from .base import BaseAgent
import logging

logger = logging.getLogger("STRATUM-Agent")


class ProbeAgent(BaseAgent):
    """
    Causal investigation using signal fingerprinting.
    No ML model — pure mathematical signal analysis.
    """
    def __init__(self):
        super().__init__("PROBE")

    def compute_decoupling_ratio(self, moisture_z: float, precip_z: float) -> float:
        """
        If moisture is anomalous but rainfall is NOT = infrastructure cause.
        ratio > 2.0 means moisture NOT explained by rain.
        """
        return moisture_z / max(abs(precip_z), 0.1)

    def classify_disaster(self, signals: dict, zone_type: str,
                          decoupling_ratio: float) -> list:
        """
        Score each disaster type using signal combination fingerprints.
        Returns sorted list of (disaster_type, score) tuples.
        """
        m = signals.get("soil_moisture", {}).get("z_score", 0)
        h = signals.get("humidity", {}).get("z_score", 0)
        t = signals.get("temp", {}).get("z_score", 0)
        p = signals.get("rainfall", {}).get("z_score", 0)
        w = signals.get("wind", {}).get("z_score", 0) if "wind" in signals else 0
        s = signals.get("seismic_mag", {}).get("z_score", 0)

        hillside  = 1.5 if any(x in zone_type for x in ["hill", "slope", "mountain"]) else 1.0
        coastal   = 2.0 if "coastal" in zone_type else 0.3
        urban     = 1.5 if "urban" in zone_type else 0.8
        floodplain = 1.8 if "floodplain" in zone_type or "river" in zone_type else 1.0

        scores = {
            "FLOOD":              ((m * 0.4) + (h * 0.3) + (p * 0.3)) * floodplain,
            "LANDSLIDE":          ((m * 0.4) + (p * 0.4) + (h * 0.2)) * hillside,
            "PIPE_FAILURE":       (m * decoupling_ratio * 0.5) * urban,
            "EARTHQUAKE":         s * 2.0,
            "SEISMIC_DISTURBANCE": s * 1.2,
            "HEATWAVE":           (t * max(-h, 0) * 0.5) if t > 0 else 0,
            "FIRE_RISK":          (t * 0.3 + max(-h, 0) * 0.3 + max(-m, 0) * 0.2 + w * 0.2),
            "COASTAL_EROSION":    (m * 0.3 + t * 0.2 + h * 0.2) * coastal,
            "DROUGHT":            (max(-m, 0) * 0.4 + max(-p, 0) * 0.4 + t * 0.2),
            "NORMAL":             0.1
        }

        return sorted(scores.items(), key=lambda x: x[1], reverse=True)

    async def process(self, input_data: dict) -> dict:
        """
        input_data must contain:
        - sentinel_result: dict from SentinelAgent
        - zone_type: string like "urban_coastal"
        - zone_name: string
        - affected_assets: list of strings
        """
        sentinel   = input_data.get("sentinel_result", {})
        signals    = sentinel.get("signals", {})
        zone_type  = input_data.get("zone_type", "unknown")
        zone_name  = input_data.get("zone_name", "Unknown Zone")

        moisture_z = signals.get("soil_moisture", {}).get("z_score", 0)
        precip_z   = signals.get("rainfall", {}).get("z_score", 0)
        max_z      = sentinel.get("max_z_score", 0)

        decoupling       = self.compute_decoupling_ratio(moisture_z, precip_z)
        disaster_ranking = self.classify_disaster(signals, zone_type, decoupling)

        top_disaster = disaster_ranking[0][0]
        top_score    = disaster_ranking[0][1]

        # Confidence based on score magnitude
        raw_confidence = min(top_score * 25, 95)
        confidence = max(int(raw_confidence), 10)

        # Severity from max z-score
        if max_z > 3.5:   severity = "CRITICAL"
        elif max_z > 2.5: severity = "HIGH"
        elif max_z > 1.5: severity = "MEDIUM"
        else:             severity = "LOW"

        # Physical mechanism
        key_signal = sentinel.get("anomalous_signals", ["unknown"]) if sentinel.get("anomalous_signals") else "signal deviation"
        mechanism  = f"Anomalous {key_signal} detected ({max_z:.1f}\u03c3 above baseline) in {zone_name}"

        self.log_action("PROBE COMPLETE", f"disaster={top_disaster}, conf={confidence}%, severity={severity}")

        return {
            "disaster_type":      top_disaster,
            "disaster_confidence": confidence,
            "severity":           severity,
            "mechanism":          mechanism,
            "decoupling_ratio":   round(decoupling, 2),
            "disaster_ranking":   disaster_ranking[:3],
            "key_differentiator": key_signal,
            "probe_confidence":   confidence
        }


class VeritasAgent(BaseAgent):
    """
    Mathematical ground truth scoring.
    No external API calls. Pure signal consistency analysis.
    """
    def __init__(self):
        super().__init__("VERITAS")

    def zone_plausibility(self, disaster_type: str, zone_type: str) -> float:
        matrix = {
            "FLOOD":            {"coastal": 1.4, "floodplain": 1.5, "urban": 1.0, "hill": 0.6},
            "LANDSLIDE":        {"hill": 1.8, "coastal": 0.9, "urban": 0.5, "floodplain": 0.7},
            "PIPE_FAILURE":     {"urban": 1.6, "coastal": 1.0, "hill": 0.4, "floodplain": 0.7},
            "COASTAL_EROSION":  {"coastal": 2.0, "urban": 0.4, "hill": 0.2, "floodplain": 0.5},
            "EARTHQUAKE":       {"hill": 1.2, "coastal": 1.1, "urban": 1.0, "floodplain": 0.9},
            "HEATWAVE":         {"urban": 1.5, "coastal": 0.8, "hill": 0.6, "floodplain": 1.0},
            "FIRE_RISK":        {"hill": 1.6, "urban": 0.7, "coastal": 0.5, "floodplain": 0.8},
            "DROUGHT":          {"floodplain": 0.8, "urban": 0.9, "hill": 1.2, "coastal": 0.6},
        }
        type_scores = matrix.get(disaster_type, {})
        for key in type_scores:
            if key in zone_type.lower():
                return type_scores[key]
        return 1.0  # neutral if no match

    async def process(self, input_data: dict) -> dict:
        """
        input_data must contain:
        - sentinel_result: dict from SentinelAgent
        - probe_result: dict from ProbeAgent
        - zone_type: string
        - days_elevated: int (how many days signals have been anomalous)
        """
        sentinel     = input_data.get("sentinel_result", {})
        probe        = input_data.get("probe_result", {})
        zone_type    = input_data.get("zone_type", "unknown")
        days_elevated = input_data.get("days_elevated", 1)

        signals      = sentinel.get("signals", {})
        disaster_type = probe.get("disaster_type", "NORMAL")

        # Component 1: Signal consistency (0-1)
        # All signals deviating in SAME direction = more credible
        z_scores = [abs(v.get("z_score", 0)) for v in signals.values() if isinstance(v, dict)]
        if len(z_scores) > 1:
            mean_z = sum(z_scores) / len(z_scores)
            std_z  = (sum((x - mean_z) ** 2 for x in z_scores) / len(z_scores)) ** 0.5
            consistency = max(0, 1 - (std_z / (mean_z + 0.001)))
        else:
            consistency = 0.5

        # Component 2: Duration credibility (0-1)
        # Anomaly sustained > 3 days = more credible
        duration = min(days_elevated / 7.0, 1.0)

        # Component 3: Zone plausibility (0-2, normalized to 0-1)
        plausibility = min(self.zone_plausibility(disaster_type, zone_type) / 2.0, 1.0)

        # Component 4: Signal strength
        max_z    = sentinel.get("max_z_score", 0)
        strength = min(max_z / 4.0, 1.0)

        # Weighted final score (0-100)
        ground_truth_score = int(
            consistency  * 30 +
            duration     * 20 +
            plausibility * 30 +
            strength     * 20
        )

        verdict = (
            "CONFIRMED"          if ground_truth_score > 65 else
            "UNVERIFIED"         if ground_truth_score > 35 else
            "LOW_CONFIDENCE"     if ground_truth_score > 20 else
            "CONTRADICTED"
        )

        self.log_action("VERITAS COMPLETE", f"score={ground_truth_score}, verdict={verdict}")

        return {
            "ground_truth_score": ground_truth_score,
            "verdict":            verdict,
            "consistency_score":  round(consistency, 3),
            "duration_score":     round(duration, 3),
            "plausibility_score": round(plausibility, 3),
            "signal_strength":    round(strength, 3)
        }


class OracleAgent(BaseAgent):
    """
    Monte Carlo risk forecasting using numpy.
    No ML models. Vectorized simulation.
    """
    def __init__(self):
        super().__init__("ORACLE")

    async def process(self, input_data: dict) -> dict:
        """
        input_data must contain:
        - probe_result: dict from ProbeAgent
        - veritas_result: dict from VeritasAgent
        - sentinel_result: dict from SentinelAgent
        - affected_assets: list of strings
        """
        probe   = input_data.get("probe_result", {})
        veritas = input_data.get("veritas_result", {})
        sentinel = input_data.get("sentinel_result", {})
        assets  = input_data.get("affected_assets", [])

        veritas_score = veritas.get("ground_truth_score", 50)
        severity      = probe.get("severity", "LOW")
        max_z         = sentinel.get("max_z_score", 1.0)

        # Only run if confidence sufficient
        disaster_type = probe.get("disaster_type", "NORMAL")
        seismic_types = {"EARTHQUAKE", "SEISMIC_DISTURBANCE"}
        if veritas_score < 25 and disaster_type not in seismic_types:
            return {
                "skipped": True,
                "reason": "VERITAS score too low",
                "day30_mean": 0.0, "day90_mean": 0.0, "day180_mean": 0.0,
                "cost_of_inaction_crores": 0,
                "scenarios_run": 0
            }

        N             = 10000
        base_risk     = veritas_score / 100.0
        sm            = {"LOW": 0.8, "MEDIUM": 1.0, "HIGH": 1.3, "CRITICAL": 1.6}[severity]
        risk_velocity = (max_z / 3.0) * 0.015

        # Vectorized Monte Carlo — all 10k scenarios at once
        rng      = np.random.default_rng()  # no fixed seed = true random
        noise_30  = rng.normal(0, 0.08, N)
        noise_90  = rng.normal(0, 0.14, N)
        noise_180 = rng.normal(0, 0.20, N)

        risk_30  = np.clip(base_risk * sm + (risk_velocity * 30)  + noise_30,  0, 1)
        risk_90  = np.clip(base_risk * sm + (risk_velocity * 90)  + noise_90,  0, 1)
        risk_180 = np.clip(base_risk * sm + (risk_velocity * 180) + noise_180, 0, 1)

        # Intervention scenarios
        risk_act_w1 = np.clip(base_risk * 0.5 + noise_90 * 0.4, 0, 1)
        risk_act_w4 = np.clip(base_risk * sm + (risk_velocity * 90 * 0.5) + noise_90, 0, 1)

        # Cost of inaction (crores INR)
        asset_value = max(len(assets), 1) * 150
        cost        = round(asset_value * float(np.mean(risk_180)) * sm, 1)
        day30_mean  = float(np.mean(risk_30))
        day90_mean  = float(np.mean(risk_90))
        day180_mean = float(np.mean(risk_180))
        self.log_action("ORACLE COMPLETE",
            f"day30={np.mean(risk_30):.2f}, day90={np.mean(risk_90):.2f}, cost={cost}cr")

        return {
            "day30_mean":  float(min(day30_mean,  0.80)),
            "day30_p10":           round(float(np.percentile(risk_30, 10)), 3),
            "day30_p90":           round(float(np.percentile(risk_30, 90)), 3),
            "day90_mean":  float(min(day90_mean,  0.88)),
            "day90_p10":           round(float(np.percentile(risk_90, 10)), 3),
            "day90_p90":           round(float(np.percentile(risk_90, 90)), 3),
            "day180_mean": float(min(day180_mean, 0.93)),
            "day180_p10":          round(float(np.percentile(risk_180, 10)), 3),
            "day180_p90":          round(float(np.percentile(risk_180, 90)), 3),
            "act_week1_day90":     round(float(np.mean(risk_act_w1)), 3),
            "act_week4_day90":     round(float(np.mean(risk_act_w4)), 3),
            "cost_of_inaction_crores": cost,
            "scenarios_run":       N,
            "skipped":             False
        }
