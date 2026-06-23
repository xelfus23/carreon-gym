/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import type { UserAccountProps } from "../../types";
import { IntervalTimeline, type TimelineInterval, type TimelineRow } from "./IntervalTimeline";

interface SubscriptionTimelineChartProps {
  user: UserAccountProps;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#1D9E75",
  expired: "#E24B4A",
  pending: "#EF9F27",
  cancelled: "#888780",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  pending: "Pending",
  cancelled: "Cancelled",
};

const DAY_MS = 1000 * 60 * 60 * 24;

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(durationMs: number) {
  const days = Math.max(1, Math.round(durationMs / DAY_MS));
  if (days <= 1) return "1 day";
  if (days < 14) return `${days} days`;
  const weeks = Math.round(days / 7);
  if (days < 60) return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? "month" : "months"}`;
}

export default function SubscriptionTimelineChart({ user }: SubscriptionTimelineChartProps) {
  const { rows, intervals } = useMemo(() => {
    const subs = user.subscriptions ?? [];

    const parsed = subs
      .map((sub, i) => {
        const startMs = new Date(sub.start_date || "").getTime();
        const endMs = new Date(sub.expiry_date || "").getTime();
        return { sub, startMs, endMs, i };
      })
      .filter((r) => Number.isFinite(r.startMs) && Number.isFinite(r.endMs));

    // Group purchase periods by plan name. A single plan can have many
    // disjoint periods (bought Jan 14-15, bought again Feb 1-2, etc) — each
    // becomes its own interval on the same row, no special-casing needed.
    const rowOrder: string[] = [];
    const seen = new Set<string>();
    for (const r of parsed) {
      if (!seen.has(r.sub.plan_name)) {
        seen.add(r.sub.plan_name);
        rowOrder.push(r.sub.plan_name);
      }
    }

    const rows: TimelineRow[] = rowOrder.map((name) => ({ id: name, label: name }));

    const intervals: TimelineInterval[] = parsed.map((r) => {
      const durationMs = r.endMs - r.startMs;
      const color = STATUS_COLORS[r.sub.status] ?? "#888780";
      return {
        id: `${r.sub.plan_name}-${r.i}`,
        rowId: r.sub.plan_name,
        startMs: r.startMs,
        endMs: r.endMs,
        color,
        tooltip: (
          <div className="space-y-0.5">
            <p className="font-bold text-text-primary">{r.sub.plan_name}</p>
            <p className="text-text-secondary">
              {formatDate(r.startMs)} → {formatDate(r.endMs)}
            </p>
            <p className="text-text-secondary">
              {formatDuration(durationMs)} · {STATUS_LABELS[r.sub.status] ?? r.sub.status}
            </p>
          </div>
        ),
      };
    });

    return { rows, intervals };
  }, [user.subscriptions]);

  return (
    <div className="bg-surface p-5 rounded-xl border border-border">
      <div className="flex flex-wrap gap-4 pb-4 mb-1 border-b border-border text-[11px] text-text-secondary">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[key] }} />
            {label}
          </div>
        ))}
      </div>
      <IntervalTimeline
        rows={rows}
        intervals={intervals}
        formatTick={formatDate}
        emptyMessage="No subscription history for this member yet."
      />
    </div>
  );
}