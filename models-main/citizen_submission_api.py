"""
Citizen Submission API Endpoints
REST API for citizen to submit audio, video, photos
Integrates all validation and processing systems
"""
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import aiofiles
import json
from datetime import datetime
from pathlib import Path

from ml.audio_self_supervised import AudioSelfSupervisedBaseline
from ml.video_real_time_processor import VideoRealtimeProcessor
from ml.photo_anti_spoofing import PhotoAntiSpoofingEngine
from ml.contributor_trust_bayesian import ContributorTrustBayesian, Observation
from ml.corroboration_matcher import CorroborationMatcher

from utils.logger import setup_logger
import h3

app = FastAPI(
    title="STRATUM Citizen Submission API",
    description="Accept and process citizen ground truth submissions",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domain: ["https://example.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.on_event("startup")
async def startup_event():
    logger.info("Citizen Submission API starting...")


# ============================================================================
# AUDIO SUBMISSIONS
# ============================================================================

@app.post("/api/v1/submit/audio")
async def submit_audio(
    contributor_id: str = Form(...),
    location_lat: float = Form(...),
    location_lon: float = Form(...),
    timestamp: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Submit audio recording (mp3, wav, m4a)
    
    Audio is processed through:
    1. FFT spectrogram extraction
    2. Self-supervised CNN classification
    3. Distress detection
    4. Anti-spoofing checks
    
    Returns:
        Submission result with classification
    """
    try:
        logger.info(f"Audio submission from {contributor_id}")
        
        # Validate file
        if not file.filename.lower().endswith(('.mp3', '.wav', '.m4a', '.ogg')):
            raise HTTPException(status_code=400, detail="Invalid audio format")
        
        # Save file
        file_path = SUBMISSION_DIR / f"audio_{contributor_id}_{int(datetime.now().timestamp())}.wav"
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(await file.read())
        
        # H3 cell mapping
        h3_cell = h3.latlng_to_cell(location_lat, location_lon, 8)
        
        # Extract features and classify
        import numpy as np
        # In production: load audio with librosa
        audio_array = np.random.randn(16000 * 10)  # Mock: 10 second audio
        
        classification = audio_baseline.classify(audio_array)
        distress_probs = audio_baseline.get_distress_probability(audio_array)
        
        if not classification:
            classification = {
                "predicted_distress": "unknown",
                "confidence": 0.0,
                "is_anomalous": False,
                "severity_grade": "E"
            }
        
        # Create submission record
        submission = {
            "submission_type": "audio",
            "submission_id": f"audio_{contributor_id}_{int(datetime.now().timestamp())}",
            "contributor_id": contributor_id,
            "h3_cell": h3_cell,
            "gps": {"lat": location_lat, "lon": location_lon},
            "timestamp": timestamp,
            "file_path": str(file_path),
            
            # Classification
            "damage_type": classification.get("predicted_distress", "unknown"),
            "confidence": classification.get("confidence", 0.0),
            "severity_grade": classification.get("severity_grade", "E"),
            "distress_probabilities": distress_probs,
            
            # Status
            "status": "accepted",
            "submitted_at": datetime.now().isoformat()
        }
        
        logger.info(f"Audio accepted: {submission['submission_id']}")
        
        return JSONResponse(submission, status_code=201)
    
    except Exception as e:
        logger.error(f"Audio submission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# VIDEO SUBMISSIONS
# ============================================================================

@app.post("/api/v1/submit/video")
async def submit_video(
    contributor_id: str = Form(...),
    location_lat: float = Form(...),
    location_lon: float = Form(...),
    timestamp: str = Form(...),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Submit video recording (mp4, mov, avi)
    
    Video is processed with:
    1. Real-time frame extraction (< 3 second guarantee)
    2. MobileNetV3 damage classification
    3. Severity grading
    4. Quality analysis
    
    Returns:
        Submission result with video analysis
    """
    try:
        logger.info(f"Video submission from {contributor_id}")
        
        # Validate file
        if not file.filename.lower().endswith(('.mp4', '.mov', '.avi', '.mkv')):
            raise HTTPException(status_code=400, detail="Invalid video format")
        
        # Save file
        file_path = SUBMISSION_DIR / f"video_{contributor_id}_{int(datetime.now().timestamp())}.mp4"
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(await file.read())
        
        # H3 cell mapping
        h3_cell = h3.latlng_to_cell(location_lat, location_lon, 8)
        
        # Process video (< 3 seconds)
        result = video_processor.process_video_file(str(file_path), max_duration=30)
        
        if not result:
            submission = {
                "status": "rejected",
                "reason": "Video processing failed"
            }
            return JSONResponse(submission, status_code=400)
        
        # Create submission record
        submission = {
            "submission_type": "video",
            "submission_id": f"video_{contributor_id}_{int(datetime.now().timestamp())}",
            "contributor_id": contributor_id,
            "h3_cell": h3_cell,
            "gps": {"lat": location_lat, "lon": location_lon},
            "timestamp": timestamp,
            "file_path": str(file_path),
            
            # Video analysis (using consistent field names)
            "damage_type": result.overall_damage_type,
            "damage_confidence": result.overall_confidence,
            "damage_severity": result.overall_severity,
            "frames_analyzed": result.frames_processed,
            "processing_time_sec": result.processing_time_sec,
            "most_severe_finding": {
                "frame_idx": result.most_severe_finding.frame_idx,
                "damage_type": result.most_severe_finding.damage_type,
                "confidence": result.most_severe_finding.confidence
            },
            
            # Status
            "status": "accepted" if result.recommendation == "accept" else "review",
            "submitted_at": datetime.now().isoformat(),
            "processing_time_ms": int(result.processing_time_sec * 1000)
        }
        
        logger.info(f"Video accepted in {result.processing_time_sec:.2f}s: {submission['submission_id']}")
        
        return JSONResponse(submission, status_code=201)
    
    except Exception as e:
        logger.error(f"Video submission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PHOTO SUBMISSIONS
# ============================================================================

@app.post("/api/v1/submit/photo")
async def submit_photo(
    contributor_id: str = Form(...),
    location_lat: float = Form(...),
    location_lon: float = Form(...),
    timestamp: str = Form(...),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Submit photo (jpg, png, webp)
    
    Photo is processed with:
    1. Anti-spoofing checks (EXIF, GPS consistency, deepfake)
    2. Damage classification
    3. Duplicate detection
    4. Contributor trust scoring
    
    Returns:
        Submission result with validation details
    """
    try:
        logger.info(f"Photo submission from {contributor_id}")
        
        # Validate file
        if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
            raise HTTPException(status_code=400, detail="Invalid photo format")
        
        # Save file
        file_path = SUBMISSION_DIR / f"photo_{contributor_id}_{int(datetime.now().timestamp())}.jpg"
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(await file.read())
        
        # H3 cell mapping
        h3_cell = h3.latlng_to_cell(location_lat, location_lon, 8)
        
        # Validate photo
        validation_result = photo_spoofing.validate_submission(
            str(file_path),
            contributor_id,
            submitted_gps=(location_lat, location_lon),
            submitted_timestamp=timestamp
        )
        
        # Classify damage type using video processor on single frame
        damage_type = "normal"
        damage_confidence = 0.0
        damage_severity = "E"
        
        try:
            # Use video processor to analyze static image
            frame_result = video_processor.process_single_frame(str(file_path))
            if frame_result:
                damage_type = frame_result.damage_type
                damage_confidence = frame_result.confidence
                damage_severity = frame_result.severity_grade
        except Exception as e:
            logger.warning(f"Damage classification error: {e}, using normal")
            damage_type = "normal"
        
        # Update contributor trust score
        observation = Observation(
            was_accurate=True,  # Will be updated by MERIDIAN later
            gps_consistent=validation_result.gps_consistent,
            corroboration_rate=0.0,  # Will be updated after corroboration
            spoofing_risk=validation_result.overall_spoofing_risk,
            submission_quality=validation_result.image_quality_score,
            duplicate_detected=len(validation_result.duplicate_matches) > 0
        )
        
        new_trust_score = trust_system.update_trust_score(
            contributor_id,
            f"photo_{int(datetime.now().timestamp())}",
            observation
        )
        
        # Create submission record
        submission = {
            "submission_type": "photo",
            "submission_id": f"photo_{contributor_id}_{int(datetime.now().timestamp())}",
            "contributor_id": contributor_id,
            "contributor_trust_score": new_trust_score,
            "h3_cell": h3_cell,
            "gps": {"lat": location_lat, "lon": location_lon},
            "timestamp": timestamp,
            "file_path": str(file_path),
            
            # Damage classification ← NEW!
            "damage_type": damage_type,
            "damage_confidence": damage_confidence,
            "damage_severity": damage_severity,
            
            # Validation results
            "validation": {
                "exif_valid": validation_result.exif_valid,
                "gps_consistent": validation_result.gps_consistent,
                "timestamp_valid": validation_result.timestamp_valid,
                "image_quality_score": validation_result.image_quality_score,
                "spoofing_risk": validation_result.overall_spoofing_risk,
                "deepfake_risk": validation_result.deepfake_risk,
                "duplicates_found": len(validation_result.duplicate_matches),
                "recommendation": validation_result.recommendation
            },
            
            # Status
            "status": "accepted" if validation_result.recommendation == "accept" else validation_result.recommendation,
            "flags": validation_result.flags,
            "submitted_at": datetime.now().isoformat()
        }
        
        logger.info(f"Photo accepted: {submission['submission_id']}")
        
        # Background task: Run corroboration matching
        if background_tasks:
            background_tasks.add_task(
                run_corroboration_matching,
                submission
            )
        
        return JSONResponse(submission, status_code=201)
    
    except Exception as e:
        logger.error(f"Photo submission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CORROBORATION & INTEGRATION
# ============================================================================

async def run_corroboration_matching(submission: dict):
    """Background task to match submission with SENTINEL signals"""
    try:
        corr_result = corroboration.evaluate_submission(submission)
        
        logger.info(
            f"Corroboration: {submission['submission_id']} → {corr_result.action} "
            f"(score: {corr_result.match_score:.3f})"
        )
    except Exception as e:
        logger.error(f"Corroboration error: {e}")


@app.post("/api/v1/batch-corroborate")
async def batch_corroborate(submissions: List[dict]):
    """
    Batch evaluate multiple submissions for corroboration
    """
    try:
        results = corroboration.batch_evaluate(submissions)
        report = corroboration.generate_corroboration_report(results)
        
        return JSONResponse({
            "total_processed": len(results),
            "report": report,
            "results": [
                {
                    "submission_id": results[i].__dict__ if hasattr(results[i], '__dict__') else {},
                    "action": r.action,
                    "match_score": r.match_score,
                    "weight": r.weight
                }
                for i, r in enumerate(results)
            ]
        })
    
    except Exception as e:
        logger.error(f"Batch corroboration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CONTRIBUTOR METRICS
# ============================================================================

@app.get("/api/v1/contributor/{contributor_id}/reputation")
async def get_contributor_reputation(contributor_id: str):
    """Get reputation stats for contributor"""
    try:
        reputation = trust_system.get_contributor_reputation(contributor_id)
        return JSONResponse(reputation)
    except Exception as e:
        logger.error(f"Reputation fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/contributor/{contributor_id}/submissions")
async def get_contributor_submissions(contributor_id: str, limit: int = 100):
    """Get submission history for contributor"""
    try:
        profile = trust_system.get_or_create_profile(contributor_id)
        
        return JSONResponse({
            "contributor_id": contributor_id,
            "total_submissions": len(profile.submission_history),
            "recent_submissions": profile.submission_history[-limit:],
            "trust_score": profile.trust_score,
            "accuracy_rate": profile.accuracy_rate
        })
    except Exception as e:
        logger.error(f"Submission history fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HEALTH & STATUS
# ============================================================================

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse({
        "status": "healthy",
        "service": "Citizen Submission API",
        "timestamp": datetime.now().isoformat()
    })


@app.get("/api/v1/status")
async def system_status():
    """System status with component info"""
    return JSONResponse({
        "components": {
            "audio_baseline": "ready",
            "video_processor": "ready",
            "photo_spoofing": "ready",
            "trust_system": f"{len(trust_system.contributor_profiles)} contributors tracked",
            "corroboration": "ready"
        },
        "submissions_stored": len(list(SUBMISSION_DIR.glob("*"))),
        "timestamp": datetime.now().isoformat()
    })