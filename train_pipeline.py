
import argparse
import json
import warnings

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import KFold, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

warnings.filterwarnings("ignore")

# ============================================================================
# CONFIG — matches dataset/eksu_student_survey.csv (self-collected EKSU
# student survey, Google-Forms export). Comma-delimited. There is no
# ready-made final grade in this dataset — the label is derived from
# self-reported CGPA (0.00-5.00 scale, standard Nigerian university
# classification) using the official band boundaries.
#
# Several feature columns are ORDINAL categories exported as text (e.g.
# "70-89%", "11-20 hours") rather than numbers, so they're mapped to an
# ordinal scale in `preprocess()` via ORDINAL_MAPS below before scaling.
# ============================================================================
ORDINAL_MAPS = {
    "level": {"100 Level": 1, "200 Level": 2, "300 Level": 3, "400 Level": 4, "500 Level": 5},
    "attendance_pct": {"Below 50%": 1, "50-69%": 2, "70-89%": 3, "90-100%": 4},
    "study_hours_per_week": {
        "Less than 5 hours": 1, "5-10 hours": 2, "11-20 hours": 3, "More than 20 hours": 4
    },
    "submits_on_time": {"Never": 1, "Rarely": 2, "Sometimes": 3, "Often": 4, "Always": 5},
    "has_study_resources": {"No": 0, "Partially": 1, "Yes": 2},
    "has_major_commitment": {"No": 0, "Yes": 1},
}

CONFIG = {
    "csv_sep": ",",
    "feature_columns": [
        "level",                 # class level (100-500) — ordinal
        "attendance_pct",        # attendance bracket — ordinal, early signal
        "carryover_courses",     # number of carried-over courses (numeric)
        "study_hours_per_week",  # weekly study time bracket — ordinal
        "submits_on_time",       # assignment submission habit — ordinal
        "has_study_resources",   # access to study resources — ordinal
        "has_major_commitment",  # job/family/other major commitment (yes/no)
    ],
    "ordinal_maps": ORDINAL_MAPS,
    "target_column": "final_grade",
    # Derive the performance class from self-reported CGPA (0.00-5.00 scale)
    # using a 5-tier qualitative rating (custom bands, not the standard
    # Nigerian degree classification):
    # Excellent(4.50-5.00) Good(3.50-4.49) Satisfactory(2.50-3.49)
    # Sufficient(1.50-2.49) Fail(below 1.50)
    "derive_target_from_score": True,
    "score_column_for_derivation": "cgpa",
    "score_bins": [-0.01, 1.49, 2.49, 3.49, 4.49, 5.00],
    "score_labels": [
        "Fail", "Sufficient", "Satisfactory", "Good", "Excellent",
    ],
    "test_size": 0.2,
    "random_state": 42,
    # A single 80/20 split is only ~15 test rows on this dataset, so one
    # misclassified case swings accuracy by several points. Cross-validation
    # is reported alongside the held-out split as the primary robustness
    # check. Not stratified: the rarest class (Fail) currently has only 1
    # sample, so StratifiedKFold isn't possible — plain shuffled KFold is
    # used instead, which means a given fold's test portion can end up with
    # zero examples of a rare class. This is a real limitation of the
    # dataset size, not a bug in the CV code.
    "cv_folds": 5,
}
# ============================================================================


def load_data(path: str, sep: str = ",") -> pd.DataFrame:
    df = pd.read_csv(path, sep=sep)
    df.columns = [c.strip() for c in df.columns]
    # Strip stray quotes from string cells that some UCI CSVs wrap in quotes
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].astype(str).str.strip().str.strip('"')
    return df


def build_target(df: pd.DataFrame, cfg: dict) -> pd.Series:
    if cfg["derive_target_from_score"]:
        col = cfg["score_column_for_derivation"]
        if col not in df.columns:
            raise ValueError(
                f"score_column_for_derivation='{col}' not found in dataset columns: {list(df.columns)}"
            )
        return pd.cut(df[col], bins=cfg["score_bins"], labels=cfg["score_labels"], include_lowest=True)
    else:
        target = cfg["target_column"]
        if target not in df.columns:
            raise ValueError(f"target_column='{target}' not found in dataset columns: {list(df.columns)}")
        return df[target]


