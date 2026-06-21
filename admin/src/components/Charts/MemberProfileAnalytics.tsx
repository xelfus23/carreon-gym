import { useMemo } from "react";
import type { UserAccountProps } from "../../types";
import { ChevronLeft } from "lucide-react";
import SubscriptionTimelineChart from "./SubscriptionTimelineChart";
import CheckInTimelineChart from "./CheckInTimelineChart";
import SessionDurationTrendChart from "./SessionDurationTrendChart";

interface MemberProfileAnalyticsProps {
  user: UserAccountProps;
  onBack: () => void;
}

// Shared section eyebrow — keeps every section header visually identical
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1 h-3 rounded-full bg-primary/60" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
        {children}
      </span>
    </div>
  );
}

// Shared metric card — label, big value, short caption
function MetricCard({
  label,
  value,
  caption,
  tone = "neutral",
}: {
  label: string;
  value: string;
  caption: string;
  tone?: "primary" | "danger" | "neutral";
}) {
  const valueColor =
    tone === "primary" ? "text-primary" : tone === "danger" ? "text-danger" : "text-text-primary";
  return (
    <div className="bg-background p-4 rounded-xl border border-border">
      <p className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">{label}</p>
      <p className={`text-2xl font-black mt-1.5 truncate ${valueColor}`} title={value}>{value}</p>
      <p className="text-[10px] text-text-secondary mt-1">{caption}</p>
    </div>
  );
}

export default function MemberProfileAnalytics({ user, onBack }: MemberProfileAnalyticsProps) {

  // ── DERIVED METRICS ──────────────────────────────────────────────────
  const {
    peakHourLabel,
    currentPlanName,
    renewalDateLabel,
    streakLabel,
    trendLabel,
    trendIsUp,
  } = useMemo(() => {
    const logs = user.attendance_logs ?? [];

    // Peak gym hour = mode of check_in hour
    const hourCounts: Record<number, number> = {};
    logs.forEach((log) => {
      const d = new Date(log.check_in);
      if (Number.isNaN(d.getTime())) return;
      const h = d.getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    let peakHour: number | null = null;
    let peakCount = 0;
    Object.entries(hourCounts).forEach(([h, count]) => {
      if (count > peakCount) {
        peakCount = count;
        peakHour = Number(h);
      }
    });

    const peakHourLabel = peakHour === null
      ? "—"
      : (() => {
        const period = peakHour >= 12 ? "PM" : "AM";
        const displayH = peakHour % 12 === 0 ? 12 : peakHour % 12;
        return `${displayH}:00 ${period}`;
      })();

    // Current plan = subscription with status "active", falling back to most recent by expiry
    const subs = user.subscriptions ?? [];
    const activeSub = subs.find((s) => s.status === "active");
    const fallbackSub = [...subs].sort(
      (a, b) => new Date(b.expiry_date || "").getTime() - new Date(a.expiry_date || "").getTime()
    )[0];
    const planSub = activeSub ?? fallbackSub;

    const currentPlanName = planSub?.plan_name ?? "No active plan";

    const renewalDateLabel = planSub?.expiry_date
      ? new Date(planSub.expiry_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "—";

    // Current streak = consecutive days up to today (or yesterday) with at least one check-in
    const checkInDays = new Set(
      logs
        .map((log) => {
          const d = new Date(log.check_in);
          return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
        })
        .filter((k): k is string => k !== null)
    );

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    // Allow today to be "open" (no visit yet) without breaking a streak that ended yesterday
    if (!checkInDays.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (checkInDays.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const streakLabel = `${streak} ${streak === 1 ? "day" : "days"}`;

    // Trend = this month's visits vs last month's visits
    const now = new Date();
    const thisMonthCount = logs.filter((log) => {
      const d = new Date(log.check_in);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthCount = logs.filter((log) => {
      const d = new Date(log.check_in);
      return (
        !Number.isNaN(d.getTime()) &&
        d.getFullYear() === lastMonthDate.getFullYear() &&
        d.getMonth() === lastMonthDate.getMonth()
      );
    }).length;

    let trendLabel = "—";
    let trendIsUp = true;
    if (lastMonthCount === 0 && thisMonthCount === 0) {
      trendLabel = "No visits yet";
    } else if (lastMonthCount === 0) {
      trendLabel = "New activity";
    } else {
      const deltaPct = Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
      trendIsUp = deltaPct >= 0;
      trendLabel = `${deltaPct >= 0 ? "+" : ""}${deltaPct}% vs last mo.`;
    }

    return { peakHourLabel, currentPlanName, renewalDateLabel, streakLabel, trendLabel, trendIsUp };
  }, [user.attendance_logs, user.subscriptions]);

  return (
    <div className="w-full space-y-7 font-mulish rounded-xl text-text-primary transition-all duration-300">

      {/* ── PROFILE HEADER ROW ────────────────────────────── */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <button
          onClick={onBack}
          aria-label="Close profile"
          className=" text-text-secondary hover:text-text-primary transition-all cursor-pointer"
        >
          <ChevronLeft className="w-6 aspect-square" />
        </button>
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg border border-primary/20 shrink-0">
          {user.first_name?.[0]}{user.last_name?.[0]}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-black text-text-primary truncate">
            {user.first_name} {user.last_name}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            User ID #{user.id} · Member since{" "}
            {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <span
            className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${user.account_status === "active"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-danger/10 text-danger border border-danger/20"
              }`}
          >
            {user.account_status}
          </span>
        </div>
      </div>

      {/* ── METRIC SNAPSHOT CARDS GRID ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Current Plan"
          value={currentPlanName}
          caption="Active subscription"
        />
        <MetricCard
          label="Renews"
          value={renewalDateLabel}
          caption="Plan expiry date"
        />
        <MetricCard
          label="Visits / Month"
          value={String(user.total_visits_this_month ?? 0)}
          caption="Target: 12"
          tone="primary"
        />
        <MetricCard
          label="Trend"
          value={trendLabel}
          caption="Month over month"
          tone={trendIsUp ? "primary" : "danger"}
        />
        <MetricCard
          label="Current Streak"
          value={streakLabel}
          caption="Consecutive days active"
          tone="primary"
        />
        <MetricCard
          label="Consistency"
          value={Number.isFinite(user.attendance_rate) ? `${(user.attendance_rate * 100).toFixed(0)}%` : "—"}
          caption="Completion index"
          tone="primary"
        />
        <MetricCard
          label="Peak Hour"
          value={peakHourLabel}
          caption="Most frequent check-in"
        />
        <MetricCard
          label="Last Check-In"
          value={
            user.last_check_in
              ? new Date(user.last_check_in).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : "—"
          }
          caption={user.last_check_in ? "Most recent sync" : "No check-ins yet"}
        />
      </div>

      <div className="space-y-2.5">
        <SectionLabel>Subscription Timeline</SectionLabel>
        <SubscriptionTimelineChart user={user} />
      </div>

      {/* ── SECTION B: CHECK-IN ACTIVITY ───────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-2.5">
          <SectionLabel>Daily Check-Ins — Last 14 Days</SectionLabel>
          <CheckInTimelineChart user={user} daysToShow={14} />
        </div>

        <div className="space-y-2.5">
          <SectionLabel>Session Duration Trend — Weekly Avg</SectionLabel>
          <SessionDurationTrendChart user={user} />
        </div>
      </div>

    </div>
  );
}