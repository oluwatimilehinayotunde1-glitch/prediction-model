import { useMemo, useState } from "react";
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
import {
  BAND_ORDER,
  COHORT_DEFAULTS,
  ORDINAL_MAPS,
  bandColor,
  bandBg,
  ratingBg,
  predict,
  type PredictionResult,
} from "@/lib/predict";
import { Card, FigureCaption } from "./ReportPrimitives";

const SELECTS = [
  { key: "level", label: "Class level", help: "Current year of study" },
  { key: "attendance_pct", label: "Attendance", help: "Share of classes attended this session" },
  {
    key: "study_hours_per_week",
    label: "Weekly study time",
    help: "Hours spent studying outside of class per week",
  },
  {
    key: "submits_on_time",
    label: "Submits assignments on time",
    help: "How consistently coursework is submitted by the deadline",
  },
  {
    key: "has_study_resources",
    label: "Access to study resources",
    help: "Textbooks, past questions, reading materials, etc.",
  },
] as const;

const initial: Record<string, number> = { ...COHORT_DEFAULTS };

export function PredictForm() {
  const [values, setValues] = useState<Record<string, number>>(initial);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const set = (k: string, v: number) => setValues((p) => ({ ...p, [k]: v }));

  const attendanceTrend = useMemo(() => {
    const map = ORDINAL_MAPS["attendance_pct"] ?? {};
    return Object.entries(map).map(([label, code]) => {
      const r = predict({ ...values, attendance_pct: code });
      return {
        attendance: label,
        confidence: r.confidence,
        band: r.label,
        color: bandColor[r.label] ?? "var(--primary)",
      };
    });
  }, [values]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setResult(predict(values));
          }}
          className="space-y-7"
        >
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Academic &amp; behaviour indicators
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {SELECTS.map((f) => {
                const optionMap = ORDINAL_MAPS[f.key] ?? {};
                const options = Object.keys(optionMap);
                const current =
                  options.find((o) => optionMap[o] === values[f.key]) ?? options[0] ?? "";
                return (
                  <label key={f.key} className="block">
                    <span className="text-sm font-medium text-foreground">{f.label}</span>
                    <select
                      value={current}
                      onChange={(e) => set(f.key, optionMap[e.target.value] ?? 0)}
                      className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-xs text-muted-foreground">{f.help}</span>
                  </label>
                );
              })}

              <label className="block">
                <span className="text-sm font-medium text-foreground">Carryover courses</span>
                <input
                  type="number"
                  min={0}
                  value={values["carryover_courses"] ?? 0}
                  onChange={(e) => set("carryover_courses", Math.max(0, Number(e.target.value)))}
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Number of courses currently being repeated
                </span>
              </label>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Commitments</p>
            <div className="mt-4">
              <span className="text-sm font-medium text-foreground">
                Has a major commitment (job, family, etc.)
              </span>
              <div className="mt-2 flex max-w-xs gap-1 rounded-full bg-secondary p-1">
                {[
                  { l: "No", v: 0 },
                  { l: "Yes", v: 1 },
                ].map((o) => (
                  <button
                    key={o.l}
                    type="button"
                    onClick={() => set("has_major_commitment", o.v)}
                    className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
                      values["has_major_commitment"] === o.v
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
          >
            Compute prediction
          </button>
        </form>
      </Card>

      <div className="space-y-6">
      <Card>
        <p className="text-xs font-medium text-muted-foreground">Result</p>
        {!result ? (
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Adjust the indicators and compute a prediction. The classifier runs entirely in the
            browser using the exported coefficients of the trained model.
          </p>
        ) : (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${bandBg[result.label] ?? ""}`}
              >
                {result.label}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ratingBg[result.rating]}`}
              >
                Rating: {result.rating}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Confidence {(result.confidence * 100).toFixed(1)}%
            </p>

            <p className="mt-6 text-xs font-medium text-muted-foreground">Class probabilities</p>
            <ul className="mt-3 space-y-2.5">
              {[...BAND_ORDER].reverse().map((b) => {
                const p = result.probabilities.find((x) => x.label === b)?.value ?? 0;
                return (
                  <li key={b} className="text-xs">
                    <div className="mb-1 flex justify-between text-foreground">
                      <span>{b}</span>
                      <span className="tabular-nums">{(p * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: bandColor[b],
                          width: `${Math.max(p * 100, 2)}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <p className="text-xs font-medium text-muted-foreground">Confidence vs. attendance</p>
        <div className="mt-3 h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={attendanceTrend}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="attendance"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={30}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0];
                  return (
                    <div className="card-surface px-3 py-2 text-xs">
                      <p className="mb-1 font-medium text-foreground">{label}</p>
                      <p className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: p.payload.color }}
                        />
                        <span className="text-muted-foreground">{p.payload.band}</span>
                        <span className="ml-auto font-medium text-foreground tabular-nums">
                          {(p.value * 100).toFixed(1)}%
                        </span>
                      </p>
                    </div>
                  );
                }}
                cursor={{ stroke: "var(--border)" }}
              />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={(props: any) => (
                  <circle
                    key={props.key}
                    cx={props.cx}
                    cy={props.cy}
                    r={3}
                    fill={props.payload.color}
                    stroke="none"
                  />
                )}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          This student&rsquo;s predicted band and confidence if only their attendance changed,
          every other entered value held as set on the left.
        </p>
      </Card>
      </div>
    </div>
  );
}

export function SensitivityChart() {
  const maxCarryover = 5;
  const data = Array.from({ length: maxCarryover + 1 }, (_, co) => {
    const r = predict({ ...COHORT_DEFAULTS, carryover_courses: co });
    const row: Record<string, number> = { carryovers: co };
    for (const p of r.probabilities) row[p.label] = p.value;
    return row;
  });

  return (
    <Card>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="carryovers"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
            />
            {BAND_ORDER.map((b) => (
              <Area
                key={b}
                type="monotone"
                dataKey={b}
                name={b}
                stroke={bandColor[b]}
                strokeWidth={2}
                fillOpacity={0.12}
                fill={bandColor[b]}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <FigureCaption>
        Model response curve: predicted class probability as carryover courses increase, holding
        every other indicator at its cohort-mode value.
      </FigureCaption>
    </Card>
  );
}
