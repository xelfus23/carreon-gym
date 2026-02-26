import { createContext } from "react";

interface AuthUser {
    id: string | number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface AuthContextType {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isInitializing: boolean;
    isLoading: boolean;
    errorMsg: string | null;
    user: AuthUser | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);
