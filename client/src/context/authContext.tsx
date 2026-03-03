//MOBILE
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { authService } from "../services/authService";
import { AuthUser } from "../types/users";
import { AuthContextType } from "../types/context";
import { authStorage } from "../utils/authStorage";
import { useRouter, useSegments } from "expo-router";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const segments = useSegments();
    const router = useRouter();

    const logout = useCallback(async () => {
        setUser(null);
        setIsAuthenticated(false);
        await authService.logout();
        await authStorage.clear();
    }, []);

    useEffect(() => {
        authService.setSessionExpiredHandler(logout);
    }, [logout]);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const { user, accessToken, refreshToken } =
                    await authStorage.load();

                if (user && accessToken && refreshToken) {
                    authService.setTokens(accessToken, refreshToken);

                    try {
                        const data = await authService.me();
                        setUser(data.user ?? user);
                        setIsAuthenticated(true);
                    } catch (e) {
                        if (
                            e instanceof Error &&
                            e.message ===
                                "Session expired. Please log in again."
                        ) {
                            await logout();
                        } else {
                            setUser(user);
                            setIsAuthenticated(true);
                            authService.setTokens(accessToken, refreshToken);
                        }
                    }
                }
            } catch (e) {
                if (e instanceof Error) {
                    console.error("Session restore failed:", e.message);
                }
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, [logout]);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(app)";

        if (isAuthenticated && !inAuthGroup) {
            router.replace("/(app)/(home)/(tabs)/dashboard");
        } else if (!isAuthenticated && inAuthGroup) {
            router.replace("/");
        }
    }, [isAuthenticated, segments, isLoading, router]);

    const register = async (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        contactNumber: string,
    ) => {
        setIsLoading(true);
        try {
            const { user, accessToken, refreshToken } =
                await authService.register(
                    firstName,
                    lastName,
                    email,
                    password,
                    contactNumber,
                );

            setUser(user);
            setIsAuthenticated(true);
            authService.setTokens(accessToken, refreshToken);
            await authStorage.save(user, accessToken, refreshToken);
            return true;
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { user, accessToken, refreshToken } = await authService.login(
                email,
                password,
            );

            console.log(user);

            setUser(user);
            setIsAuthenticated(true);
            authService.setTokens(accessToken, refreshToken);
            await authStorage.save(user, accessToken, refreshToken);
            return true;
        } finally {
            setIsLoading(false);
        }
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
