const BASE_URL = "192.168.1.150:4545";
const API_URL = `http://${BASE_URL}`;

let authToken: string | null = localStorage.getItem("careon_token");

export const authService = {
    setToken(token: string | null) {
        authToken = token;
        if (token) {
            localStorage.setItem("careon_token", token);
        } else {
            localStorage.removeItem("careon_token");
        }
    },

    getToken() {
        return authToken;
    },

    getHeaders() {
        return {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        };
    },

    async login(email: string, password: string) {
        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || "Login failed");
        }

        if (data?.data?.token) {
            this.setToken(data.data.token);
        }

        return data;
    },

    async me() {
        const res = await fetch(`${API_URL}/api/users/me`, {
            headers: this.getHeaders(),
        });
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
    },

    async logout() {
        this.setToken(null);
        localStorage.removeItem("careon_user");
    },
};
