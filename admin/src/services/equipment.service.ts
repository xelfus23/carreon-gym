import { authService } from "./auth.service";

const BASE_URL = "192.168.1.150:4545";
const API_URL = `http://${BASE_URL}`;

export const EquipmentService = {
    getEquipment: async () => {
        const response = await authService.fetchWithRefresh(
            `${API_URL}/api/equipments/web`,
            {
                method: "GET",
            },
        );

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        return data;
    },
};
