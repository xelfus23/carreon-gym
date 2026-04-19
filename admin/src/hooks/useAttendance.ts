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

/** Maps stored attempt reasons (codes or new human-readable strings) for display. */
export function formatAttemptReason(reason: string | null | undefined): string {
    if (reason == null || reason === "") return "—";
    const labels: Record<string, string> = {
        UNKNOWN_ERROR: "Unknown error",
        NO_SUBSCRIPTION: "No Subscription",
        UNAUTHORIZED_ACCESS: "No Subscription",
        ALREADY_CHECKED_IN: "Already Checked In",
        UNVERIFIED_USER: "Unverified User",
        USER_NOT_FOUND: "User Not Found",
        NOT_CHECKED_IN: "Not Checked In",
        COOLDOWN_ACTIVE: "Please wait before scanning again",
        INVALID_QR: "Invalid QR",
        INVALID_QR_DATA: "Invalid QR data",
    };
    return labels[reason] ?? reason;
}

export type AttendanceAttemptLog = {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    action: "check_in" | "check_out";
    result: "success" | "failed";
    reason: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
};

type AttendanceApiResponse = {
    sessions: AttendanceLogProps[];
    attempts: AttendanceAttemptLog[];
};

export const useAttendanceLog = () => {
    const [logs, setLogs] = useState<AttendanceLogProps[]>([]);
    const [attempts, setAttempts] = useState<AttendanceAttemptLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [latestFailureAlert, setLatestFailureAlert] =
        useState<AttendanceAttemptLog | null>(null);

    const getAttendanceLog = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true); // Only show loading spinner on initial load
        setError(null);
        try {
            const result = await memberService.getAttendance();
            const payload: AttendanceApiResponse = result.data || result;
            setLogs(payload.sessions || []);
            setAttempts(payload.attempts || []);
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
        const wsUrl = `ws://${BASE_URL}/ws/admin`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => console.log("✅ Attendance Socket Connected");

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("📩 Received WS Message:", message);

                if (
                    message.type === "SYSTEM_NOTIFICATION" &&
                    message.event === "ATTENDANCE_UPDATE"
                ) {
                    console.log("🔄 Silent refresh triggered");
                    getAttendanceLog(true); // Pass true for silent update
                }

                if (
                    message.type === "SYSTEM_NOTIFICATION" &&
                    message.event === "ATTENDANCE_ATTEMPT" &&
                    message.data?.type === "failed"
                ) {
                    setLatestFailureAlert({
                        id: Date.now(),
                        user_id: message.data.memberId ?? 0,
                        first_name: "Member",
                        last_name: `#${message.data.memberId ?? ""}`,
                        action: message.data.action ?? "check_in",
                        result: "failed",
                        reason:
                            message.data.reason != null &&
                            String(message.data.reason).trim() !== ""
                                ? formatAttemptReason(
                                      String(message.data.reason),
                                  )
                                : "Unknown error",
                        metadata: null,
                        created_at: new Date().toISOString(),
                    });
                    getAttendanceLog(true);
                }
            } catch (err) {
                console.error("Attendance Socket Error:", err);
            }
        };

        ws.onerror = (e) => console.error("❌ WebSocket Error:", e);

        return () => {
            // 1. Remove listeners so they don't trigger during unmount
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;

            // 2. Only close if it's not already closed
            if (
                ws.readyState === WebSocket.CONNECTING ||
                ws.readyState === WebSocket.OPEN
            ) {
                console.log("Cleaning up WS connection...");
                ws.close();
            }
        };
    }, [getAttendanceLog]);

    return {
        logs,
        attempts,
        isLoading,
        error,
        latestFailureAlert,
        clearFailureAlert: () => setLatestFailureAlert(null),
        refresh: getAttendanceLog,
        formatDate,
        formatTime,
    };
};
