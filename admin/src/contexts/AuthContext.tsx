import React, { useEffect, useState } from "react";
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

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const token = authService.getToken();
                const savedUser = localStorage.getItem("careon_user");

                if (token && savedUser) {
                    setUser(JSON.parse(savedUser));
                    setIsAuthenticated(true);
                    // Verify token with backend
                    try {
                        const res = await authService.me();
                        if (res.success) {
                            setUser(res.data.user);
                            localStorage.setItem(
                                "careon_user",
                                JSON.stringify(res.data.user),
                            );
                        }
                    } catch (e) {
                        console.error("Token verification failed", e);
                        logout();
                    }
                }
            } catch (e) {
                console.error("Restore session error:", e);
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
            const { user, token } = result.data;

            setUser(user);
            setIsAuthenticated(true);
            authService.setToken(token);
            localStorage.setItem("careon_user", JSON.stringify(user));
            return true;
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        setIsAuthenticated(false);
        await authService.logout();
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
