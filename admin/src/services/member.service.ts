import { authService } from "./auth.service";

const API_URL = import.meta.env.VITE_BASE_URL;

export const memberService = {
    getMember: async () => {
        const result = await authService.fetchWithRefresh(
            `${API_URL}/api/members`,
        );

        const data = await result.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        return data;
    },
    getAttendance: async () => {
        const result = await authService.fetchWithRefresh(
            `${API_URL}/api/attendance/log`,
        );

        const data = await result.json();

        return data;
    },
    verifyMember: async (memberId: number) => {
        const result = await authService.fetchWithRefresh(
            `${API_URL}/api/members/verify/${memberId}`,
            {
                method: "PATCH",
            },
        );

        const data = await result.json();

        return data;
    },
};
