import { UserProfile } from "../types/users";

export const profileService = {
    getProfile: async (token: string) => {
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/users/me`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (err) {
            console.error("Profile fetch failed:", err);
            throw err;
        }
    },

    updateProfile: async (token: string, updates: Partial<UserProfile>) => {
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/users/me`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer` },
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (err) {
            console.error("Profile update failed:", err);
        }
    },
};
