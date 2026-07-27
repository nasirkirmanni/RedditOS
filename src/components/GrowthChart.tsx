"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function GrowthChart({
  data,
  height = 240,
}: {
  data: { time: number; total: number }[];
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--text-muted)]"
        style={{ height }}
      >
        Record a karma total for two or more days and the growth line appears
        here.
      </div>
    );
  }

  const fmtTick = (t: number) =>
    new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          width={56}
          domain={["auto", "auto"]}
          tickFormatter={(v: number) =>
            Math.abs(v) >= 10000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
        />
        <Tooltip
          labelFormatter={(t) => fmtTick(Number(t))}
          formatter={(value) => [Number(value).toLocaleString(), "Total karma"]}
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text-primary)",
            fontSize: 13,
          }}
          cursor={{ stroke: "var(--baseline)" }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--series-1)"
          strokeWidth={2}
          fill="url(#growthFill)"
          isAnimationActive={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
