import Link from "next/link";
import { Inbox } from "lucide-react";

export default function EmptyState({
  title,
  message,
  actionHref,
  actionLabel,
  secondary,
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
  secondary?: string;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
      >
        <Inbox size={26} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-[var(--text-secondary)]">{message}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          {actionLabel}
        </Link>
      ) : null}
      {secondary ? (
        <p className="mt-3 text-xs text-[var(--text-muted)]">{secondary}</p>
      ) : null}
    </div>
  );
}
