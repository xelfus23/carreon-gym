import { authService } from "./auth.service";

const API_URL = import.meta.env.VITE_SERVER_URL;

export const statsService = {
  getStats: async () => {
    const res = await authService.fetchWithRefresh(`${API_URL}/api/stats`, {
      method: "GET",
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    return data;
  },
};
