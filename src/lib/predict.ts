import model from "@/data/model.json";

export const FEATURES = model.featureColumns as string[];
export const CLASSES = model.classes as string[];
export const BEST_MODEL = model.bestModel as string;
export const METRICS = model.metrics as Record<
  string,
  { accuracy: number; precision: number; recall: number; f1_score: number }
>;
export const CV_SUMMARY = model.cvSummary as Record<
  string,
  {
    accuracy_mean: number; accuracy_std: number;
    precision_mean: number; precision_std: number;
    recall_mean: number; recall_std: number;
    f1_score_mean: number; f1_score_std: number;
  }
>;
export const FOLDS = model.folds as Record<string, { accuracy: number[]; f1: number[] }>;

/**
 * 5-tier qualitative performance rating, derived directly from
 * self-reported CGPA (0.00-5.00 scale) using custom bands — this is the
 * model's predicted class, not a post-hoc relabeling of anything else:
 * Excellent(4.50-5.00) Good(3.50-4.49) Satisfactory(2.50-3.49)
 * Sufficient(1.50-2.49) Fail(below 1.50).
 * Only the bands actually present in the training data show up in
 * CLASSES/BAND_ORDER — a future retrain with a broader sample (e.g.
 * containing a Fail case) will surface automatically.
 */
export type Band = "Fail" | "Sufficient" | "Satisfactory" | "Good" | "Excellent";

const CANONICAL_ORDER: Band[] = ["Fail", "Sufficient", "Satisfactory", "Good", "Excellent"];

export const BAND_ORDER: Band[] = CANONICAL_ORDER.filter((b) => CLASSES.includes(b));

export const bandColor: Record<string, string> = {
  Excellent: "var(--band-excellent)",
  Good: "var(--band-good)",
  Satisfactory: "var(--band-satisfactory)",
  Sufficient: "var(--band-sufficient)",
  Fail: "var(--band-fail)",
};

export const bandBg: Record<string, string> = {
  Excellent: "bg-band-excellent/12 text-band-excellent",
  Good: "bg-band-good/12 text-band-good",
  Satisfactory: "bg-band-satisfactory/15 text-band-satisfactory",
  Sufficient: "bg-band-sufficient/12 text-band-sufficient",
  Fail: "bg-band-fail/12 text-band-fail",
};

export const bandTextClass: Record<string, string> = {
  Excellent: "text-band-excellent",
  Good: "text-band-good",
  Satisfactory: "text-band-satisfactory",
  Sufficient: "text-band-sufficient",
  Fail: "text-band-fail",
};

/**
 * Kept as an alias of Band so existing call sites that ask for a
 * "Rating" (ratingFor / ratingColor / ratingBg) keep working — the model
 * now predicts the rating directly, so there's no separate collapse step.
 */
export type Rating = Band;

export const RATING_ORDER: Rating[] = CANONICAL_ORDER;

/** Resolve the qualitative rating for a predicted band label (now the identity — kept for compatibility). */
export function ratingFor(band: string): Rating {
  return (CANONICAL_ORDER as string[]).includes(band) ? (band as Rating) : "Sufficient";
}

export const ratingColor: Record<Rating, string> = bandColor as Record<Rating, string>;

export const ratingBg: Record<Rating, string> = bandBg as Record<Rating, string>;

/**
 * Ordinal text -> numeric code mappings, mirrored 1:1 from
 * train_pipeline.py's ORDINAL_MAPS in Python. Keep both in sync by hand —
 * there are only 6 columns, so this is intentionally not code-generated.
 */
export const ORDINAL_MAPS: Record<string, Record<string, number>> = {
  level: { "100 Level": 1, "200 Level": 2, "300 Level": 3, "400 Level": 4, "500 Level": 5 },
  attendance_pct: { "Below 50%": 1, "50-69%": 2, "70-89%": 3, "90-100%": 4 },
  study_hours_per_week: {
    "Less than 5 hours": 1,
    "5-10 hours": 2,
    "11-20 hours": 3,
    "More than 20 hours": 4,
  },
  submits_on_time: { Never: 1, Rarely: 2, Sometimes: 3, Often: 4, Always: 5 },
  has_study_resources: { No: 0, Partially: 1, Yes: 2 },
  has_major_commitment: { No: 0, Yes: 1 },
};

/**
 * Cohort defaults (the modal/most-common value per feature in the 71-row
 * survey), used to hold "everything else" constant when a chart sweeps a
 * single feature. Encoded values, not display strings.
 */
export const COHORT_DEFAULTS: Record<string, number> = {
  level: 4, // 400 Level
  attendance_pct: 4, // 90-100%
  carryover_courses: 0,
  study_hours_per_week: 1, // Less than 5 hours
  submits_on_time: 5, // Always
  has_study_resources: 2, // Yes
  has_major_commitment: 0, // No
};

export interface PredictionResult {
  label: string;
  probabilities: { label: string; value: number }[];
  confidence: number;
  rating: Rating;
}

/** Multinomial logistic regression, ported verbatim from the trained sklearn bundle. */
export function predict(values: Record<string, number>): PredictionResult {
  const mean = model.mean as number[];
  const scale = model.scale as number[];
  const coef = model.coef as number[][];
  const intercept = model.intercept as number[];

  const x = FEATURES.map((f, i) => ((values[f] ?? 0) - (mean[i] ?? 0)) / (scale[i] ?? 1));
  const logits = coef.map(
    (row, k) => row.reduce((sum, w, i) => sum + w * (x[i] ?? 0), 0) + (intercept[k] ?? 0),
  );
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const total = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / total);

  const probabilities = CLASSES.map((label, i) => ({ label, value: probs[i] ?? 0 }));
  const best = probabilities.reduce((a, b) => (b.value > a.value ? b : a), {
    label: CLASSES[0] ?? "",
    value: 0,
  });

  return { label: best.label, probabilities, confidence: best.value, rating: ratingFor(best.label) };
}
