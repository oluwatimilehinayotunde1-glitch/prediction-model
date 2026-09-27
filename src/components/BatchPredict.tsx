import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BAND_ORDER, FEATURES, ORDINAL_MAPS, bandColor, bandBg, ratingBg, predict, type Rating } from "@/lib/predict";
import { Card, FigureCaption } from "./ReportPrimitives";

interface Row {
  raw: Record<string, string>;
  band: string;
  probability: number;
  rating: Rating;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const first = lines.shift();
  if (!first) return [];
  const sep = first.includes(";") && !first.includes(",") ? ";" : ",";
  const headers = first.split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.map((line) => {
    const cells = line.split(sep);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim().replace(/^"|"$/g, "");
    });
    return row;
  });
}

function toNumber(v: string | undefined, column: string): number {
  if (v === undefined) return 0;
  const trimmed = v.trim();

  const ordinalMap = ORDINAL_MAPS[column];
  if (ordinalMap) {
    const match = Object.keys(ordinalMap).find((k) => k.toLowerCase() === trimmed.toLowerCase());
    if (match) return ordinalMap[match] ?? 0;
  }

  const low = trimmed.toLowerCase();
  if (low === "yes") return 1;
  if (low === "no") return 0;

  const n = Number(trimmed);
  return Number.isFinite(n) ? n : 0;
}

const axisStyle = { fill: "var(--muted-foreground)", fontSize: 12 };

function DistTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="card-surface px-3 py-2 text-xs">
      <p className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.payload.fill }} />
        <span className="text-muted-foreground">{p.payload.band}</span>
        <span className="ml-auto font-medium text-foreground tabular-nums">
          {p.value} student{p.value === 1 ? "" : "s"}
        </span>
      </p>
    </div>
  );
}

function ConfidenceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="card-surface px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-foreground">Record #{label}</p>
      <p className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.payload.color }} />
        <span className="text-muted-foreground">{p.payload.band}</span>
        <span className="ml-auto font-medium text-foreground tabular-nums">
          {(p.value * 100).toFixed(1)}%
        </span>
      </p>
    </div>
  );
}

/** Distribution of predicted bands across the uploaded batch, and the
 * per-record confidence trend — both derived live from the rows just
 * scored, not sample/placeholder data. */
function BatchCharts({ rows }: { rows: Row[] }) {
  const distribution = useMemo(
    () =>
      BAND_ORDER.map((b) => ({
        band: b,
        count: rows.filter((r) => r.band === b).length,
        fill: bandColor[b],
      })),
    [rows],
  );

  const trend = useMemo(
    () =>
      rows.map((r, i) => ({
        index: i + 1,
        confidence: r.probability,
        band: r.band,
        color: bandColor[r.band] ?? "var(--primary)",
      })),
    [rows],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <p className="text-xs font-medium text-muted-foreground">Predicted band distribution</p>
        <div className="mt-3 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={distribution} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="batch-dist-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="band" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis
                allowDecimals={false}
                tick={axisStyle}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<DistTooltip />} cursor={{ stroke: "var(--border)" }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#batch-dist-fill)"
                dot={{ r: 3, strokeWidth: 0, fill: "var(--primary)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <FigureCaption>Count of students placed in each band by this batch run.</FigureCaption>
      </Card>

      <Card>
        <p className="text-xs font-medium text-muted-foreground">Confidence per record</p>
        <div className="mt-3 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 16 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="index"
                tick={axisStyle}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Record #",
                  position: "insideBottom",
                  offset: -2,
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />
              <YAxis
                domain={[0, 1]}
                tick={axisStyle}
                tickLine={false}
                axisLine={false}
                width={36}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
              />
              <Tooltip content={<ConfidenceTooltip />} cursor={{ stroke: "var(--border)" }} />
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
        <FigureCaption>
          Model confidence for each scored record, in upload order. Dot colour marks the predicted
          band.
        </FigureCaption>
      </Card>
    </div>
  );
}

export function BatchPredict() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFile = async (file: File) => {
    setError(null);
    const parsed = parseCsv(await file.text());
    if (!parsed.length) {
      setError("The file appears to be empty.");
      setRows(null);
      return;
    }
    const missing = FEATURES.filter((f) => !(f in (parsed[0] ?? {})));
    if (missing.length) {
      setError(`Missing required columns: ${missing.join(", ")}`);
      setRows(null);
      return;
    }
    setFileName(file.name);
    setRows(
      parsed.map((raw) => {
        const values: Record<string, number> = {};
        for (const f of FEATURES) values[f] = toNumber(raw[f], f);
        const r = predict(values);
        return { raw, band: r.label, probability: r.confidence, rating: r.rating };
      }),
    );
  };

  const download = () => {
    if (!rows) return;
    const headers = [
      ...Object.keys(rows[0]?.raw ?? {}),
      "Predicted Performance",
      "Rating",
      "Probability",
    ];
    const body = rows.map((r) =>
      [...Object.values(r.raw), r.band, r.rating, r.probability.toFixed(4)].join(","),
    );
    const blob = new Blob([[headers.join(","), ...body].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "predictions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Upload a CSV with these required columns:{" "}
          <span className="font-medium text-foreground">{FEATURES.join(", ")}</span>. Text
          categories (e.g. &ldquo;70-89%&rdquo;, &ldquo;11-20 hours&rdquo;) and Yes/No values are
          accepted directly, matching the original survey export. Everything is scored locally in
          your browser.
        </p>

        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary">
          {fileName || "Choose a CSV file"}
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </label>

        {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
      </Card>

      {rows ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {rows.length} records scored
            </p>
            <button
              onClick={download}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
            >
              Download predictions (CSV)
            </button>
          </div>
          <BatchCharts rows={rows} />
          <Card className="overflow-auto p-0">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-left">
                  {[...FEATURES, "Predicted band", "Rating", "Probability"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {FEATURES.map((f) => (
                      <td key={f} className="px-4 py-2 tabular-nums text-muted-foreground">
                        {r.raw[f]}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bandBg[r.band] ?? ""}`}
                      >
                        {r.band}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ratingBg[r.rating]}`}
                      >
                        {r.rating}
                      </span>
                    </td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">
                      {(r.probability * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : null}
    </div>
  );
}
