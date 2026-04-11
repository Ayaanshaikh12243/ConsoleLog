"""
STRATUM MongoDB Service — Async persistence layer using Motor.
Stores: cell intelligence snapshots, upload analysis records, scan history.
"""
import motor.motor_asyncio
from datetime import datetime

MONGO_URL = "mongodb+srv://airavat:ved1234@airavat.d0onbah.mongodb.net/?appName=Airavat"
DB_NAME = "stratum"

_client = None
_db = None

async def get_db():
    global _client, _db
    if _db is None:
        _client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGO_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        _db = _client[DB_NAME]
        # Create indexes for fast lookups
        try:
            await _db.cells.create_index("cell_id", unique=True)
            await _db.cells.create_index("timestamp")
            await _db.uploads.create_index("timestamp")
            await _db.scans.create_index("timestamp")
            print("✅ MongoDB connected — STRATUM database ready")
        except Exception as e:
            print(f"⚠️  MongoDB index creation: {e}")
    return _db


async def upsert_cell(cell_id: str, data: dict):
    """Save/update a cell intelligence record to MongoDB."""
    try:
        db = await get_db()
        doc = {
            "cell_id": cell_id,
            "lat": data.get("lat"),
            "lng": data.get("lng"),
            "risk": data.get("risk"),
            "status": data.get("status"),
            "cause": data.get("cause"),
            "ai_report": data.get("ai_report"),
            "nasa": data.get("nasa"),
            "seismic": data.get("seismic"),
            "anomaly": data.get("anomaly"),
            "timestamp": datetime.utcnow()
        }
        await db.cells.replace_one(
            {"cell_id": cell_id},
            doc,
            upsert=True
        )
    except Exception as e:
        print(f"MongoDB upsert_cell error: {e}")


async def get_cell_history_from_db(cell_id: str, limit: int = 30):
    """Fetch historical risk snapshots for a cell from MongoDB."""
    try:
        db = await get_db()
        # Look in scan_history collection for time-series data
        cursor = db.scan_history.find(
            {"cell_id": cell_id},
            {"_id": 0, "risk": 1, "timestamp": 1, "nasa": 1}
        ).sort("timestamp", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        # Reverse so oldest first for charting
        docs.reverse()
        return docs
    except Exception as e:
        print(f"MongoDB get_cell_history error: {e}")
        return []


async def save_scan_point(cell_id: str, risk: float, nasa: dict, seismic: dict):
    """Append a time-series point for a cell (for trending/charting)."""
    try:
        db = await get_db()
        await db.scan_history.insert_one({
            "cell_id": cell_id,
            "risk": risk,
            "rainfall": nasa.get("rainfall", 0) if nasa else 0,
            "temp": nasa.get("temp", 0) if nasa else 0,
            "humidity": nasa.get("humidity", 0) if nasa else 0,
            "seismic_mag": seismic.get("mag", 0) if seismic else 0,
            "timestamp": datetime.utcnow()
        })
    except Exception as e:
        print(f"MongoDB save_scan_point error: {e}")


async def save_upload(filename: str, analysis: str, prediction: str):
    """Persist an upload analysis result to MongoDB."""
    try:
        db = await get_db()
        doc = {
            "filename": filename,
            "analysis": analysis,
            "prediction": prediction,
            "timestamp": datetime.utcnow()
        }
        result = await db.uploads.insert_one(doc)
        return str(result.inserted_id)
    except Exception as e:
        print(f"MongoDB save_upload error: {e}")
        return None


async def get_recent_uploads(limit: int = 10):
    """Fetch recent upload analysis records."""
    try:
        db = await get_db()
        cursor = db.uploads.find(
            {},
            {"_id": 1, "filename": 1, "analysis": 1, "prediction": 1, "timestamp": 1}
        ).sort("timestamp", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        for d in docs:
            d["id"] = str(d.pop("_id"))
            d["timestamp"] = d["timestamp"].isoformat()
        return docs
    except Exception as e:
        print(f"MongoDB get_recent_uploads error: {e}")
        return []


async def get_all_cells_summary():
    """Get a summary of all monitored cells from MongoDB."""
    try:
        db = await get_db()
        cursor = db.cells.find(
            {},
            {"_id": 0, "cell_id": 1, "lat": 1, "lng": 1, "risk": 1, "status": 1, "timestamp": 1}
        ).sort("risk", -1).limit(100)
        return await cursor.to_list(length=100)
    except Exception as e:
        print(f"MongoDB get_all_cells error: {e}")
        return []

async def save_alert(alert_data: dict):
    """Save a predictive alert to MongoDB."""
    try:
        db = await get_db()
        doc = {
            "cell_id": alert_data.get("cell"),
            "location": alert_data.get("location", "Unknown Sector"),
            "risk": alert_data.get("risk"),
            "status": alert_data.get("status"),
            "message": alert_data.get("message"),
            "trigger": alert_data.get("trigger", "Environmental Anomaly"),
            "timestamp": datetime.fromisoformat(alert_data.get("time")) if isinstance(alert_data.get("time"), str) else datetime.utcnow()
        }
        await db.alerts.insert_one(doc)
    except Exception as e:
        print(f"MongoDB save_alert error: {e}")

async def get_all_alerts_from_db(limit: int = 50):
    """Fetch predictive alerts from MongoDB."""
    try:
        db = await get_db()
        cursor = db.alerts.find({}).sort("timestamp", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        # Format for frontend
        for d in docs:
            d["id"] = str(d.pop("_id"))
            d["cell"] = d.get("cell_id")
            d["time"] = d.get("timestamp").isoformat() if d.get("timestamp") else datetime.now().isoformat()
        return docs
    except Exception as e:
        print(f"MongoDB get_all_alerts error: {e}")
        return []

async def delete_alert_from_db(alert_id: str):
    """Remove an alert from MongoDB by its hex ID string."""
    try:
        from bson import ObjectId
        db = await get_db()
        await db.alerts.delete_one({"_id": ObjectId(alert_id)})
        return True
    except Exception as e:
        print(f"MongoDB delete_alert error: {e}")
        return False
