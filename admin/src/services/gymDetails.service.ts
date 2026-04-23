import { API_URL } from "../constants";
import type { gymDetailsProps } from "../types";

export const gymDetailService = {
  getGymDetails: async () => {
    const response = await fetch(`${API_URL}/api/gym-details`);
    if (!response.ok) throw new Error("Failed to fetch gym details");
    return await response.json();
  },

  updateGymDetails: async (payload: Partial<gymDetailsProps>) => {
    const response = await fetch(`${API_URL}/api/gym-details`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to update gym details");
    return await response.json();
  },
};
