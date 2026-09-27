I'm building my final year project: "A Machine Learning Approach for Early
Prediction of Students' Academic Performance" (BSc Computer Science,
Ekiti State University).

Scope: supervised ML using Logistic Regression, Decision Tree, Random
Forest, and SVM to predict academic performance class from attendance,
continuous assessment scores, assignment scores, test scores, and exam
marks. Evaluation via accuracy, precision, recall, F1-score, and
confusion matrix.

I already have:
- train_pipeline.py — loads a CSV, preprocesses features, trains all 4
  models, evaluates them, and saves the best one + scaler + label
  encoder into bundle.pkl (via a CONFIG dict at the top for column names).
- app.py — Streamlit interface with single prediction, batch CSV
  prediction, and a model comparison / confusion matrix tab. Reads
  bundle.pkl.
- requirements.txt

