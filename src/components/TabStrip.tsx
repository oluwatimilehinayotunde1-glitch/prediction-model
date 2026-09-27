export const TABS = [
  "Overview",
  "Predict",
  "Batch Prediction",
  "Model Performance",
  "Flagged Students",
] as const;

export type TabName = (typeof TABS)[number];

export function TabStrip({
  active,
  onChange,
}: {
  active: TabName;
  onChange: (t: TabName) => void;
}) {
  return (
    <nav
      aria-label="Sections"
      className="flex flex-wrap gap-1 rounded-full border border-border bg-card p-1 shadow-sm"
    >
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={
              isActive
                ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            }
          >
            {tab}
          </button>
        );
      })}
    </nav>
  );
}
