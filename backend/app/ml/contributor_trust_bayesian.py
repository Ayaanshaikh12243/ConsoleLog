from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class Observation:
    was_accurate: bool
    gps_consistent: bool
    corroboration_rate: float
    spoofing_risk: float
    submission_quality: float
    duplicate_detected: bool

@dataclass
class ContributorProfile:
    contributor_id: str
    trust_score: float = 0.5
    accuracy_rate: float = 0.0
    submission_count: int = 0
    submission_history: List[Dict] = field(default_factory=list)

class ContributorTrustBayesian:
    def __init__(self):
        self.contributor_profiles = {}
        
    def get_or_create_profile(self, contributor_id: str) -> ContributorProfile:
        if contributor_id not in self.contributor_profiles:
            self.contributor_profiles[contributor_id] = ContributorProfile(contributor_id)
        return self.contributor_profiles[contributor_id]
        
    def update_trust_score(self, contributor_id: str, submission_id: str, observation: Observation) -> float:
        profile = self.get_or_create_profile(contributor_id)
        profile.submission_count += 1
        
        # Simple Bayesian update logic (mock)
        adjustment = 0.05 if observation.was_accurate else -0.1
        if observation.gps_consistent: adjustment += 0.02
        if observation.spoofing_risk > 0.5: adjustment -= 0.2
        
        profile.trust_score = max(0.0, min(1.0, profile.trust_score + adjustment))
        profile.submission_history.append({
            "submission_id": submission_id,
            "was_accurate": observation.was_accurate,
            "timestamp": "2026-04-11T17:30:00"
        })
        
        return profile.trust_score
        
    def get_contributor_reputation(self, contributor_id: str) -> Dict:
        profile = self.get_or_create_profile(contributor_id)
        
        tier = "NEUTRAL"
        if profile.trust_score > 0.8: tier = "HIGH"
        elif profile.trust_score < 0.3: tier = "LOW"
        
        return {
            "contributor_id": contributor_id,
            "trust_score": profile.trust_score,
            "tier": tier,
            "submission_count": profile.submission_count,
            "accuracy_rate": 1.0 if profile.submission_count > 0 else 0.0,
            "recommendation": "ACCEPT" if profile.trust_score > 0.4 else "REVIEW"
        }
