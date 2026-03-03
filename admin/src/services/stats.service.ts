import { authService } from "./auth.service";

const BASE_URL = "192.168.1.150:4545";
const API_URL = `http://${BASE_URL}`;

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
