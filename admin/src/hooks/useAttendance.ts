import { useState, useEffect, useCallback } from "react";
import { memberService } from "../services/member.service";

export type AttendanceLogProps = {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    check_in_time: string;
    check_out_time: string | null;
    status: "checked_in" | "checked_out";
    method: "qr" | "manual" | "admin";
    duration: number | null;
};

export const useAttendanceLog = () => {
    const [logs, setLogs] = useState<AttendanceLogProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getAttendanceLog = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await memberService.getAttendance();

            console.log(result.data);
            // Assuming result.data contains the array of logs
            setLogs(result.data || result);
        } catch (err) {
            setError("Failed to load attendance logs");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        getAttendanceLog();
    }, [getAttendanceLog]);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return "--:--";
        return new Date(dateStr).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    return {
        logs,
        isLoading,
        error,
        refresh: getAttendanceLog,
        formatDate,
        formatTime,
    };
};
