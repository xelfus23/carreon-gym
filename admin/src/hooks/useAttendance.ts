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

    const getAttendanceLog = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true); // Only show loading spinner on initial load
        setError(null);
        try {
            const result = await memberService.getAttendance();
            setLogs(result.data || result);
        } catch (err) {
            console.error(err);
            setError("Failed to load attendance logs");
        } finally {
            if (!isSilent) setIsLoading(false);
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

    useEffect(() => {
        const BASE_URL = import.meta.env.VITE_BASE_URL;
        const ws = new WebSocket(`ws://${BASE_URL}`);

        ws.onopen = () => console.log("✅ Attendance Socket Connected");

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("📩 Received WS Message:", message); // Debug this!

                // Check if the event matches exactly what the controller sends
                if (
                    message.type === "SYSTEM_NOTIFICATION" &&
                    message.event === "ATTENDANCE_UPDATE"
                ) {
                    console.log("🔄 Silent refresh triggered");
                    getAttendanceLog(true); // Pass true for silent update
                }
            } catch (err) {
                console.error("Attendance Socket Error:", err);
            }
        };

        ws.onerror = (e) => console.error("❌ WebSocket Error:", e);

        return () => {
            if (
                ws.readyState === WebSocket.OPEN ||
                ws.readyState === WebSocket.CONNECTING
            ) {
                ws.close();
            }
        };
    }, [getAttendanceLog]);

    return {
        logs,
        isLoading,
        error,
        refresh: getAttendanceLog,
        formatDate,
        formatTime,
    };
};