def preprocess(df: pd.DataFrame, cfg: dict):
    missing = [c for c in cfg["feature_columns"] if c not in df.columns]
    if missing:
        raise ValueError(
            f"Missing expected feature columns {missing}. "
            f"Available columns: {list(df.columns)}. Update CONFIG['feature_columns']."
        )

    X = df[cfg["feature_columns"]].copy()

    ordinal_maps = cfg.get("ordinal_maps", {})
    yes_no_map = {"yes": 1, "no": 0}
    for col in X.columns:
        if pd.api.types.is_numeric_dtype(X[col]):
            continue
        if col in ordinal_maps:
            X[col] = X[col].astype(str).str.strip().map(ordinal_maps[col])
            continue
        values = set(X[col].dropna().astype(str).str.lower().unique())
        if values and values <= set(yes_no_map):
            X[col] = X[col].astype(str).str.lower().map(yes_no_map)
        else:
            X[col] = pd.to_numeric(X[col], errors="coerce")

    X = X.fillna(X.median(numeric_only=True))

    y_raw = build_target(df, cfg)
    valid_mask = y_raw.notna()
    X, y_raw = X[valid_mask], y_raw[valid_mask]

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw.astype(str))

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, scaler, label_encoder, list(X.columns)


def build_candidates(random_state: int) -> dict:
    """Single source of truth for the 4 candidate model constructors, so
    train_pipeline.py and export_web_bundle.py never drift out of sync."""
    return {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=random_state),
        "Decision Tree": DecisionTreeClassifier(random_state=random_state),
        "Random Forest": RandomForestClassifier(n_estimators=200, random_state=random_state),
        "SVM": SVC(probability=True, random_state=random_state),
    }


def cross_validate_candidates(X, y, cfg: dict) -> dict:
    """K-fold CV for every candidate. Returns per-fold raw values (for
    charting fold-by-fold in the web dashboard) plus mean/std summaries
    (for the written report's Table 4.1). This is the headline robustness
    number — a single train/test split on a dataset this small is too
    noisy to report alone (see CONFIG['cv_folds'] comment)."""
    n_splits = cfg["cv_folds"]
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=cfg["random_state"])

    per_fold = {name: {"accuracy": [], "precision": [], "recall": [], "f1_score": []}
                for name in build_candidates(cfg["random_state"])}

    for train_idx, test_idx in kf.split(X):
        candidates = build_candidates(cfg["random_state"])
        for name, model in candidates.items():
            model.fit(X[train_idx], y[train_idx])
            preds = model.predict(X[test_idx])
            per_fold[name]["accuracy"].append(round(float(accuracy_score(y[test_idx], preds)), 4))
            per_fold[name]["precision"].append(
                round(float(precision_score(y[test_idx], preds, average="weighted", zero_division=0)), 4)
            )
            per_fold[name]["recall"].append(
                round(float(recall_score(y[test_idx], preds, average="weighted", zero_division=0)), 4)
            )
            per_fold[name]["f1_score"].append(
                round(float(f1_score(y[test_idx], preds, average="weighted", zero_division=0)), 4)
            )

    cv_summary = {}
    for name, metrics in per_fold.items():
        cv_summary[name] = {"per_fold": metrics}
        for metric_name, values in metrics.items():
            cv_summary[name][f"{metric_name}_mean"] = round(float(np.mean(values)), 4)
            cv_summary[name][f"{metric_name}_std"] = round(float(np.std(values)), 4)
    return cv_summary


