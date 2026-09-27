"""
Flask API for the Machine Learning Approach for Early Prediction
of Students' Academic Performance project.

Run locally with:
    python app.py

Expects a bundle.pkl (produced by train_pipeline.py) in the same folder.

Endpoints:
    GET  /health           -> simple check that the API and model are up
    POST /predict          -> single prediction, JSON body of {feature: value, ...}
    POST /predict_batch    -> batch prediction, JSON body of {"rows": [ {feature: value, ...}, ... ]}
"""

import os

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows your React app (on a different domain) to call this API

BUNDLE_PATH = "bundle.pkl"
_bundle = None  # loaded once, lazily, and cached


def get_bundle():
    global _bundle
    if _bundle is None:
        if not os.path.exists(BUNDLE_PATH):
            raise FileNotFoundError(
                f"{BUNDLE_PATH} not found. Run train_pipeline.py first to generate it."
            )
        _bundle = joblib.load(BUNDLE_PATH)
    return _bundle


def prepare_features(row: dict, feature_columns: list) -> pd.DataFrame:
    """Build a single-row DataFrame in the exact column order the model expects."""
    missing = [c for c in feature_columns if c not in row]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")
    ordered = {c: row[c] for c in feature_columns}
    return pd.DataFrame([ordered])


@app.route("/health", methods=["GET"])
def health():
    try:
        bundle = get_bundle()
        return jsonify({
            "status": "ok",
            "model": bundle["best_model_name"],
            "features_expected": bundle["feature_columns"],
        })
    except FileNotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/predict", methods=["POST"])
def predict():
    try:
        bundle = get_bundle()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON with feature values."}), 400

    model = bundle["model"]
    scaler = bundle["scaler"]
    label_encoder = bundle["label_encoder"]
    feature_columns = bundle["feature_columns"]

    try:
        X_input = prepare_features(data, feature_columns)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    X_scaled = scaler.transform(X_input)
    prediction = model.predict(X_scaled)[0]
    predicted_label = label_encoder.inverse_transform([prediction])[0]

    response = {"prediction": predicted_label}

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X_scaled)[0]
        response["probabilities"] = {
            cls: float(p) for cls, p in zip(label_encoder.classes_, proba)
        }

    return jsonify(response)


@app.route("/predict_batch", methods=["POST"])
def predict_batch():
    try:
        bundle = get_bundle()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500

    data = request.get_json(silent=True)
    if not data or "rows" not in data or not isinstance(data["rows"], list):
        return jsonify({"error": "Request body must be JSON: {\"rows\": [ {feature: value, ...}, ... ]}"}), 400

    model = bundle["model"]
    scaler = bundle["scaler"]
    label_encoder = bundle["label_encoder"]
    feature_columns = bundle["feature_columns"]

    batch_df = pd.DataFrame(data["rows"])
    missing = [c for c in feature_columns if c not in batch_df.columns]
    if missing:
        return jsonify({"error": f"Rows are missing required fields: {missing}"}), 400

    X_batch = batch_df[feature_columns].apply(pd.to_numeric, errors="coerce")
    X_batch = X_batch.fillna(X_batch.median(numeric_only=True))
    X_batch_scaled = scaler.transform(X_batch)

    preds = model.predict(X_batch_scaled)
    labels = label_encoder.inverse_transform(preds)

    return jsonify({"predictions": labels.tolist()})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)