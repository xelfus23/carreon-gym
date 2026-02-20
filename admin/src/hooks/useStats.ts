import { useEffect, useState } from "react";
import { statsService } from "../services/statsService";

export interface DashboardStats {
    total_members: number;
    active_subscriptions: number;
    todays_checkins: number;
    new_members_this_month: number;
}

export interface ChartDataPoint {
    month: string; // e.g. "Jan", "Feb"
    visits: number;
}

// interface UseStatsReturn {
//     stats: DashboardStats | null;
//     chartData: ChartDataPoint[];
//     isLoading: boolean;
//     error: string | null;
//     refetch: () => void;
// }

export const useStats = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
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

                setStats(data.stats);
                setChartData(data.chartData);

                if (!cancelled) {
                    setStats(data.stats);
                    setChartData(data.chartData);
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

    return { stats, chartData, isLoading, error, refetch };
};
