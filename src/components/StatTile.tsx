export function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub ? <div className="mt-0.5 text-xs">{sub}</div> : null}
    </div>
  );
}

export function Delta({ value, suffix }: { value: number; suffix?: string }) {
  const positive = value > 0;
  const negative = value < 0;
  const color = positive
    ? "var(--good)"
    : negative
      ? "var(--critical)"
      : "var(--text-muted)";
  return (
    <span
      className="tabular inline-flex items-center gap-0.5 font-semibold"
      style={{ color }}
    >
      {positive || negative ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          style={{ transform: negative ? "rotate(180deg)" : undefined }}
        >
          <path
            d="M6 2.5v7M6 2.5L3 5.5M6 2.5l3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      {positive ? "+" : ""}
      {value.toLocaleString()}
      {suffix ? <span className="font-normal text-[var(--text-muted)]">{suffix}</span> : null}
    </span>
  );
}
