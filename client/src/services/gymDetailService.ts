const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const gymDetailService = {
    getGymDetails: async () => {
        const response = await fetch(`${API_URL}/api/gym-details`);
        if (!response.ok) throw new Error("Failed to fetch gym details");
        return await response.json();
    },
};
