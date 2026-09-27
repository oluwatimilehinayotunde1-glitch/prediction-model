import cohort from "@/data/cohort.json";
import { bandBg } from "@/lib/predict";
import { Card } from "./ReportPrimitives";

interface Respondent {
  id: string;
  level: string;
  cgpa: number;
  attendancePct: string;
  carryoverCourses: number;
  studyHoursPerWeek: string;
  submitsOnTime: string;
  hasStudyResources: string;
  hasMajorCommitment: string;
  band: string;
  probability: number | null;
}

const respondents = cohort as Respondent[];

// Bands below Satisfactory are flagged for intervention.
const AT_RISK_BANDS = new Set(["Fail", "Sufficient"]);

function BandBadge({ band }: { band: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bandBg[band] ?? ""}`}
    >
      {band}
    </span>
  );
}

export function StudentTable({ onlyFlagged = false }: { onlyFlagged?: boolean }) {
  const rows = onlyFlagged ? respondents.filter((s) => AT_RISK_BANDS.has(s.band)) : respondents;

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/60 text-left">
            {[
              "Respondent",
              "Level",
              "Predicted class",
              "Confidence",
              "CGPA",
              "Attendance",
              "Carryovers",
              "Study hrs/wk",
            ].map((h) => (
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
          {rows.map((s) => (
            <tr key={s.id} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 font-medium text-foreground">{s.id}</td>
              <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{s.level}</td>
              <td className="px-4 py-2.5">
                <BandBadge band={s.band} />
              </td>
              <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                {s.probability != null ? `${(s.probability * 100).toFixed(1)}%` : "N/A"}
              </td>
              <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                {s.cgpa.toFixed(2)}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                {s.attendancePct}
              </td>
              <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                {s.carryoverCourses}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                {s.studyHoursPerWeek}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
