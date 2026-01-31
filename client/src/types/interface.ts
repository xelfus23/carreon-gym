import { AuthUser } from "./users";

export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    register: (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        contactNumber: string,
    ) => Promise<boolean>;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    user: AuthUser | null;
}
