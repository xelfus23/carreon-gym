import * as SecureStore from "expo-secure-store";
import { request } from "../utils/request";

let accessToken: string | null = null;
let refreshToken: string | null = null;

// Refresh lock — prevents concurrent refresh races
let isRefreshing = false;
type RefreshSubscriber = {
    resolve: (token: string) => void;
    reject: (err: Error) => void;
};
let refreshSubscribers: RefreshSubscriber[] = [];
let onSessionExpired: (() => void) | null = null;

function notifyRefreshSubscribers(token: string) {
    refreshSubscribers.forEach((s) => s.resolve(token));
    refreshSubscribers = [];
}

function rejectRefreshSubscribers(error: Error) {
    refreshSubscribers.forEach((s) => s.reject(error));
    refreshSubscribers = [];
}

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

        // If we don't have a refresh token, we can't refresh - throw error without logging out
        // This prevents logout when tokens haven't been loaded yet (e.g. during app initialization)
        if (!refreshToken) {
            throw new Error("No refresh token available. Please log in again.");
        }

        // Queue concurrent requests while refresh is in-flight
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshSubscribers.push({
                    resolve: async (newToken: string) => {
                        try {
                            const retryRes = await makeRequest(newToken);
                            resolve(retryRes);
                        } catch (e) {
                            reject(e);
                        }
                    },
                    reject: (err: Error) => reject(err),
                });
            });
        }

        isRefreshing = true;

        try {
            const newToken = await this.refreshAccessToken();
            notifyRefreshSubscribers(newToken);
            return await makeRequest(newToken);
        } catch (error) {
            // Clear tokens before calling onSessionExpired to prevent logout() from
            // making an authenticated request that would trigger another refresh attempt
            accessToken = null;
            refreshToken = null;
            
            // Reject all queued subscribers so they don't hang
            const refreshError = error instanceof Error 
                ? error 
                : new Error("Session expired. Please log in again.");
            rejectRefreshSubscribers(refreshError);
            
            // Only call onSessionExpired if we actually attempted refresh (we had a refresh token)
            onSessionExpired?.();
            console.error("Token refresh failed:", error);
            throw refreshError;
        } finally {
            isRefreshing = false;  
        }
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

        const res = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: refreshToken }),
        });

        if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);

        const data = await res.json();

        const newAccessToken = data?.data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken; // ✅ grab rotated token

        if (!newAccessToken)
            throw new Error("No access token in refresh response");

        accessToken = newAccessToken;
        if (newRefreshToken) {
            refreshToken = newRefreshToken; // ✅ update in memory
            await SecureStore.setItemAsync("refresh_token", newRefreshToken); // ✅ persist
        }

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
        const { data } = await request(`/auth/mobile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        this.setTokens(data?.accessToken ?? null, data?.refreshToken ?? null);

        return data;
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
        // If we already have no refresh token (e.g. tokens were cleared before logout),
        // just clear local storage and return
        if (!refreshToken) {
            accessToken = null;
            refreshToken = null;
            await SecureStore.deleteItemAsync("access_token");
            await SecureStore.deleteItemAsync("refresh_token");
            return;
        }

        // Try to notify server, but clear locally regardless of response
        try {
            await request(`/auth/mobile/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });
        } catch {
            // Fire-and-forget — clear locally regardless of server response
        }

        accessToken = null;
        refreshToken = null;

        await SecureStore.deleteItemAsync("access_token");
        await SecureStore.deleteItemAsync("refresh_token");
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
