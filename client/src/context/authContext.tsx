import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import { AuthUser } from "../types/users";
import { AuthContextType } from "../types/interface";
import { authStorage } from "../utils/authStorage";
import { StackNavigationProp } from "../types/stackParam";
import { useNavigation } from "expo-router";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // 🔑 start true

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const { user, token } = await authStorage.load();

                if (user && token) {
                    setUser(user);
                    setIsAuthenticated(true);
                    authService.setToken(token);
                }
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    useEffect(() => {
        console.log("IS AUTHENTICATED: ", isAuthenticated, "USER: ", user);
    }, [isAuthenticated, user]);

    const register = async (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        contactNumber: string,
    ) => {
        setIsLoading(true);
        try {
            const result = await authService.register(
                firstName,
                lastName,
                email,
                password,
                contactNumber,
            );

            if (!result.success) throw new Error(result.message);

            const { user, token } = result.data;

            setUser(user);
            setIsAuthenticated(true);
            await authStorage.save(user, token);

            return true;
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const result = await authService.login(email, password);
            if (!result.success) throw new Error(result.message);

            const { user, token } = result.data;

            setUser(user);
            console.log(token);
            setIsAuthenticated(true);
            authService.setToken(token);
            await authStorage.save(user, token);
            return true;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        setIsAuthenticated(false);
        await authService.logout();
        await authStorage.clear();
    };

    return (
        <AuthContext.Provider
            value={{
                register,
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

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
