const BASE_URL = "192.168.1.150:4545";
const API_URL = `http://${BASE_URL}`;

export const memberService = {
    getMember: async () => {
        const result = await fetch(`${API_URL}/api/members`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        const data = await result.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        return data;
    },
};
