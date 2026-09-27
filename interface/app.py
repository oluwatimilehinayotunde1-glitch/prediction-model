
import joblib
import numpy as np
import pandas as pd
import streamlit as st

from theme import apply_theme, top_bar, hero_and_stats, render_result

st.set_page_config(
    page_title="Academic Performance Prediction System",
    page_icon="📊",
    layout="wide",
)

apply_theme()


@st.cache_resource
def load_bundle(path="bundle.pkl"):
    return joblib.load(path)


def main():
    try:
        bundle = load_bundle()
    except FileNotFoundError:
        st.error(
            "bundle.pkl not found. Run `python train_pipeline.py --data your_dataset.csv` "
            "first to train the models and generate the bundle."
        )
        st.stop()

    model = bundle["model"]
    scaler = bundle["scaler"]
    label_encoder = bundle["label_encoder"]
    feature_columns = bundle["feature_columns"]
    best_model_name = bundle["best_model_name"]
    metrics = bundle["metrics"]

    top_bar(best_model_name)
    hero_and_stats(best_model_name, metrics, feature_columns, len(label_encoder.classes_))

    # ---------------- Tabs ----------------
    tab1, tab2, tab3 = st.tabs(["Predict", "Batch Prediction", "Model Performance"])

    # ---------------- Single prediction ----------------
    with tab1:
        with st.container(border=True):
            st.markdown('<div class="section-eyebrow">Single Student</div>', unsafe_allow_html=True)
            st.markdown('<div class="section-title">Enter Student Information</div>', unsafe_allow_html=True)
            st.markdown(
                f'<div class="section-desc">Fill in the academic and support indicators below. '
                f'Prediction powered by {best_model_name}.</div>',
                unsafe_allow_html=True,
            )

            FIELD_SPECS = {
                "G1": ("slider", 0, 20, 10, "First-period grade (0-20)"),
                "G2": ("slider", 0, 20, 10, "Second-period grade (0-20)"),
                "studytime": ("slider", 1, 4, 2, "1=<2hrs, 2=2-5hrs, 3=5-10hrs, 4=>10hrs/week"),
                "failures": ("count", 0, None, 0, "Number of carryovers (CO) — courses failed and being repeated"),
                "absences": ("slider", 0, 93, 4, "Class attendance — number of classes missed"),
                "famsup": ("yesno", None, None, None, "Family educational support"),
                "schoolsup": ("yesno", None, None, None, "Extra educational support"),
                "higher": ("yesno", None, None, None, "Wants to pursue higher education"),
                "internet": ("yesno", None, None, None, "Internet access at home"),
            }

            # Custom display labels for fields whose column name doesn't
            # read well as a title-cased label, or that need a clearer
            # institution-facing term. Underlying feature columns
            # (failures, absences, ...) are unchanged, so the trained
            # model's expected input names stay the same.
            DISPLAY_LABELS = {
                "failures": "Carryovers (CO)",
                "absences": "Absences (Class Attendance)",
            }

            academic_keys = ["G1", "G2", "studytime", "failures", "absences"]
            support_keys = ["famsup", "schoolsup", "higher", "internet"]

            input_values = {}

            academic_feats = [f for f in feature_columns if f in academic_keys]
            support_feats = [f for f in feature_columns if f in support_keys]
            other_feats = [f for f in feature_columns if f not in academic_keys + support_keys]

            def render_field(feature):
                spec = FIELD_SPECS.get(feature, ("number", 0, 100, 50, ""))
                kind, lo, hi, default, help_text = spec
                label = DISPLAY_LABELS.get(feature, feature.replace("_", " ").title())
                if kind == "yesno":
                    choice = st.selectbox(label, ["No", "Yes"], help=help_text, key=f"in_{feature}")
                    input_values[feature] = 1 if choice == "Yes" else 0
                elif kind == "slider":
                    input_values[feature] = st.slider(label, lo, hi, default, help=help_text, key=f"in_{feature}")
                elif kind == "count":
                    # Open-ended integer input — no artificial cap, so
                    # institutions where more than 4 failures is possible
                    # aren't boxed in by a slider's max value.
                    input_values[feature] = st.number_input(
                        label, min_value=int(lo), value=int(default), step=1,
                        help=help_text, key=f"in_{feature}"
                    )
                else:
                    input_values[feature] = st.number_input(
                        label, min_value=float(lo), max_value=float(hi),
                        value=float(default), key=f"in_{feature}"
                    )

            if academic_feats:
                st.markdown('<div class="group-label">Academic Information</div>', unsafe_allow_html=True)
                cols = st.columns(2)
                for i, f in enumerate(academic_feats):
                    with cols[i % 2]:
                        render_field(f)

            if support_feats:
                st.markdown('<div class="group-label" style="margin-top:20px;">Support & Environment</div>', unsafe_allow_html=True)
                cols = st.columns(2)
                for i, f in enumerate(support_feats):
                    with cols[i % 2]:
                        render_field(f)

            if other_feats:
                st.markdown('<div class="group-label" style="margin-top:20px;">Additional</div>', unsafe_allow_html=True)
                cols = st.columns(2)
                for i, f in enumerate(other_feats):
                    with cols[i % 2]:
                        render_field(f)

            st.markdown('<div style="margin-top:20px;"></div>', unsafe_allow_html=True)
            if st.button("Predict Performance", type="primary"):
                X_input = pd.DataFrame([input_values])[feature_columns]
                X_scaled = scaler.transform(X_input)

                prediction = model.predict(X_scaled)[0]
                predicted_label = label_encoder.inverse_transform([prediction])[0]

                proba = None
                if hasattr(model, "predict_proba"):
                    proba = model.predict_proba(X_scaled)[0]

                render_result(predicted_label, proba, label_encoder.classes_)

    # ---------------- Batch prediction ----------------
    with tab2:
        with st.container(border=True):
            st.markdown('<div class="section-eyebrow">Multiple Students</div>', unsafe_allow_html=True)
            st.markdown('<div class="section-title">Batch Prediction from CSV</div>', unsafe_allow_html=True)
            st.markdown(
                f'<div class="section-desc">Upload a CSV containing the required columns: '
                f'<code style="color:#3B82F6;">{", ".join(feature_columns)}</code></div>',
                unsafe_allow_html=True,
            )

            uploaded = st.file_uploader("Choose a CSV file", type="csv")

            if uploaded is not None:
                batch_df = pd.read_csv(uploaded)
                missing = [c for c in feature_columns if c not in batch_df.columns]
                if missing:
                    st.error(f"Uploaded file is missing required columns: {missing}")
                else:
                    X_batch = batch_df[feature_columns].copy()
                    yes_no_map = {"yes": 1, "no": 0}
                    for col in X_batch.columns:
                        if not pd.api.types.is_numeric_dtype(X_batch[col]):
                            vals = set(X_batch[col].dropna().astype(str).str.lower().unique())
                            if vals and vals <= set(yes_no_map):
                                X_batch[col] = X_batch[col].astype(str).str.lower().map(yes_no_map)
                            else:
                                X_batch[col] = pd.to_numeric(X_batch[col], errors="coerce")
                    X_batch = X_batch.fillna(X_batch.median(numeric_only=True))
                    X_batch_scaled = scaler.transform(X_batch)

                    preds = model.predict(X_batch_scaled)
                    batch_df["Predicted Performance"] = label_encoder.inverse_transform(preds)

                    st.markdown('<div class="group-label" style="margin-top:20px;">Preview</div>', unsafe_allow_html=True)
                    st.dataframe(batch_df, use_container_width=True)

                    st.markdown('<div style="margin-top:12px;"></div>', unsafe_allow_html=True)
                    st.download_button(
                        "Download Predictions (CSV)",
                        batch_df.to_csv(index=False).encode("utf-8"),
                        "predictions.csv",
                        "text/csv",
                    )

    # ---------------- Model performance ----------------
    with tab3:
        with st.container(border=True):
            st.markdown('<div class="section-eyebrow">Evaluation</div>', unsafe_allow_html=True)
            st.markdown('<div class="section-title">Model Comparison</div>', unsafe_allow_html=True)
            st.markdown('<div class="section-desc">Performance metrics for each trained model on the held-out test set.</div>', unsafe_allow_html=True)

            summary_rows = []
            for name, m in metrics.items():
                summary_rows.append(
                    {
                        "Model": name,
                        "Accuracy": m["accuracy"],
                        "Precision": m["precision"],
                        "Recall": m["recall"],
                        "F1-score": m["f1_score"],
                    }
                )
            summary_df = pd.DataFrame(summary_rows).set_index("Model")
            st.dataframe(
                summary_df.style.highlight_max(axis=0, color="#1E3A8A"),
                use_container_width=True,
            )

            st.markdown('<div class="group-label" style="margin-top:24px;">Metric Comparison</div>', unsafe_allow_html=True)
            st.bar_chart(summary_df, color=["#3B82F6", "#06B6D4", "#8B5CF6", "#22C55E"])

            st.markdown('<div class="group-label" style="margin-top:24px;">Confusion Matrix · ' + best_model_name + '</div>', unsafe_allow_html=True)
            cm = np.array(metrics[best_model_name]["confusion_matrix"])
            cm_df = pd.DataFrame(cm, index=label_encoder.classes_, columns=label_encoder.classes_)
            st.dataframe(cm_df.style.background_gradient(cmap="Blues"), use_container_width=True)


if __name__ == "__main__":
    main()