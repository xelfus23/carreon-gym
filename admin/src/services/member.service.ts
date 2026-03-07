import { authService } from "./auth.service";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_URL = `http://${BASE_URL}`;

export const memberService = {
    getMember: async () => {
        const result = await authService.fetchWithRefresh(
            `${API_URL}/api/members`,
            {
                method: "GET",
            },
        );

        const data = await result.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        return data;
    },
};
