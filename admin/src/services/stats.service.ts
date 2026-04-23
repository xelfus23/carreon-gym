import { API_URL } from "../constants";
import { authService } from "./auth.service";

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
