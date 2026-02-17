// AuthProvider.tsx
import React, { useEffect, useState, useCallback } from "react";
import { authService } from "../services/authService";
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
    const [isLoading, setIsLoading] = useState(true);

    // Define logout with useCallback to avoid recreation
    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await authService.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem("careon_user");
            setIsLoading(false);
        }
    }, []);

    // Automatic token refresh
    useEffect(() => {
        if (!isAuthenticated) return;

        const refreshInterval = setInterval(
            async () => {
                try {
                    await authService.refreshToken();
                    console.log("Token refreshed automatically");
                } catch (error) {
                    console.error("Auto refresh failed:", error);
                    logout();
                }
            },
            14 * 60 * 1000,
        );

        return () => clearInterval(refreshInterval);
    }, [isAuthenticated, logout]);

    // Restore session on mount
    useEffect(() => {
        const restoreSession = async () => {
            try {
                // Try to get user from backend using cookie
                const res = await authService.me();

                if (res.success && res.data?.user) {
                    setUser(res.data.user);
                    setIsAuthenticated(true);
                    localStorage.setItem(
                        "careon_user",
                        JSON.stringify(res.data.user),
                    );
                } else {
                    localStorage.removeItem("careon_user");
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (e) {
                console.error("Session restore failed:", e);
                localStorage.removeItem("careon_user");
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const result = await authService.login(email, password);

            if (!result.success || !result.data?.user) {
                throw new Error(result.message || "Login failed");
            }

            const { user } = result.data;

            setUser(user);
            setIsAuthenticated(true);
            localStorage.setItem("careon_user", JSON.stringify(user));

            return true;
        } catch (error) {
            console.error("Login Error:", error);
            setIsAuthenticated(false);
            setUser(null);
            throw error;
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
                isLoading,
                user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
