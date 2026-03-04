import { useContext } from "react";
import { AuthContext } from "../contexts/createContext";

export function useAuthContext() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}