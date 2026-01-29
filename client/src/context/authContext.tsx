import { createContext, useContext } from "react";

interface AuthContextType {
    register: () => Promise<void>;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const register = async () => {
        // REGISTRATION LOGIC

        return console.log("Registered");
    };

    const login = async () => {
        // LOGIN LOGIC
        return console.log("Logged in");
    };

    const logout = async () => {
        // LOGOUT LOGIC

        return console.log("Logged out");
    };

    return (
        <AuthContext.Provider value={{ register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    return useContext(AuthContext);
}
