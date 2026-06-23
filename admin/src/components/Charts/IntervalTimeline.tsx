/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS } from "../../constants";

/**
 * IntervalTimeline
 * -----------------
 * Generic "Gantt-style" row timeline. Each row can hold an arbitrary number
 * of disjoint [start, end] intervals (no fixed slot count, no stacking
 * hacks). Positioning is done with real pixel math against one shared time
 * scale, so it scales correctly whether a row has 1 interval or 50.
 *
 * Why not Recharts <Bar>? Bar/BarChart expects a fixed, declared set of
 * numeric series per category. Multiple independent intervals per row would
 * require allocating N "slot" series sized to the busiest row in the whole
 * dataset — wasteful, awkward to sort, and it doesn't scale. A directly
 * positioned SVG rect per interval has none of those constraints.
 */

export interface TimelineInterval {
  id: string;
  rowId: string;
  startMs: number;
  endMs: number;
  color: string;
  label?: string;
  tooltip: React.ReactNode;
}

export interface TimelineRow {
  id: string;
  label: string;
}

interface IntervalTimelineProps {
  rows: TimelineRow[];
  intervals: TimelineInterval[];
  /** Explicit domain in ms. If omitted, computed from intervals with padding. */
  domain?: [number, number];
  formatTick: (ms: number) => string;
  tickCount?: number;
  rowHeight?: number;
  barThickness?: number;
  leftLabelWidth?: number;
  minIntervalWidthPx?: number;
  emptyMessage?: string;
}

const MARGIN = { top: 8, right: 16, bottom: 28 };

export function IntervalTimeline({
  rows,
  intervals,
  domain,
  formatTick,
  tickCount = 5,
  rowHeight = 36,
  barThickness = 18,
  leftLabelWidth = 110,
  minIntervalWidthPx = 6,
  emptyMessage = "No data for this period.",
}: IntervalTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hover, setHover] = useState<{ interval: TimelineInterval; x: number; y: number } | null>(null);

  // Measure available width responsively. Must be useEffect, not useMemo:
  // useMemo runs during render, before containerRef is attached to the DOM,
  // so the observer would never attach to a real element and containerWidth
  // would stay 0 forever (this was the root cause of invisible bars and
  // clipped labels — the SVG was always rendering at width 0).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Set an initial measurement immediately so we don't wait for the
    // first resize event on mount.
    setContainerWidth(el.getBoundingClientRect().width);

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const resolvedDomain = useMemo<[number, number]>(() => {
    if (domain) return domain;
    if (intervals.length === 0) return [0, 1];
    const min = Math.min(...intervals.map((i) => i.startMs));
    const max = Math.max(...intervals.map((i) => i.endMs));
    const span = Math.max(max - min, 1);
    const pad = Math.max(span * 0.05, 1000 * 60 * 60 * 12);
    return [min - pad, max + pad];
  }, [domain, intervals]);

  const plotWidth = Math.max(containerWidth - leftLabelWidth - MARGIN.right, 0);
  const chartHeight = rows.length * rowHeight + MARGIN.top + MARGIN.bottom;

  const scaleX = (ms: number) => {
    const [d0, d1] = resolvedDomain;
    if (d1 === d0) return 0;
    return ((ms - d0) / (d1 - d0)) * plotWidth;
  };

  const ticks = useMemo(() => {
    const [d0, d1] = resolvedDomain;
    if (tickCount <= 1) return [d0];
    const step = (d1 - d0) / (tickCount - 1);
    return Array.from({ length: tickCount }, (_, i) => d0 + step * i);
  }, [resolvedDomain, tickCount]);

  const intervalsByRow = useMemo(() => {
    const map = new Map<string, TimelineInterval[]>();
    for (const row of rows) map.set(row.id, []);
    for (const interval of intervals) {
      const list = map.get(interval.rowId);
      if (list) list.push(interval);
    }
    // Chronological order within each row for predictable left-to-right rendering
    for (const list of map.values()) list.sort((a, b) => a.startMs - b.startMs);
    return map;
  }, [rows, intervals]);

  if (rows.length === 0 || intervals.length === 0) {
    return (
      <p className="text-sm text-text-secondary py-6 text-center">{emptyMessage}</p>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg width="100%" height={chartHeight} role="img">
        {/* Vertical gridlines at each tick */}
        {containerWidth > 0 &&
          ticks.map((t, i) => {
            const x = leftLabelWidth + scaleX(t);
            return (
              <line
                key={i}
                x1={x}
                x2={x}
                y1={MARGIN.top}
                y2={chartHeight - MARGIN.bottom}
                stroke={COLORS.border}
                strokeDasharray="3 3"
              />
            );
          })}

        {/* Row labels + interval bars */}
        {rows.map((row, rowIndex) => {
          const y = MARGIN.top + rowIndex * rowHeight;
          const rowIntervals = intervalsByRow.get(row.id) ?? [];
          const barY = y + (rowHeight - barThickness) / 2;

          return (
            <g key={row.id}>
              <text
                x={leftLabelWidth - 10}
                y={y + rowHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill={COLORS.textSecondary}
              >
                {row.label}
              </text>

              {containerWidth > 0 &&
                rowIntervals.map((interval) => {
                  const x0 = scaleX(interval.startMs);
                  const x1 = scaleX(interval.endMs);
                  const width = Math.max(x1 - x0, minIntervalWidthPx);
                  return (
                    <rect
                      key={interval.id}
                      x={leftLabelWidth + x0}
                      y={barY}
                      width={width}
                      height={barThickness}
                      rx={4}
                      fill={interval.color}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) =>
                        setHover({ interval, x: e.clientX, y: e.clientY })
                      }
                      onMouseMove={(e) =>
                        setHover({ interval, x: e.clientX, y: e.clientY })
                      }
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                })}
            </g>
          );
        })}

        {/* X axis */}
        {containerWidth > 0 &&
          ticks.map((t, i) => {
            const x = leftLabelWidth + scaleX(t);
            return (
              <text
                key={i}
                x={x}
                y={chartHeight - MARGIN.bottom + 16}
                textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
                fontSize={10}
                fill={COLORS.textSecondary}
              >
                {formatTick(t)}
              </text>
            );
          })}
        <line
          x1={leftLabelWidth}
          x2={leftLabelWidth + plotWidth}
          y1={chartHeight - MARGIN.bottom}
          y2={chartHeight - MARGIN.bottom}
          stroke={COLORS.border}
        />
      </svg>

      {hover && (
        <div
          className="fixed z-50 bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-md pointer-events-none"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {hover.interval.tooltip}
        </div>
      )}
    </div>
  );
}