def train_and_evaluate(X_train, X_test, y_train, y_test, random_state: int):
    candidates = build_candidates(random_state)

    results = {}
    trained_models = {}

    for name, model in candidates.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)

        results[name] = {
            "accuracy": round(accuracy_score(y_test, preds), 4),
            "precision": round(precision_score(y_test, preds, average="weighted", zero_division=0), 4),
            "recall": round(recall_score(y_test, preds, average="weighted", zero_division=0), 4),
            "f1_score": round(f1_score(y_test, preds, average="weighted", zero_division=0), 4),
            "confusion_matrix": confusion_matrix(y_test, preds).tolist(),
            "classification_report": classification_report(y_test, preds, zero_division=0),
        }
        trained_models[name] = model
        print(f"\n{name}")
        print(f"  Accuracy : {results[name]['accuracy']}")
        print(f"  Precision: {results[name]['precision']}")
        print(f"  Recall   : {results[name]['recall']}")
        print(f"  F1-score : {results[name]['f1_score']}")

    best_name = max(results, key=lambda n: results[n]["f1_score"])
    return trained_models, results, best_name


def main():
    parser = argparse.ArgumentParser(description="Train student performance prediction models.")
    parser.add_argument("--data", required=True, help="Path to the dataset CSV file.")
    parser.add_argument("--out", default="bundle.pkl", help="Output path for the model bundle.")
    args = parser.parse_args()

    df = load_data(args.data, sep=CONFIG["csv_sep"])
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    X, y, scaler, label_encoder, feature_columns = preprocess(df, CONFIG)

    class_counts = pd.Series(y).value_counts()
    print(f"\nClass distribution ({dict(zip(label_encoder.classes_, [class_counts.get(i, 0) for i in range(len(label_encoder.classes_))]))})")

    can_stratify = class_counts.min() >= 2
    if not can_stratify:
        print(
            "WARNING: at least one class has fewer than 2 samples — "
            "cannot stratify the split with a dataset this small. "
            "Falling back to a plain random 80/20 split."
        )
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=CONFIG["test_size"],
        random_state=CONFIG["random_state"],
        stratify=y if can_stratify else None,
    )

    trained_models, results, best_name = train_and_evaluate(
        X_train, X_test, y_train, y_test, CONFIG["random_state"]
    )

    print(f"\nBest model: {best_name} (F1-score = {results[best_name]['f1_score']})")

    print(f"\n{CONFIG['cv_folds']}-fold cross-validation (shuffled, not stratified):")
    cv_results = cross_validate_candidates(X, y, CONFIG)
    for name, cv in cv_results.items():
        print(f"\n{name}")
        print(f"  Accuracy : {cv['accuracy_mean']} (+/- {cv['accuracy_std']})")
        print(f"  Precision: {cv['precision_mean']} (+/- {cv['precision_std']})")
        print(f"  Recall   : {cv['recall_mean']} (+/- {cv['recall_std']})")
        print(f"  F1-score : {cv['f1_score_mean']} (+/- {cv['f1_score_std']})")

    # Save exactly which rows landed in the 20% test split, with their
    # derived class, so it's inspectable rather than needing to be
    # recomputed after the fact.
    y_raw_full = build_target(df, CONFIG)
    df_valid = df[y_raw_full.notna()].reset_index(drop=True)
    idx_train, idx_test = train_test_split(
        list(range(len(df_valid))),
        test_size=CONFIG["test_size"],
        random_state=CONFIG["random_state"],
        stratify=y if can_stratify else None,
    )
    test_split_df = df_valid.iloc[idx_test].copy()
    test_split_df["derived_class"] = label_encoder.inverse_transform(y_test)
    test_split_df.to_csv("test_split.csv", index=False)
    print(f"Saved test_split.csv ({len(idx_test)} rows)")

    bundle = {
        "best_model_name": best_name,
        "model": trained_models[best_name],
        "all_models": trained_models,
        "scaler": scaler,
        "label_encoder": label_encoder,
        "feature_columns": feature_columns,
        "class_labels": list(label_encoder.classes_),
        "metrics": results,
        "cv_metrics": cv_results,
        "config": CONFIG,
    }

    joblib.dump(bundle, args.out)
    print(f"\nSaved model bundle to: {args.out}")

    with open("metrics_summary.json", "w") as f:
        summary = {
            name: {
                **{k: v for k, v in m.items() if k not in ("confusion_matrix", "classification_report")},
                "cv": cv_results[name],
            }
            for name, m in results.items()
        }
        json.dump(summary, f, indent=2)
    print("Saved metrics_summary.json")


if __name__ == "__main__":
    main()
