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
import { tokenManager } from "../utils/tokenManager";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {

    },[])

    const logout = useCallback(async () => {
        const token = tokenManager.getRefreshToken();

        setUser(null);
        setIsAuthenticated(false);

        try {
            if (token) await authService.logout(token);
        } catch (e) {
            console.warn("Logout API call failed:", e);
        } finally {
            await authStorage.clear();
            tokenManager.clear();
        }
    }, []);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const {
                    accessToken,
                    refreshToken,
                    user: storedUser,
                } = await authStorage.load();

                if (!accessToken || !refreshToken) {
                    return;
                }

                tokenManager.set(accessToken, refreshToken);

                try {
                    const data = await authService.me();
                    setUser(data.user ?? storedUser);
                    setIsAuthenticated(true);
                } catch (e) {
                    if (
                        e instanceof Error &&
                        e.message === "Session expired. Please log in again."
                    ) {
                        await logout();
                    } else {
                        if (storedUser) {
                            setUser(storedUser);
                            setIsAuthenticated(true);
                        }
                    }
                }
            } catch (e) {
                console.error("Session restore failed:", e);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, [logout]); // ✅ Empty array — only runs once on mount

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
            const { user } = await authService.register({
                firstName,
                lastName,
                email,
                password,
                contactNumber,
            });

            setUser(user);
            setIsAuthenticated(true);
            return true;
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { user } = await authService.login(email, password);

            setUser(user);
            setIsAuthenticated(true);
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
