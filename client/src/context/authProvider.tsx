import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { authService } from "../services/auth.service";
import { AuthUser } from "../types/users";
import { AuthContextType } from "../types/context";
import { authStorage } from "../utils/authStorage";
import { useRouter, useSegments } from "expo-router";
import { tokenManager } from "../utils/tokenManager";

const AuthContext = createContext<AuthContextType | null>(null);

// Auth Context Provider
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // authentication states (user, isAuthenticated, isLoading)
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // segments (app pages)
    const segments = useSegments();

    // router for switching page
    const router = useRouter();

    // logout function
    const logout = useCallback(async () => {
        // get the saved refresh tokens.
        const token = tokenManager.getRefreshToken();

        // reset
        setUser(null);
        setIsAuthenticated(false);

        try {
            // if there is token continue logout service.
            if (token) await authService.logout(token);
        } catch (e) {
            console.warn("Logout API call failed:", e);
        } finally {
            await authStorage.clear();
            tokenManager.clear();
        }
    }, []);

    useEffect(() => {
        // useEffect - run initially

        const restoreSession = async () => {
            // try to restore session if there's a refresh token available.
            try {
                // load the tokens and the stored user.

                console.log("Attempting to retrieve session.");
                const {
                    accessToken,
                    refreshToken,
                    user: storedUser,
                } = await authStorage.load();

                if (!accessToken || !refreshToken) {
                    console.log("No access or refresh token — session not restored.");
                    await authStorage.clear();
                    tokenManager.clear();
                    return;
                }

                tokenManager.set(accessToken, refreshToken); // there's token available - set token state

                try {
                    const data = await authService.me(); // AuthService.Me() - get the user initial data (email, contact, etc.)
                    setUser(data.user ?? storedUser); // store the user data into User state.
                    setIsAuthenticated(true); // set authenticated true
                } catch (e) {
                    // Any failed session validation means we should not trust cached auth.
                    // This prevents navigating into protected routes when backend is offline.
                    await logout();
                }
            } catch (e) {
                console.error("Session restore failed:", e);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, [logout]); // [logout] as function dependency — only runs once on mount and when the logout function is loaded

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
