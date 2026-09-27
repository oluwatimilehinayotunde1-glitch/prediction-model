import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TitleBlock } from "@/components/TitleBlock";
import { TabStrip, type TabName } from "@/components/TabStrip";
import { TrendChart } from "@/components/TrendChart";
import { MarginStats } from "@/components/MarginStats";
import { StudentTable } from "@/components/StudentTable";
import { PredictForm, SensitivityChart } from "@/components/PredictForm";
import { BatchPredict } from "@/components/BatchPredict";
import { CvSummaryTable, FoldChart, MetricsAreaChart, MetricsTable } from "@/components/ModelPerformance";
import { SectionHeading, FigureCaption, Card } from "@/components/ReportPrimitives";
import { BEST_MODEL, FEATURES, METRICS } from "@/lib/predict";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Early Prediction of Students' Academic Performance" },
      {
        name: "description",
        content:
          "A machine learning model that predicts a student's degree classification from attendance, study habits and learning-behaviour indicators.",
      },
      { property: "og:title", content: "Early Prediction of Students' Academic Performance" },
      {
        property: "og:description",
        content:
          "Degree-classification predictor with trend figures, batch scoring and flagged-student review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<TabName>("Overview");
  const best = METRICS[BEST_MODEL] ?? { accuracy: 0, precision: 0, recall: 0, f1_score: 0 };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-24 md:px-10">
      <TitleBlock bestModel={BEST_MODEL} />
      <div className="pt-6 pb-2">
        <TabStrip active={tab} onChange={setTab} />
      </div>

      <div className="pt-6">
        {tab === "Overview" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-8">
              <section>
                <SectionHeading
                  index="01"
                  title="Predicted Performance Bands"
                  note="How the model's predicted probability shifts across the performance bands as attendance goes up, with every other indicator held at its typical cohort value."
                />
                <TrendChart />
              </section>

              <section>
                <SectionHeading
                  index="02"
                  title="Cohort Sample"
                  note="All 22 respondents from the EKSU student survey, scored by the deployed model."
                />
                <StudentTable />
                <FigureCaption>
                  Predicted class and confidence per respondent, alongside their self-reported
                  indicators.
                </FigureCaption>
              </section>
            </div>
            <MarginStats
              accuracy={best.accuracy}
              f1={best.f1_score}
              bestModel={BEST_MODEL}
              features={FEATURES.length}
            />
          </div>
        )}

        {tab === "Predict" && (
          <section className="space-y-8">
            <SectionHeading
              index="03"
              title="Single Student Assessment"
              note={`Enter the indicators for one student. Prediction is computed with the deployed ${BEST_MODEL} model.`}
            />
            <PredictForm />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <SensitivityChart />
              <Card>
                <p className="text-xs font-medium text-muted-foreground">Reading the figure</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  This curve shows how the prediction changes as carryover courses increase, with
                  every other indicator held at its cohort default. Where two lines cross is where
                  the most likely band switches to a different one.
                </p>
              </Card>
            </div>
          </section>
        )}

        {tab === "Batch Prediction" && (
          <section>
            <SectionHeading
              index="04"
              title="Batch Scoring from CSV"
              note="Score an entire class list in one pass and export the annotated file."
            />
            <BatchPredict />
          </section>
        )}

        {tab === "Model Performance" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-8">
              <section>
                <SectionHeading
                  index="05"
                  title="Cross-Validation Results"
                  note="5-fold cross-validation for each candidate algorithm. The folds are shuffled rather than stratified, since the rarest class has only one member in this 72-row sample and stratified folds aren't possible. This is the main robustness check, because a single held-out split is only around 15 rows, so the cross-validated mean and standard deviation across folds are reported here instead of relying on one split alone."
                />
                <div className="space-y-6">
                  <div>
                    <FoldChart metric="accuracy" />
                    <FigureCaption>
                      Accuracy per fold, five-fold cross-validation.
                    </FigureCaption>
                  </div>
                  <div>
                    <FoldChart metric="f1" />
                    <FigureCaption>Weighted F1-score per fold.</FigureCaption>
                  </div>
                  <div>
                    <CvSummaryTable />
                    <FigureCaption>
                      Mean and standard deviation across the 5 folds for each metric. These are
                      the headline numbers to report, since they don't depend on which rows
                      happened to land in a single test split.
                    </FigureCaption>
                  </div>
                </div>
              </section>

              <section>
                <SectionHeading index="06" title="Held-out Test Metrics" />
                <div className="space-y-6">
                  <MetricsAreaChart />
                  <MetricsTable />
                  <FigureCaption>
                    Performance of each trained model on a single held-out 20% test split. This is
                    illustrative only; see the cross-validation results above for the more
                    reliable figures.
                  </FigureCaption>
                </div>
              </section>
            </div>
            <Card className="h-fit">
              <p className="text-xs font-medium text-muted-foreground">Method</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Features are standardised before fitting. The target class comes from
                self-reported CGPA, converted into a 5-tier rating (Excellent 4.50&ndash;5.00,
                Good 3.50&ndash;4.49, Satisfactory 2.50&ndash;3.49, Sufficient 1.50&ndash;2.49,
                Fail below 1.50). CGPA itself isn't used as a feature; only attendance, study
                habits, carryover courses and support-access indicators go into the model. With
                only 72 survey responses (43 of them "Good"), the metrics on this page are best
                read as a demonstration of a working pipeline rather than a validated predictor.
              </p>
              <p className="mt-5 text-xs font-medium text-muted-foreground">Candidates</p>
              <ul className="mt-3 space-y-2">
                {Object.keys(METRICS).map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          m === "Logistic Regression"
                            ? "var(--band-good)"
                            : m === "Decision Tree"
                              ? "var(--band-excellent)"
                              : m === "Random Forest"
                                ? "var(--band-satisfactory)"
                                : "#AE3EC9",
                      }}
                    />
                    <span
                      className={
                        m === BEST_MODEL ? "font-semibold text-foreground" : "text-muted-foreground"
                      }
                    >
                      {m}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {tab === "Flagged Students" && (
          <section>
            <SectionHeading
              index="07"
              title="Students Requiring Intervention"
              note="Students whose predicted band falls at Sufficient or below, pulled from the same cohort sample above."
            />
            <StudentTable onlyFlagged />
            <FigureCaption>Flagged cohort, ordered by predicted band.</FigureCaption>
          </section>
        )}
      </div>

      <footer className="mt-16 border-t border-border pt-6 pb-10 text-xs text-muted-foreground">
        BSc Computer Science final-year project &middot; Ekiti State University &middot; Supervised
        by Dr. O.A. Jongbo &middot; Model scored client-side from exported coefficients.
      </footer>
    </main>
  );
}
