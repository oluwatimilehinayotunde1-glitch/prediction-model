import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CV_SUMMARY, FOLDS, METRICS, BEST_MODEL } from "@/lib/predict";
import { Card, FigureCaption } from "./ReportPrimitives";

// Fixed hex colors, deliberately independent of the band palette — these
// represent candidate models, not performance bands.
const MODEL_COLORS: Record<string, string> = {
  "Logistic Regression": "#4C6EF5",
  "Decision Tree": "#2F9E44",
  "Random Forest": "#F2A93B",
  SVM: "#AE3EC9",
};

const modelNames = Object.keys(FOLDS);

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-surface px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-foreground">Fold {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.dataKey}</span>
          <span className="ml-auto font-medium text-foreground tabular-nums">
            {(p.value * 100).toFixed(1)}%
          </span>
        </p>
      ))}
    </div>
  );
}

const axisStyle = { fill: "var(--muted-foreground)", fontSize: 12 };

export function FoldChart({ metric }: { metric: "accuracy" | "f1" }) {
  const folds = FOLDS[modelNames[0] ?? ""]?.[metric] ?? [];
  const data = folds.map((_, i) => {
    const row: Record<string, number | string> = { fold: `k${i + 1}` };
    for (const name of modelNames) {
      row[name] = FOLDS[name]?.[metric]?.[i] ?? 0;
    }
    return row;
  });

  return (
    <Card>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="fold" tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, 1]}
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
            />
            {modelNames.map((name) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={MODEL_COLORS[name] ?? "var(--primary)"}
                strokeWidth={name === BEST_MODEL ? 3 : 2}
                dot={{ r: 3, strokeWidth: 0, fill: MODEL_COLORS[name] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MetricAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-surface px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.stroke }} />
          <span className="text-muted-foreground">{p.dataKey === "accuracy" ? "Accuracy" : "F1-score"}</span>
          <span className="ml-auto font-medium text-foreground tabular-nums">
            {(p.value * 100).toFixed(1)}%
          </span>
        </p>
      ))}
    </div>
  );
}

/** Held-out accuracy and F1 per candidate model, as an area chart — a
 * different read on the same METRICS table below (peaks make the winner
 * visually obvious at a glance). */
export function MetricsAreaChart() {
  const data = Object.keys(METRICS).map((name) => ({
    model: name,
    accuracy: METRICS[name]?.accuracy ?? 0,
    f1: METRICS[name]?.f1_score ?? 0,
  }));

  return (
    <Card>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="accuracy-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--band-good)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--band-good)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="f1-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--band-excellent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--band-excellent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="model" tick={axisStyle} tickLine={false} axisLine={false} interval={0} />
            <YAxis
              domain={[0, 1]}
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
            />
            <Tooltip content={<MetricAreaTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
              formatter={(v) => (v === "accuracy" ? "Accuracy" : "F1-score")}
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke="var(--band-good)"
              strokeWidth={2}
              fill="url(#accuracy-fill)"
            />
            <Area
              type="monotone"
              dataKey="f1"
              stroke="var(--band-excellent)"
              strokeWidth={2}
              fill="url(#f1-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <FigureCaption>
        Held-out test accuracy and weighted F1 per candidate model. Same figures as the table
        below, just read as a shape instead of a list.
      </FigureCaption>
    </Card>
  );
}

export function MetricsTable() {
  const names = Object.keys(METRICS);
  const bestF1 = Math.max(...names.map((n) => METRICS[n]?.f1_score ?? 0));
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/60 text-left">
            {["Model", "Accuracy", "Precision", "Recall", "F1-score"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((n) => {
            const m = METRICS[n];
            const best = (m?.f1_score ?? 0) === bestF1;
            return (
              <tr key={n} className="border-b border-border last:border-0">
                <td className="flex items-center gap-2 px-4 py-2.5 font-medium text-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: MODEL_COLORS[n] ?? "var(--primary)" }}
                  />
                  {n}
                  {best ? (
                    <span
                      className="ml-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${MODEL_COLORS[n]} 15%, transparent)`,
                        color: MODEL_COLORS[n],
                      }}
                    >
                      selected
                    </span>
                  ) : null}
                </td>
                {(["accuracy", "precision", "recall", "f1_score"] as const).map((k) => (
                  <td key={k} className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {((m?.[k] ?? 0) * 100).toFixed(2)}%
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

/**
 * Cross-validated mean +/- std across k folds, as the primary robustness
 * number alongside MetricsTable's single held-out split. A single 80/20
 * split on this dataset is only ~15 test rows, so one flipped prediction
 * swings accuracy by several points — this table shows the same models
 * scored across every fold instead of just one.
 */
export function CvSummaryTable() {
  const names = Object.keys(CV_SUMMARY);
  const bestF1 = Math.max(...names.map((n) => CV_SUMMARY[n]?.f1_score_mean ?? 0));
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/60 text-left">
            {["Model", "Accuracy", "Precision", "Recall", "F1-score"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((n) => {
            const cv = CV_SUMMARY[n];
            const best = (cv?.f1_score_mean ?? 0) === bestF1;
            return (
              <tr key={n} className="border-b border-border last:border-0">
                <td className="flex items-center gap-2 px-4 py-2.5 font-medium text-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: MODEL_COLORS[n] ?? "var(--primary)" }}
                  />
                  {n}
                  {best ? (
                    <span
                      className="ml-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${MODEL_COLORS[n]} 15%, transparent)`,
                        color: MODEL_COLORS[n],
                      }}
                    >
                      top CV
                    </span>
                  ) : null}
                </td>
                {(["accuracy", "precision", "recall", "f1_score"] as const).map((k) => (
                  <td key={k} className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {((cv?.[`${k}_mean`] ?? 0) * 100).toFixed(2)}% &plusmn;{" "}
                    {((cv?.[`${k}_std`] ?? 0) * 100).toFixed(1)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
