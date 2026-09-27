# Early Prediction of Academic Performance

A plain React interface for the BSc final-year project "A Machine Learning
Approach for Early Prediction of Students' Academic Performance", Ekiti State
University. It's a regular TanStack Start app, so no special tooling is needed
to run it.

## Run it

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # production build, output goes to .output/
npm start        # runs the production build (after `npm run build`)
```

## What's inside

- `src/routes/index.tsx`: the front page (sections are Overview, Predict, Batch
  Prediction, Model Performance, Flagged Students)
- `src/components/`: `TitleBlock` (masthead), `TabStrip` (section nav),
  `ReportPrimitives` (headline/caption primitives), `TrendChart`, `MarginStats`,
  `StudentTable`, `PredictForm`, `BatchPredict`, `ModelPerformance`
- `src/lib/predict.ts`: the trained multinomial Logistic Regression ported to
  TypeScript (standard scaler and coefficients exported from `bundle.pkl`), so
  predictions run in the browser with no Python server needed
- `src/data/model.json`: scaler stats, coefficients, test metrics, 5-fold CV results
- `src/data/cohort.json`: the real evaluation cohort used in the Overview and
  Flagged Students sections
- `src/styles.css`: the design system. Warm off-white background, amber/orange
  primary accent, white cards with subtle borders and shadows, and a traffic-light
  palette (green to red) for the five performance bands so risk reads at a glance
  in every chart, badge, and table.

Predictions were checked against the original scikit-learn model and match exactly
on the full training corpus.

## Re-exporting the model

If you retrain (`python train_pipeline.py --data dataset/student-mat.csv`), re-export
`src/data/model.json` with the scaler `mean_`/`scale_`, the logistic `coef_`/`intercept_`,
the label-encoder classes and the metrics dictionary.

## Deploying

This is a server-rendered app (TanStack Start on Nitro), not a static site, so it
needs a host that runs a Node process rather than one that just serves static
files. Render, Railway, and Fly.io all work with the default build:

```bash
npm run build
npm start
```

If you deploy to Vercel, set the Nitro preset to `vercel` in `vite.config.ts`
(`nitro({ preset: "vercel" })`), since the default build target won't match
what Vercel expects.

A few things worth doing before sharing the link:
- Delete the leftover Streamlit app (`app.py`, `interface/`, `.streamlit/`,
  `requirements.txt`) if you're only shipping the React version. They aren't
  used by this app and just add confusion for anyone browsing the repo.
- There are two copies of the same requirements file (`requirements.txt` and
  `requirements (1).txt`). Keep one.
- Add a short one-line project description and a live link at the top of this
  README once it's deployed, so it reads well from a GitHub repo page.
