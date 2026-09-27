import cohort from "@/data/cohort.json";
import { CLASSES, bandColor, BAND_ORDER } from "@/lib/predict";
import { Card } from "./ReportPrimitives";

const rows = cohort as { band: string; probability: number | null }[];
const AT_RISK_BANDS = new Set(["Fail", "Sufficient"]);

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function MarginStats({
  accuracy,
  f1,
  bestModel,
  features,
}: {
  accuracy: number;
  f1: number;
  bestModel: string;
  features: number;
}) {
  const atRisk = rows.filter((r) => AT_RISK_BANDS.has(r.band)).length;

  return (
    <div className="space-y-4">
      <Card className="grid grid-cols-2 gap-x-5 gap-y-5">
        <div className="col-span-2">
          <Stat label="Deployed model" value={bestModel} sub="selected on held-out F1" />
        </div>
        <Stat label="Test accuracy" value={`${(accuracy * 100).toFixed(1)}%`} />
        <Stat label="Weighted F1" value={f1.toFixed(3)} />
        <Stat label="Early indicators" value={String(features)} />
        <Stat
          label="Performance bands"
          value={String(CLASSES.length)}
          sub={`${atRisk} of ${rows.length} flagged`}
        />
      </Card>

      <Card>
        <p className="mb-3 text-xs font-medium text-muted-foreground">Legend</p>
        <ul className="space-y-2.5">
          {[...BAND_ORDER].reverse().map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: bandColor[b] }}
              />
              <span className="text-foreground">{b}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Bands are derived from self-reported CGPA (0.00&ndash;5.00 scale): Excellent
          4.50&ndash;5.00, Good 3.50&ndash;4.49, Satisfactory 2.50&ndash;3.49, Sufficient
          1.50&ndash;2.49, Fail below 1.50. Only bands present in the training sample are
          shown above.
        </p>
      </Card>
    </div>
  );
}
