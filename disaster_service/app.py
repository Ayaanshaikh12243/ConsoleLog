from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import os
import io
from PIL import Image
import traceback

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


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
