import { createContext } from "react";

interface AuthUser {
    id: string | number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface AuthContextType {
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AuthUser | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);
