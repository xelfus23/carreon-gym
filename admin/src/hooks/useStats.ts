import { useEffect, useState } from "react";
import { statsService } from "../services/stats.service";

export interface DashboardStats {
  total_members: number;
  active_subscriptions: number;
  todays_checkins: number;
  new_members_this_month: number;
  revenue_this_month: number;
  revenue_last_month: number;
  revenue_growth_percent: number;
  peak_hour_today: number | null;
  avg_daily_duration_minutes: number;
  expiring_soon: number;
}

export interface ChartDataPoint {
  month: string; // "Jan", "Feb" for monthly — "Mon", "Tue" for weekly
  visits: number;
  revenue?: number;
}

export interface PeakHourDataPoint {
  hour: string;
  checkins: number;
}

export interface RecentPayment {
  id: number;
  member_name: string;
  initials: string;
  amount: number;
  method: string;
  transaction_type: "plan" | "product";
  status: "paid" | "pending" | "refunded" | "cancelled" | "rejected";
  paid_at: string | null;
  item_name: string;
}

export interface NewMember {
  name: string;
  initials: string;
  created_at: string;
  plan_name: string;
  verified: boolean;
}

export interface PlanStat {
  plan_name: string;
  count: number;
  percent: number;
}

export const useStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [weeklyChartData, setWeeklyChartData] = useState<ChartDataPoint[]>([]);
  const [peakHourData, setPeakHourData] = useState<PeakHourDataPoint[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [newMembers, setNewMembers] = useState<NewMember[]>([]);
  const [planStats, setPlanStats] = useState<PlanStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await statsService.getStats();

        if (!cancelled) {
          setStats(data.stats);
          setChartData(data.chartData);
          setWeeklyChartData(data.weeklyChartData);
          setPeakHourData(data.peakHourData);
          setRecentPayments(data.recentPayments);
          setNewMembers(data.newMembers);
          setPlanStats(data.planStats);
        }
      } catch (err) {
        if (!cancelled && err instanceof Error) {
          console.error(err.message);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [trigger]);

  const refetch = () => setTrigger((t) => t + 1);

  return {
    stats,
    chartData,
    weeklyChartData,
    peakHourData,
    recentPayments,
    newMembers,
    planStats,
    isLoading,
    error,
    refetch,
  };
};
