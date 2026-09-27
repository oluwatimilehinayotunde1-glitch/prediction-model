"""
Exports the trained model + dataset into the JSON files the React
dashboard (src/data/*.json) reads at build time.

Run this AFTER train_pipeline.py (it loads the bundle.pkl that produces).

    python export_web_bundle.py --data dataset/eksu_student_survey.csv \
        --bundle interface/bundle.pkl --out-dir src/data

Why this exists as a separate script rather than being folded into
train_pipeline.py: train_pipeline.py's job is "train a model and save a
bundle" for the Streamlit apps, which is the deliverable the project
report describes. This script's job is purely a presentation-layer
concern (shaping data for the web dashboard), so it's kept separate.
"""

import argparse
import json

import joblib
import numpy as np
import pandas as pd

from train_pipeline import CONFIG, build_target, cross_validate_candidates, load_data, preprocess


def main():
    parser = argparse.ArgumentParser(description="Export bundle.pkl + dataset to web JSON.")
    parser.add_argument("--data", default="dataset/eksu_student_survey.csv")
    parser.add_argument("--bundle", default="interface/bundle.pkl")
    parser.add_argument("--out-dir", default="src/data")
    args = parser.parse_args()

    bundle = joblib.load(args.bundle)
    scaler = bundle["scaler"]
    label_encoder = bundle["label_encoder"]
    feature_columns = bundle["feature_columns"]
    metrics = bundle["metrics"]
    all_models = bundle["all_models"]
    offline_best_name = bundle["best_model_name"]

    # The React dashboard (src/lib/predict.ts) only ports Logistic
    # Regression's math to JS (weights baked into model.json). Rather than
    # silently showing one model's picks in the batch cohort table
    # (computed here in Python with the true best model) and a DIFFERENT
    # model's picks in the live single-prediction form (computed in the
    # browser with LR math), the web bundle always deploys Logistic
    # Regression end-to-end so the two stay consistent. The other 3
    # candidates (including the offline best-by-F1 model) still show up
    # in the metrics/model-comparison tab for reference.
    best_name = "Logistic Regression"
    if offline_best_name != best_name:
        print(
            f"NOTE: offline best model by F1 is '{offline_best_name}', but the web "
            f"bundle deploys '{best_name}' everywhere (cohort table + live predictor) "
            "since that's the only model ported to browser JS. Metrics for all 4 "
            "models are still included for the comparison tab."
        )
    lr_model = all_models[best_name]

    df = load_data(args.data, sep=CONFIG["csv_sep"])
    X, y, _, _, _ = preprocess(df, CONFIG)

    # Same CV methodology (folds, random_state) as train_pipeline.py's
    # Table 4.1 numbers, so the web dashboard's fold chart and the written
    # report never disagree on how cross-validation was run.
    cv_results = cross_validate_candidates(X, y, CONFIG)
    folds_for_chart = {
        name: {"accuracy": cv["per_fold"]["accuracy"], "f1": cv["per_fold"]["f1_score"]}
        for name, cv in cv_results.items()
    }

    # ---------------- model.json ----------------
    model_json = {
        "bestModel": best_name,
        "featureColumns": feature_columns,
        "classes": list(label_encoder.classes_),
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "coef": lr_model.coef_.tolist(),
        "intercept": lr_model.intercept_.tolist(),
        "metrics": {
            name: {k: v for k, v in m.items() if k not in ("confusion_matrix", "classification_report")}
            for name, m in metrics.items()
        },
        "cvSummary": {
            name: {k: v for k, v in cv.items() if k != "per_fold"} for name, cv in cv_results.items()
        },
        "folds": folds_for_chart,
    }

    # ---------------- cohort.json ----------------
    y_raw = build_target(df, CONFIG)
    df_valid = df[y_raw.notna()].reset_index(drop=True)
    X_valid = df_valid[feature_columns].copy()

    ordinal_maps = CONFIG["ordinal_maps"]
    for col in X_valid.columns:
        if col in ordinal_maps:
            X_valid[col] = X_valid[col].astype(str).str.strip().map(ordinal_maps[col])
        elif not pd.api.types.is_numeric_dtype(X_valid[col]):
            X_valid[col] = pd.to_numeric(X_valid[col], errors="coerce")
    X_valid = X_valid.fillna(X_valid.median(numeric_only=True))

    X_scaled = scaler.transform(X_valid[feature_columns])
    deployed_model = all_models[best_name]
    preds = deployed_model.predict(X_scaled)
    pred_labels = label_encoder.inverse_transform(preds)
    probs = (
        deployed_model.predict_proba(X_scaled).max(axis=1)
        if hasattr(deployed_model, "predict_proba")
        else np.full(len(preds), np.nan)
    )

    cohort = []
    for i, row in df_valid.iterrows():
        cohort.append(
            {
                "id": f"EKSU/SVY/{i + 1:02d}",
                "level": row["level"],
                "cgpa": round(float(row["cgpa"]), 2),
                "attendancePct": row["attendance_pct"],
                "carryoverCourses": int(row["carryover_courses"]),
                "studyHoursPerWeek": row["study_hours_per_week"],
                "submitsOnTime": row["submits_on_time"],
                "hasStudyResources": row["has_study_resources"],
                "hasMajorCommitment": row["has_major_commitment"],
                "band": pred_labels[i],
                "probability": round(float(probs[i]), 4) if not np.isnan(probs[i]) else None,
            }
        )

    with open(f"{args.out_dir}/model.json", "w") as f:
        json.dump(model_json, f, indent=1)
    with open(f"{args.out_dir}/cohort.json", "w") as f:
        json.dump(cohort, f, indent=1)

    print(f"Wrote {args.out_dir}/model.json and {args.out_dir}/cohort.json")
    print(f"Deployed model exported to web: {best_name}")
    print(f"Classes: {list(label_encoder.classes_)}")


if __name__ == "__main__":
    main()
