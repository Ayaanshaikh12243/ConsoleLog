import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import io
from PIL import Image
import traceback
from google import genai
from google.genai import types
import pathlib
import json
from datetime import datetime
from dotenv import load_dotenv

# --- CONFIG ---
# Load .env from backend directory
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)
# Use gemini-flash-latest which is verified working with this key
MODEL_ID = "gemini-flash-latest"

SYSTEM_PROMPT = """
You are SENTINEL, an expert AI disaster analyst for infrastructure monitoring.
You analyze disaster reports and provide structured, actionable intelligence.

When given a disaster report, you MUST respond ONLY in valid JSON with this exact structure:
{
  "summary": "2-3 sentence plain English summary of the disaster",
  "disaster_type": "one of: cyclone / earthquake / flood / wildfire / infrastructure_failure / unknown",
  "severity": "one of: low / medium / high / critical",
  "severity_score": <number 1-10>,
  "affected_area": "location or region name",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "infrastructure_risk": {
    "roads": "none / low / medium / high / critical",
    "bridges": "none / low / medium / high / critical",
    "water_systems": "none / low / medium / high / critical",
    "power_grid": "none / low / medium / high / critical",
    "buildings": "none / low / medium / high / critical"
  },
  "immediate_actions": ["action 1", "action 2", "action 3"],
  "sentinel_signal": "elevate / monitor / discard",
  "confidence": <number 0.0-1.0>
}
Do not include any text outside the JSON block.
"""

MOCK_RESPONSE = {
  "summary": "MOCK ANALYSIS: Severe localized impact observed with multiple infrastructure compromise points.",
  "disaster_type": "unknown",
  "severity": "critical",
  "severity_score": 8,
  "affected_area": "Region Alpha",
  "key_findings": [
    "Primary road access blocked by debris.",
    "Power outages detected in residential zones.",
    "Communication networks operating at 40% capacity."
  ],
  "infrastructure_risk": {
    "roads": "critical",
    "bridges": "medium",
    "water_systems": "high",
    "power_grid": "critical",
    "buildings": "high"
  },
  "immediate_actions": [
    "Dispatch emergency clearing vehicles to main transit arteries.",
    "Establish satellite communication hubs.",
    "Deploy mobile power units to critical medical facilities."
  ],
  "sentinel_signal": "elevate",
  "confidence": 0.88
}

app = Flask(__name__)
CORS(app)

# Load model once at startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), "disaster_model.keras")
model = load_model(MODEL_PATH)

CLASS_LABELS = ['cyclone', 'earthquake', 'flood', 'wildfire']
IMG_SIZE = (150, 150)


def preprocess_image(img_bytes):
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "SENTINEL disaster classifier is running"})


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send image as form-data with key 'file'"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    allowed = {"png", "jpg", "jpeg", "webp"}
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        return jsonify({"error": f"Unsupported file type: {ext}. Use png/jpg/jpeg/webp"}), 400

    try:
        img_bytes = file.read()
        arr = preprocess_image(img_bytes)

        preds = model.predict(arr, verbose=0)[0]

        label = CLASS_LABELS[np.argmax(preds)]
        confidence = float(np.max(preds)) * 100

        all_probs = {cls: round(float(prob) * 100, 2) for cls, prob in zip(CLASS_LABELS, preds)}

        return jsonify({
            "prediction": label,
            "confidence": round(confidence, 2),
            "all_probabilities": all_probs
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/predict-url", methods=["POST"])
def predict_url():
    """Alternative: predict from image URL"""
    import requests as req

    data = request.get_json()
    if not data or "url" not in data:
        return jsonify({"error": "Send JSON body with key 'url'"}), 400

    try:
        response = req.get(data["url"], timeout=10)
        arr = preprocess_image(response.content)

        preds = model.predict(arr, verbose=0)[0]
        label = CLASS_LABELS[np.argmax(preds)]
        confidence = float(np.max(preds)) * 100
        all_probs = {cls: round(float(prob) * 100, 2) for cls, prob in zip(CLASS_LABELS, preds)}

        return jsonify({
            "prediction": label,
            "confidence": round(confidence, 2),
            "all_probabilities": all_probs
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# --- SENTINEL REPORT ANALYZER ENDPOINTS ---

def parse_gemini_json(text):
    raw = text.strip().lstrip("```json").rstrip("```").strip()
    return json.loads(raw)

@app.route("/analyze-report", methods=["POST"])
def analyze_report():
    data = request.get_json()
    if not data or "report_text" not in data:
        return jsonify({"error": "Send JSON body with 'report_text'"}), 400

    try:
        prompt = f"{SYSTEM_PROMPT}\n\nREPORT:\n{data['report_text']}"
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
        result = parse_gemini_json(response.text)
        result["generated_at"] = datetime.utcnow().isoformat()
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        print("Falling back to MOCK response due to API Error.")
        mock = dict(MOCK_RESPONSE)
        mock["generated_at"] = datetime.utcnow().isoformat()
        mock["summary"] = f"MOCK OFFLINE ANALYSIS: {data.get('report_text', '')[:100]}..."
        return jsonify(mock)

@app.route("/analyze-document", methods=["POST"])
def analyze_document():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    report_text = request.form.get("report_text", "No additional text provided.")

    file_path = None
    try:
        # Save temp file
        temp_dir = os.path.join(os.path.dirname(__file__), "temp")
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, file.filename)
        file.save(file_path)

        path = pathlib.Path(file_path)
        
        if path.suffix.lower() == ".pdf":
            # For the new SDK, we can pass the path directly or use upload_file
            # But simple text extraction or sending as part of prompt works too.
            # Using media support in new SDK:
            with open(file_path, "rb") as f:
                pdf_data = f.read()
            
            prompt = f"{SYSTEM_PROMPT}\n\nREPORT TEXT:\n{report_text}\n\nAnalyze the disaster report in the attached PDF."
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=[
                    types.Part.from_bytes(data=pdf_data, mime_type="application/pdf"),
                    prompt
                ]
            )
        elif path.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]:
            with open(file_path, "rb") as f:
                img_data = f.read()
            
            prompt = f"{SYSTEM_PROMPT}\n\nREPORT TEXT:\n{report_text}\n\nAnalyze the disaster image and text above."
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=[
                    types.Part.from_bytes(data=img_data, mime_type="image/jpeg"), # handles most images
                    prompt
                ]
            )
        else:
            # Fallback to reading as text
            content = path.read_text(encoding="utf-8", errors="ignore")
            prompt = f"{SYSTEM_PROMPT}\n\nREPORT:\n{content}"
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=prompt
            )

        result = parse_gemini_json(response.text)
        result["generated_at"] = datetime.utcnow().isoformat()
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        print("Falling back to MOCK response due to API Error.")
        mock = dict(MOCK_RESPONSE)
        mock["generated_at"] = datetime.utcnow().isoformat()
        mock["summary"] = "MOCK OFFLINE ANALYSIS: Image/PDF analyzed with visual compromise detection."
        return jsonify(mock)
    finally:
        # Cleanup
        if file_path and os.path.exists(file_path):
            os.remove(file_path)


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5050)
