/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import type { UserAccountProps } from "../../types";
import { IntervalTimeline, type TimelineInterval, type TimelineRow } from "./IntervalTimeline";

interface CheckInTimelineChartProps {
  user: UserAccountProps;
  daysToShow?: number;
}

const HOUR_MS = 1000 * 60 * 60;

function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDuration(ms: number) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function CheckInTimelineChart({
  user,
  daysToShow = 14,
}: CheckInTimelineChartProps) {
  // Snapshot "now" once per render at the top level, not inside useMemo.
  // Calling Date.now() inside a memoized calculation is impure: the memo's
  // result can change between calls with identical inputs purely because
  // time passed, which violates React's render-purity rules and can cause
  // unstable output across re-renders (e.g. Strict Mode double-invoke).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), []);

  const { rows, intervals, domain } = useMemo(() => {
    const logs = user.attendance_logs ?? [];

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayKey = localDateKey(today);

    // Pre-build the full window of day rows (even empty days) so the axis
    // stays stable regardless of which days actually have check-ins.
    const dayMeta: Record<string, { dayStartMs: number; isToday: boolean; label: string }> = {};
    const rowOrder: string[] = [];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      const isToday = key === todayKey;
      dayMeta[key] = {
        dayStartMs: d.getTime(),
        isToday,
        label: isToday
          ? "● Today"
          : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      };
      rowOrder.push(key);
    }

    const rows: TimelineRow[] = rowOrder.map((key) => ({
      id: key,
      label: dayMeta[key].label,
    }));

    const intervals: TimelineInterval[] = [];

    logs.forEach((log, i) => {
      const inDate = new Date(log.check_in);
      if (Number.isNaN(inDate.getTime())) return;

      const key = localDateKey(inDate);
      if (!(key in dayMeta)) return; // outside the visible window

      const inMs = inDate.getTime();
      let outMs: number | null = null;

      if (log.check_out) {
        const outDate = new Date(log.check_out);
        if (!Number.isNaN(outDate.getTime())) outMs = outDate.getTime();
      }

      const isOngoing = outMs === null;
      // Ongoing visits still get a visible sliver (30 min) instead of
      // stretching to "now" or vanishing.
      const effectiveOutMs = outMs ?? Math.min(inMs + 30 * 60000, now);
      const isToday = dayMeta[key].isToday;

      // Every row shares one "hour of day" axis (0-24h), not the absolute
      // calendar timeline — otherwise a visit on day 3 would land far to
      // the right of the same hour on day 1. Re-anchor each interval to a
      // common reference day (the first day in the window) using only its
      // time-of-day offset from that day's own midnight.
      const dayStart = dayMeta[key].dayStartMs;
      const refDayStart = dayMeta[rowOrder[0]].dayStartMs;
      const startOffsetMs = inMs - dayStart;
      const endOffsetMs = Math.max(effectiveOutMs, inMs + 60000) - dayStart;

      intervals.push({
        id: `${key}-${i}`,
        rowId: key,
        startMs: refDayStart + startOffsetMs,
        endMs: refDayStart + endOffsetMs,
        color: isToday ? "#3b82f6" : "#10b981",
        tooltip: (
          <div className="space-y-0.5">
            <p className="font-bold text-text-primary">{dayMeta[key].label.replace("● ", "")}</p>
            <p className="text-text-secondary">
              {formatTime(inMs)} – {isOngoing ? "ongoing" : formatTime(outMs as number)}
            </p>
            {!isOngoing && (
              <p className="text-text-secondary">{formatDuration((outMs as number) - inMs)}</p>
            )}
          </div>
        ),
      });
    });

    // Fixed domain: one reference day, midnight to midnight. All intervals
    // were re-anchored onto this same day above, so every row plots on the
    // identical hour-of-day axis regardless of which calendar day it is.
    const refDayStart = dayMeta[rowOrder[0]].dayStartMs;

    return {
      rows,
      intervals,
      domain: [refDayStart, refDayStart + 24 * HOUR_MS] as [number, number],
    };
  }, [user.attendance_logs, daysToShow, now]);

  const hasAnyData = intervals.length > 0;

  return (
    <div className="bg-surface p-5 rounded-xl border border-border">
      {!hasAnyData ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          No check-ins recorded in this period.
        </p>
      ) : (
        <IntervalTimeline
          rows={rows}
          intervals={intervals}
          domain={domain}
          tickCount={6}
          rowHeight={28}
          barThickness={14}
          leftLabelWidth={90}
          formatTick={(ms) => {
            const d = new Date(ms);
            return d.toLocaleTimeString("en-US", { hour: "numeric" });
          }}
        />
      )}
    </div>
  );
}