import type { gymDetailsType } from "../hooks/useGymDetails";

const API_URL = import.meta.env.VITE_BASE_URL;

export const gymDetailService = {
    getGymDetails: async () => {
        const response = await fetch(`${API_URL}/api/gym-details`);
        if (!response.ok) throw new Error("Failed to fetch gym details");
        return await response.json();
    },

    updateGymDetails: async (payload: Partial<gymDetailsType>) => {
        const response = await fetch(`${API_URL}/api/gym-details`, {
            method: "PATCH", // or PUT
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to update gym details");
        return await response.json();
    },
};
