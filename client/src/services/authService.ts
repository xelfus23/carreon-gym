import * as SecureStore from "expo-secure-store";
import { request } from "../utils/request";

let accessToken: string | null = null;
let refreshToken: string | null = null;

// Refresh lock — prevents concurrent refresh races
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let onSessionExpired: (() => void) | null = null;

function subscribeToRefresh(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

function notifyRefreshSubscribers(token: string) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
}

export const authService = {
    /** --------------------
     * Token Management
     * -------------------- */
    setSessionExpiredHandler(handler: () => void) {
        onSessionExpired = handler;
    },

    async fetchWithAuth(
        url: string,
        options: RequestInit = {},
    ): Promise<Response> {
        const makeRequest = (token: string | null) =>
            fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...options.headers,
                },
            });

        let res = await makeRequest(accessToken);
        if (res.status !== 401) return res;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                subscribeToRefresh(async (newToken) => {
                    try {
                        resolve(await makeRequest(newToken));
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }

        isRefreshing = true;
        try {
            const newToken = await this.refreshAccessToken();
            notifyRefreshSubscribers(newToken);
            res = await makeRequest(newToken);
        } catch (error) {
            if (error instanceof Error) {
                refreshSubscribers = [];
                await this.logout();
                onSessionExpired?.();
                console.error(error.message);
                throw new Error("Session expired. Please log in again.");
            }
        } finally {
            isRefreshing = false;
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
        if (!refreshToken) throw new Error("No refresh token available");

        const data = await request(`/auth/mobile/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        const newAccessToken = String(data.data.accessToken);

        accessToken = newAccessToken;

        // Persist updated token so restore works correctly after background/kill
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
        const data = await request(`/users/register`, {
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

        this.setTokens(
            data?.data?.accessToken ?? null,
            data?.data?.refreshToken ?? null,
        );

        return data.data;
    },

    /** --------------------
     * Login user
     * -------------------- */
    async login(email: string, password: string) {
        const data = await request(`/auth/mobile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        this.setTokens(
            data?.data?.accessToken ?? null,
            data?.data?.refreshToken ?? null,
        );

        return data.data;
    },

    /** --------------------
     * Get current authenticated user
     * -------------------- */
    async me() {
        return (await request(`/users/mobile/me`)).data;
    },

    /** --------------------
     * Logout user
     * -------------------- */
    async logout() {
        if (refreshToken) {
            try {
                await request(`/api/auth/mobile/logout`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken }),
                });
            } catch {
                // Fire-and-forget — clear locally regardless of server response
            }
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
        return (
            await request(`/users/${userId}`, {
                method: "PATCH",
                body: JSON.stringify(updates),
            })
        ).data;
    },

    /** --------------------
     * Update profile info
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
        return (
            await request(`/user-profiles/${userId}`, {
                method: "PATCH",
                body: JSON.stringify(profileUpdates),
            })
        ).data;
    },
};
