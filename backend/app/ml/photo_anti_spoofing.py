from dataclasses import dataclass, field
from typing import List
import random

@dataclass
class PhotoValidationResult:
    exif_valid: bool
    gps_consistent: bool
    timestamp_valid: bool
    image_quality_score: float
    overall_spoofing_risk: float
    deepfake_risk: float
    duplicate_matches: List[str] = field(default_factory=list)
    recommendation: str = "accept"
    flags: List[str] = field(default_factory=list)

class PhotoAntiSpoofingEngine:
    def __init__(self):
        pass
        
    def validate_submission(self, file_path, contributor_id, submitted_gps, submitted_timestamp):
        """Mock photo validation and anti-spoofing checks"""
        return PhotoValidationResult(
            exif_valid=True,
            gps_consistent=True,
            timestamp_valid=True,
            image_quality_score=0.92,
            overall_spoofing_risk=0.04,
            deepfake_risk=0.01,
            duplicate_matches=[],
            recommendation="accept",
            flags=[]
        )
