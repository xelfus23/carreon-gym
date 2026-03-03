// WEB - AuthProvider.tsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import { authService, SessionExpiredError } from "../services/authService";
import { AuthContext } from "./createContext";

interface AuthUser {
    id: string | number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Track the proactive refresh timer so we can clear it on logout
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearRefreshTimer = () => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    };

    /**
     * Schedule a proactive token refresh 1 minute before expiry.
     * Call this after every successful login or token refresh.
     * Default assumes 15-minute access tokens → refresh at 14 minutes.
     */
    const scheduleRefresh = useCallback(
        (expiresInMs: number = 14 * 60 * 1000) => {
            clearRefreshTimer();

            // Clamp: never schedule less than 5 seconds from now
            const delay = Math.max(expiresInMs, 5_000);

            refreshTimerRef.current = setTimeout(async () => {
                try {
                    await authService.refreshToken();
                    console.log("[Auth] Token proactively refreshed.");
                    // Schedule next refresh for another 14 minutes
                    scheduleRefresh();
                } catch (err) {
                    console.warn("[Auth] Proactive refresh failed:", err);
                    // fetchWithRefresh will handle the next 401 reactively,
                    // so we don't force-logout here — only on SessionExpiredError
                    if (err instanceof SessionExpiredError) {
                        logout();
                    }
                }
            }, delay);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const logout = useCallback(async () => {
        clearRefreshTimer();
        setIsInitializing(true);
        try {
            await authService.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem("careon_user");
            setIsInitializing(false);
        }
    }, []);

    // Restore session on mount — me() now silently refreshes on 401 internally
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const res = await authService.me();

                if (res.success && res.data?.user) {
                    setUser(res.data.user);
                    setIsAuthenticated(true);
                    localStorage.setItem(
                        "careon_user",
                        JSON.stringify(res.data.user),
                    );
                    // Token was valid (or just refreshed) — schedule next proactive refresh
                    scheduleRefresh();
                } else {
                    // Not authenticated — clean up any stale data
                    localStorage.removeItem("careon_user");
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (err) {
                // SessionExpiredError means refresh also failed → force to login
                if (err instanceof SessionExpiredError) {
                    console.warn("[Auth] Session fully expired on restore.");
                } else {
                    console.error("[Auth] Session restore error:", err);
                }
                localStorage.removeItem("careon_user");
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsInitializing(false);
            }
        };

        restoreSession();

        return () => clearRefreshTimer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setErrorMsg(null);

        try {
            const result = await authService.login(email, password);

            if (!result.success || !result.data?.user) {
                throw new Error(result.message || "Login failed");
            }

            const { user } = result.data;

            setUser(user);
            setIsAuthenticated(true);
            localStorage.setItem("careon_user", JSON.stringify(user));

            // Start the proactive refresh cycle after login
            scheduleRefresh();
        } catch (error) {
            setIsAuthenticated(false);
            setUser(null);

            if (error instanceof Error) {
                setErrorMsg(error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                login,
                logout,
                isAuthenticated,
                isInitializing,
                isLoading,
                errorMsg,
                user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
