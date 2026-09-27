export function TitleBlock({ bestModel }: { bestModel: string }) {
  return (
    <header className="flex flex-col gap-4 pt-8 pb-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="kicker">Ekiti State University &middot; Dept. of Computer Science</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
          Early Prediction of Academic Performance
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          A classifier estimating degree classification from attendance, study habits, carryover
          courses and support-access indicators, self-reported by EKSU students.
        </p>
      </div>
      <div className="flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm sm:self-auto">
        <span className="h-2 w-2 rounded-full bg-band-excellent" />
        Model: <span className="text-foreground">{bestModel}</span>
      </div>
    </header>
  );
}
