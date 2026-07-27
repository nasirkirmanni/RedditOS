import type { ManagementStatus } from "@/lib/types";
import { Zap, Pause, Ban, CirclePower } from "lucide-react";

type IconType = typeof Zap;

const MGMT_CONFIG: Record<
  ManagementStatus,
  { label: string; color: string; Icon: IconType }
> = {
  active: { label: "Active", color: "var(--good)", Icon: Zap },
  resting: { label: "Resting", color: "var(--series-1)", Icon: Pause },
  suspended: { label: "Suspended", color: "var(--warning)", Icon: Ban },
  disabled: { label: "Disabled", color: "var(--text-muted)", Icon: CirclePower },
};

/** Management status, set by you: active / resting / suspended / disabled. */
export function StatusBadge({ status }: { status: ManagementStatus }) {
  const c = MGMT_CONFIG[status];
  const Icon = c.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{
        color: c.color,
        borderColor: "var(--border)",
        background: "var(--surface-2)",
      }}
    >
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
      {c.label}
    </span>
  );
}
