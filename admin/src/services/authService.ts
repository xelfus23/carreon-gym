// authService.ts
const BASE_URL = "192.168.1.150:4545";
const API_URL = `http://${BASE_URL}`;

export const authService = {
    async login(email: string, password: string) {
        const res = await fetch(`${API_URL}/api/auth/web`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || "Login failed");
        }

        return data;
    },

    async me() {
        const res = await fetch(`${API_URL}/api/users/web/me`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Unauthorized");
        }
        return res.json();
    },

    async logout() {
        try {
            const res = await fetch(`${API_URL}/api/auth/web/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            const data = await res.json();
            return data;
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    },

    async refreshToken() {
        try {
            const res = await fetch(`${API_URL}/api/auth/web/refresh`, {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Token refresh failed");
            }

            return res.json();
        } catch (error) {
            console.error("Token refresh error:", error);
            throw error;
        }
    },
};
