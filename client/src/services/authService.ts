const API_URL = process.env.EXPO_PUBLIC_API_URL;

let authToken: string | null = null;

export const authService = {
    /** --------------------
     * Token Management
     * -------------------- */
    setToken(token: string | null) {
        authToken = token;
    },

    getToken() {
        if (!authToken) {
            return;
        }

        return authToken;
    },

    getHeaders() {
        return {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        };
    },

    /** --------------------
     * Register new user
     * -------------------- */
    async register(
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        contactNumber: string,
    ) {
        const res = await fetch(`${API_URL}/api/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                password,
                contactNumber,
            }),
        });
        const data = await res.json();

        if (data?.data?.token) {
            authToken = data.data.token;
        }

        return data;
    },

    /** --------------------
     * Login user
     * -------------------- */
    async login(email: string, password: string) {
        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (data?.data?.token) {
            authToken = data.data.token;
        }

        return data;
    },

    /** --------------------
     * Get current authenticated user
     * -------------------- */
    async me() {
        const res = await fetch(`${API_URL}/api/users/me`, {
            headers: this.getHeaders(),
        });

        return res.json();
    },

    /** --------------------
     * Logout user
     * -------------------- */
    async logout() {
        authToken = null;
    },

    /** --------------------
     * Update basic user info
     * -------------------- */
    async updateUser(
        userId: string | number,
        updates: Partial<{
            firstName: string;
            lastName: string;
            email: string;
            contactNumber: string;
        }>,
    ) {
        const res = await fetch(`${API_URL}/api/users/${userId}`, {
            method: "PATCH", // or "PUT" if your API expects full update
            headers: this.getHeaders(),
            body: JSON.stringify(updates),
        });

        const data = await res.json();
        return data;
    },

    /** --------------------
     * Update profile info (height, goal, activityLevel, etc.)
     * -------------------- */
    async updateProfile(
        userId: string | number,
        profileUpdates: Partial<{
            heightCm: number;
            gender: string;
            birthDate: string;
            goal: string;
            activityLevel: string;
        }>,
    ) {
        const res = await fetch(`${API_URL}/api/user-profiles/${userId}`, {
            method: "PATCH", // adjust if your API uses PUT
            headers: this.getHeaders(),
            body: JSON.stringify(profileUpdates),
        });

        const data = await res.json();
        return data;
    },
};
