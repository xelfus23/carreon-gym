import { API_URL } from "../constants";
import type { EquipmentProps } from "../types";
import { authService } from "./auth.service";


export const EquipmentService = {
  getEquipment: async () => {
    const response = await authService.fetchWithRefresh(
      `${API_URL}/api/equipments`,
      { method: "GET" },
    );
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },

  createEquipment: async (payload: EquipmentProps) => {
    const response = await authService.fetchWithRefresh(
      `${API_URL}/api/equipments/create-equipment`,
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

  updateEquipment: async (id: number, payload: Partial<EquipmentProps>) => {
    const response = await authService.fetchWithRefresh(
      `${API_URL}/api/equipments/web/${id}`,
      {
        method: "PATCH",
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
