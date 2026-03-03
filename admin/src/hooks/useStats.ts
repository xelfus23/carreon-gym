import { useEffect, useState } from "react";
import { statsService } from "../services/statsService";

export interface DashboardStats {
    total_members: number;
    active_subscriptions: number;
    todays_checkins: number;
    new_members_this_month: number;
    // Revenue
    revenue_this_month: number;
    revenue_last_month: number;
    revenue_growth_percent: number;
    // Peak hours
    peak_hour_today: number | null; // 0–23
    avg_daily_duration_minutes: number;
    // Retention
    expiring_soon: number; // subscriptions expiring in next 7 days
}

export interface ChartDataPoint {
    month: string; // e.g. "Jan", "Feb"
    visits: number;
    revenue?: number;
}

export interface PeakHourDataPoint {
    hour: string; // e.g. "6AM", "7AM"
    checkins: number;
}

export const useStats = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [peakHourData, setPeakHourData] = useState<PeakHourDataPoint[]>([]);
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
                    setPeakHourData(data.peakHourData);
                }
            } catch (err) {
                if (!cancelled) {
                    if (err instanceof Error) {
                        console.error(err.message);
                        setError(err.message);
                    }
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

    return { stats, chartData, peakHourData, isLoading, error, refetch };
};
