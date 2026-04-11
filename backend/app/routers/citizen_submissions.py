from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Optional, List
import aiofiles
from datetime import datetime
from pathlib import Path
import h3
import math
import numpy as np
import httpx

from ..ml.audio_self_supervised import AudioSelfSupervisedBaseline
from ..ml.video_real_time_processor import VideoRealtimeProcessor
from ..ml.photo_anti_spoofing import PhotoAntiSpoofingEngine
from ..ml.contributor_trust_bayesian import ContributorTrustBayesian, Observation
from ..ml.corroboration_matcher import CorroborationMatcher
from ..utils.logger import setup_logger

router = APIRouter(prefix="/api/v1", tags=["Submissions"])
logger = setup_logger("CitizenAPI")

# Initialize processing systems
audio_baseline = AudioSelfSupervisedBaseline()
video_processor = VideoRealtimeProcessor()
photo_spoofing = PhotoAntiSpoofingEngine()
trust_system = ContributorTrustBayesian()
corroboration = CorroborationMatcher()

# Storage paths
SUBMISSION_DIR = Path("stratum/citizen_submissions")
SUBMISSION_DIR.mkdir(parents=True, exist_ok=True)

async def run_corroboration_matching(submission: dict):
    """Background task to match submission with SENTINEL signals"""
    try:
        corr_result = corroboration.evaluate_submission(submission)
        logger.info(
            f"Corroboration: {submission['submission_id']} -> {corr_result.action} "
            f"(score: {corr_result.match_score:.3f})"
        )
    except Exception as e:
        logger.error(f"Corroboration error: {e}")

