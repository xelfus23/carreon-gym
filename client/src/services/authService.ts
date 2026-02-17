import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const authService = {
    /** --------------------
     * Token Management
     * -------------------- */

    async fetchWithAuth(url: string, options: RequestInit = {}) {
        let res = await fetch(url, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        });

        // If access token expired
        if (res.status === 401) {
            try {
                await this.refreshAccessToken();

                res = await fetch(url, {
                    ...options,
                    headers: {
                        ...this.getHeaders(),
                        ...options.headers,
                    },
                });
            } catch (error) {
                if (error instanceof Error) {
                    console.error(error);
                }
                await this.logout();
                throw new Error("Session expired");
            }
        }

        return res;
    },

    setTokens(newAccessToken: string | null, newRefreshToken?: string | null) {
        accessToken = newAccessToken;

        if (newRefreshToken !== undefined) {
            refreshToken = newRefreshToken;
        }
    },

    getToken() {
        return accessToken;
    },

    getHeaders() {
        return {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        };
    },

    async refreshAccessToken() {
        if (!refreshToken) throw new Error("No refresh token");

        const res = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(`REFRESH FAILED: ${data.message}`);
        }

        const newAccessToken = String(data.data.accessToken);
        accessToken = newAccessToken;

        await SecureStore.setItemAsync("access_token", newAccessToken);

        return newAccessToken;
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
        const res = await fetch(`${API_URL}/api/users/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                password,
                phoneNumber: contactNumber,
            }),
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        if (data?.data?.accessToken) {
            const newAccessToken = String(data.data.accessToken);
            accessToken = newAccessToken;
        }

        if (data?.data?.refreshToken) {
            const newRefreshToken = String(data.data.refreshToken);
            refreshToken = newRefreshToken;
        }

        return data;
    },

    /** --------------------
     * Login user
     * -------------------- */
    async login(email: string, password: string) {
        const res = await fetch(`${API_URL}/api/auth/app`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        if (data?.data?.accessToken) {
            const newAccessToken = String(data.data.accessToken);
            accessToken = newAccessToken;
        }

        if (data?.data?.refreshToken) {
            const newRefreshToken = String(data.data.refreshToken);
            refreshToken = newRefreshToken;
        }

        return data;
    },

    /** --------------------
     * Get current authenticated user
     * -------------------- */
    async me() {
        const res = await this.fetchWithAuth(`${API_URL}/api/users/mobile/me`);

        const data = await res.json();

        if (!data.success) {
            throw new Error(`Error Fetching Profile: ${data.message}`);
        }

        return data;
    },

    /** --------------------
     * Logout user
     * -------------------- */
    async logout() {
        if (refreshToken) {
            await fetch(`${API_URL}/api/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });
        }

        accessToken = null;
        refreshToken = null;

        await SecureStore.deleteItemAsync("access_token");
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
