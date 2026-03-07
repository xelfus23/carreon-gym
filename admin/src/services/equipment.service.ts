import { authService } from "./auth.service";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_URL = `http://${BASE_URL}`;

type EquipmentPayload = {
    equipment_name: string;
    category: string;
    target_muscles: string; // comma-separated e.g. "Chest,Arms"
    description?: string;
    quantity?: number;
};

export const EquipmentService = {
    getEquipment: async () => {
        const response = await authService.fetchWithRefresh(
            `${API_URL}/api/equipments/web`,
            { method: "GET" },
        );
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data;
    },

    createEquipment: async (payload: EquipmentPayload) => {
        const response = await authService.fetchWithRefresh(
            `${API_URL}/api/equipments/web`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            },
        );
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data;
    },

    updateEquipment: async (id: number, payload: Partial<EquipmentPayload>) => {
        const response = await authService.fetchWithRefresh(
            `${API_URL}/api/equipments/web/${id}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            },
        );
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data;
    },

    deleteEquipment: async (id: number) => {
        const response = await authService.fetchWithRefresh(
            `${API_URL}/api/equipments/web/${id}`,
            { method: "DELETE" },
        );
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        return data;
    },
};