@router.post("/submit/audio")
async def submit_audio(
    contributor_id: str = Form(...),
    location_lat: float = Form(...),
    location_lon: float = Form(...),
    timestamp: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        logger.info(f"Audio submission from {contributor_id}")
        if not file.filename.lower().endswith(('.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac')):
            raise HTTPException(status_code=400, detail=f"Invalid audio format: '{file.filename}'. Accepted: mp3, wav, m4a, ogg, aac, flac")
        
        file_path = SUBMISSION_DIR / f"audio_{contributor_id}_{int(datetime.now().timestamp())}.wav"
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(await file.read())
            
        if math.isnan(location_lat) or math.isnan(location_lon):
            raise HTTPException(status_code=400, detail="Invalid GPS coordinates (NaN ignored)")
        
        h3_cell = h3.latlng_to_cell(location_lat, location_lon, 8)
        
        # Mock processing
        audio_array = np.random.randn(16000 * 10)
        classification = audio_baseline.classify(audio_array)
        distress_probs = audio_baseline.get_distress_probability(audio_array)
        
        submission = {
            "submission_type": "audio",
            "submission_id": f"audio_{contributor_id}_{int(datetime.now().timestamp())}",
            "contributor_id": contributor_id,
            "h3_cell": h3_cell,
            "gps": {"lat": location_lat, "lon": location_lon},
            "timestamp": timestamp,
            "file_path": str(file_path),
            "damage_type": classification.get("predicted_distress", "unknown"),
            "confidence": classification.get("confidence", 0.0),
            "severity_grade": classification.get("severity_grade", "E"),
            "distress_probabilities": distress_probs,
            "status": "accepted",
            "submitted_at": datetime.now().isoformat()
        }
        
        return JSONResponse(submission, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio submission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit/video")
async def submit_video(
    contributor_id: str = Form(...),
    location_lat: float = Form(...),
    location_lon: float = Form(...),
    timestamp: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        logger.info(f"Video submission from {contributor_id}")
        if not file.filename.lower().endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv')):
            raise HTTPException(status_code=400, detail=f"Invalid video format: '{file.filename}'. Accepted: mp4, mov, avi, mkv, webm, wmv")
        
        file_path = SUBMISSION_DIR / f"video_{contributor_id}_{int(datetime.now().timestamp())}.mp4"
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(await file.read())
            
        if math.isnan(location_lat) or math.isnan(location_lon):
            raise HTTPException(status_code=400, detail="Invalid GPS coordinates (NaN ignored)")
        
        h3_cell = h3.latlng_to_cell(location_lat, location_lon, 8)
        result = video_processor.process_video_file(str(file_path))
        
        submission = {
            "submission_type": "video",
            "submission_id": f"video_{contributor_id}_{int(datetime.now().timestamp())}",
            "contributor_id": contributor_id,
            "h3_cell": h3_cell,
            "gps": {"lat": location_lat, "lon": location_lon},
            "timestamp": timestamp,
            "file_path": str(file_path),
            "damage_type": result.overall_damage_type,
            "damage_confidence": result.overall_confidence,
            "damage_severity": result.overall_severity,
            "frames_analyzed": result.frames_processed,
            "status": "accepted" if result.recommendation == "accept" else "review",
            "submitted_at": datetime.now().isoformat()
        }
        
        return JSONResponse(submission, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video submission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit/photo")
async def submit_photo(
    contributor_id: str = Form(...),
    location_lat: float = Form(...),
    location_lon: float = Form(...),
    timestamp: str = Form(...),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    try:
        logger.info(f"Photo submission from {contributor_id}")
        if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
            raise HTTPException(status_code=400, detail="Invalid photo format")
        
        file_path = SUBMISSION_DIR / f"photo_{contributor_id}_{int(datetime.now().timestamp())}.jpg"
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(await file.read())
            
        if math.isnan(location_lat) or math.isnan(location_lon):
            raise HTTPException(status_code=400, detail="Invalid GPS coordinates (NaN ignored)")
        
        h3_cell = h3.latlng_to_cell(location_lat, location_lon, 8)
        validation_result = photo_spoofing.validate_submission(str(file_path), contributor_id, (location_lat, location_lon), timestamp)
        
        # Classify damage type using video processor on single frame (fallback)
        damage_type = "normal"
        damage_confidence = 0.0
        damage_severity = "E"
        
        try:
            frame_result = video_processor.process_single_frame(str(file_path))
            if frame_result:
                damage_type = frame_result.damage_type
                damage_confidence = frame_result.confidence
                damage_severity = frame_result.severity_grade
        except Exception as e:
            logger.warning(f"Damage classification error: {e}, using normal")

        # Call Flask disaster classifier for image-level disaster type
        disaster_prediction = None
        disaster_confidence = None
        disaster_all_probs = {}
        try:
            with open(file_path, "rb") as img_file:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "http://localhost:5000/predict",
                        files={"file": (file_path.name, img_file, "image/jpeg")}
                    )
                if resp.status_code == 200:
                    dr = resp.json()
                    disaster_prediction = dr.get("prediction")
                    disaster_confidence = dr.get("confidence")
                    disaster_all_probs = dr.get("all_probabilities", {})
                    logger.info(f"Disaster model: {disaster_prediction} ({disaster_confidence:.1f}%)")
        except Exception as e:
            logger.warning(f"Disaster classifier unavailable: {e}")
        
        observation = Observation(
            was_accurate=True,
            gps_consistent=validation_result.gps_consistent,
            corroboration_rate=0.0,
            spoofing_risk=validation_result.overall_spoofing_risk,
            submission_quality=validation_result.image_quality_score,
            duplicate_detected=len(validation_result.duplicate_matches) > 0
        )
        
        new_trust_score = trust_system.update_trust_score(contributor_id, f"photo_{int(datetime.now().timestamp())}", observation)
        
        submission = {
            "submission_type": "photo",
            "submission_id": f"photo_{contributor_id}_{int(datetime.now().timestamp())}",
            "contributor_id": contributor_id,
            "contributor_trust_score": new_trust_score,
            "h3_cell": h3_cell,
            "gps": {"lat": location_lat, "lon": location_lon},
            "timestamp": timestamp,
            "file_path": str(file_path),
            "damage_type": damage_type,
            "damage_confidence": damage_confidence,
            "damage_severity": damage_severity,
            "disaster_classification": {
                "prediction": disaster_prediction,
                "confidence": disaster_confidence,
                "all_probabilities": disaster_all_probs
            },
            "validation": {
                "exif_valid": validation_result.exif_valid,
                "gps_consistent": validation_result.gps_consistent,
                "image_quality_score": validation_result.image_quality_score,
                "spoofing_risk": validation_result.overall_spoofing_risk,
                "recommendation": validation_result.recommendation
            },
            "status": "accepted" if validation_result.recommendation == "accept" else validation_result.recommendation,
            "submitted_at": datetime.now().isoformat()
        }
        
        if background_tasks:
            background_tasks.add_task(run_corroboration_matching, submission)
            
        return JSONResponse(submission, status_code=201)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Photo submission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/contributor/{contributor_id}/reputation")
async def get_contributor_reputation(contributor_id: str):
    try:
        reputation = trust_system.get_contributor_reputation(contributor_id)
        return JSONResponse(reputation)
    except Exception as e:
        logger.error(f"Reputation fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Citizen Submission API", "timestamp": datetime.now().isoformat()}
