// WEB - AuthProvider.tsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import { authService, SessionExpiredError } from "../services/auth.service";
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

    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearRefreshTimer = () => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    };

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

    /**
     * Schedule a proactive token refresh 1 minute before expiry.
     * Call this after every successful login or token refresh.
     * Default assumes 15-minute access tokens → refresh at 14 minutes.
     */
    const scheduleRefresh = useCallback(
        (expiresInMs: number = 14 * 60 * 1000) => {
            clearRefreshTimer();

            const delay = Math.max(expiresInMs, 5_000);

            refreshTimerRef.current = setTimeout(async () => {
                try {
                    await authService.refreshToken();
                    console.log("[Auth] Token proactively refreshed.");
                    scheduleRefresh();
                } catch (err) {
                    console.warn("[Auth] Proactive refresh failed:", err);
                    if (err instanceof SessionExpiredError) {
                        logout();
                    }
                }
            }, delay);
        },
        [logout],
    );

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
                    scheduleRefresh();
                } else {
                    localStorage.removeItem("careon_user");
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (err) {
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
    }, [scheduleRefresh]);

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
