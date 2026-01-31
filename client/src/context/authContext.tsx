import { createContext, useContext, useState } from "react";
import { authService } from "../services/authService";
import { AuthUser } from "../types/users";
import { AuthContextType } from "../types/interface";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<null | AuthUser>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const register = async (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        contactNumber: string,
    ) => {
        setIsLoading(true);

        try {
            const result: {
                success: boolean;
                message: string;
                data: { user: AuthUser };
            } = await authService.register(
                firstName,
                lastName,
                email,
                password,
                contactNumber,
            );

            if (!result.success) {
                throw new Error(result.message);
            }

            //=======SET USER=======//
            setIsAuthenticated(result.success);
            setUser(result.data.user);

            return true;
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const result = await authService.login(email, password);

            if (!result.success) {
                throw new Error(result.message);
            }

            //=======SET USER=======//
            setIsAuthenticated(result.success);
            setUser(result.data.user);

            return true;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsAuthenticated(false);
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
