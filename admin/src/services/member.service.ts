import { authService } from "./auth.service";

const BASE_URL = "192.168.1.150:4545";
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
