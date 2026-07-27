"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Snapshot = {
  taken_at: number;
  link_karma: number;
  comment_karma: number;
  total_karma: number;
};

export default function KarmaChart({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[var(--text-muted)]">
        Record a karma total for two or more days and the chart appears here.
      </div>
    );
  }

  const data = snapshots.map((s) => ({
    time: s.taken_at * 1000,
    "Post karma": s.link_karma,
    "Comment karma": s.comment_karma,
  }));

  const fmtTick = (t: number) =>
    new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const fmtLabel = (t: number) =>
    new Date(t).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--gridline)" vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={fmtTick}
          stroke="var(--baseline)"
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          stroke="transparent"
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          tickLine={false}
          width={48}
          domain={["auto", "auto"]}
        />
        <Tooltip
          labelFormatter={(t) => fmtLabel(Number(t))}
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text-primary)",
            fontSize: 13,
          }}
          cursor={{ stroke: "var(--baseline)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 13, color: "var(--text-secondary)" }}
          iconType="plainline"
        />
        <Line
          type="monotone"
          dataKey="Post karma"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="Comment karma"
          stroke="var(--series-2)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
