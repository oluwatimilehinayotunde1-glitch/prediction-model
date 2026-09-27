export function SectionHeading({
  index,
  title,
  note,
}: {
  index: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
      {note ? (
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

export function FigureCaption({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{children}</p>;
}

export function MarginNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>;
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card-surface p-5 sm:p-6 ${className}`}>{children}</div>;
}
