"""
Streamlit interface for the Machine Learning Approach for Early Prediction
of Students' Academic Performance project.

Run with:
    streamlit run app.py

Expects a bundle.pkl (produced by train_pipeline.py) in the same folder.
"""

import joblib
import numpy as np
import pandas as pd
import streamlit as st

st.set_page_config(page_title="Student Performance Predictor", page_icon="🎓", layout="centered")


@st.cache_resource
def load_bundle(path="bundle.pkl"):
    return joblib.load(path)


def main():
    st.title("🎓 Early Prediction of Students' Academic Performance")
    st.caption("Machine learning approach using attendance, CA scores, assignments, and test data.")

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

    tab1, tab2, tab3 = st.tabs(["🔮 Predict", "📊 Batch Prediction (CSV)", "📈 Model Performance"])

    # ---------------- Single prediction ----------------
    with tab1:
        st.subheader("Enter Student Data")
        st.caption(f"Using best-performing model: **{best_model_name}**")

        input_values = {}
        cols = st.columns(2)
        for i, feature in enumerate(feature_columns):
            with cols[i % 2]:
                input_values[feature] = st.number_input(
                    feature.replace("_", " ").title(), min_value=0.0, max_value=100.0, value=50.0, step=1.0
                )

        if st.button("Predict Performance", type="primary"):
            X_input = pd.DataFrame([input_values])[feature_columns]
            X_scaled = scaler.transform(X_input)

            prediction = model.predict(X_scaled)[0]
            predicted_label = label_encoder.inverse_transform([prediction])[0]

            st.success(f"Predicted Performance: **{predicted_label}**")

            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(X_scaled)[0]
                proba_df = pd.DataFrame(
                    {"Class": label_encoder.classes_, "Probability": proba}
                ).sort_values("Probability", ascending=False)
                st.bar_chart(proba_df.set_index("Class"))

    # ---------------- Batch prediction ----------------
    with tab2:
        st.subheader("Upload a CSV for Batch Prediction")
        st.caption(f"Required columns: {', '.join(feature_columns)}")
        uploaded = st.file_uploader("Choose a CSV file", type="csv")

        if uploaded is not None:
            batch_df = pd.read_csv(uploaded)
            missing = [c for c in feature_columns if c not in batch_df.columns]
            if missing:
                st.error(f"Uploaded file is missing required columns: {missing}")
            else:
                X_batch = batch_df[feature_columns].apply(pd.to_numeric, errors="coerce")
                X_batch = X_batch.fillna(X_batch.median(numeric_only=True))
                X_batch_scaled = scaler.transform(X_batch)

                preds = model.predict(X_batch_scaled)
                batch_df["Predicted Performance"] = label_encoder.inverse_transform(preds)

                st.dataframe(batch_df)
                st.download_button(
                    "Download Predictions as CSV",
                    batch_df.to_csv(index=False).encode("utf-8"),
                    "predictions.csv",
                    "text/csv",
                )

    # ---------------- Model performance ----------------
    with tab3:
        st.subheader("Model Comparison")
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
        st.dataframe(summary_df.style.highlight_max(axis=0, color="lightgreen"))
        st.bar_chart(summary_df)

        st.subheader(f"Confusion Matrix — {best_model_name}")
        cm = np.array(metrics[best_model_name]["confusion_matrix"])
        cm_df = pd.DataFrame(cm, index=label_encoder.classes_, columns=label_encoder.classes_)
        st.dataframe(cm_df)


if __name__ == "__main__":
    main()
