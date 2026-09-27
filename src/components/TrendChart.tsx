import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BAND_ORDER, COHORT_DEFAULTS, ORDINAL_MAPS, bandColor, predict } from "@/lib/predict";
import { Card, FigureCaption } from "./ReportPrimitives";

const ATTENDANCE_MAP = ORDINAL_MAPS["attendance_pct"] ?? {};
const ATTENDANCE_LEVELS = Object.keys(ATTENDANCE_MAP);

const rows = ATTENDANCE_LEVELS.map((label) => {
  const r = predict({
    ...COHORT_DEFAULTS,
    attendance_pct: ATTENDANCE_MAP[label] ?? 0,
  });
  const row: Record<string, string | number> = { attendance: label };
  for (const p of r.probabilities) row[p.label] = p.value;
  return row;
});

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-surface px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-foreground">Attendance {label}</p>
      {[...payload].reverse().map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.dataKey}</span>
          <span className="ml-auto font-medium text-foreground tabular-nums">
            {typeof p.value === "number" ? (p.value * 100).toFixed(1) + "%" : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

const axisStyle = { fill: "var(--muted-foreground)", fontSize: 12 };

export function TrendChart() {
  return (
    <Card>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <defs>
              {BAND_ORDER.map((b) => (
                <linearGradient key={b} id={`fill-${b}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={bandColor[b]} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={bandColor[b]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="attendance" tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis
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
            {BAND_ORDER.map((b) => (
              <Area
                key={b}
                type="monotone"
                dataKey={b}
                name={b}
                stroke={bandColor[b]}
                strokeWidth={2}
                fill={`url(#fill-${b})`}
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <FigureCaption>
        This is the model's response curve: predicted class probability as attendance varies, with
        every other indicator held at its cohort-mode value. It comes from the trained classifier
        rather than binned survey averages, since with only 22 respondents, an average per bin
        would be based on as few as 1 to 3 students.
      </FigureCaption>
    </Card>
  );
}
