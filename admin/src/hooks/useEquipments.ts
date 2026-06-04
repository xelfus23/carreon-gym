import { useCallback, useEffect, useState } from "react";
import { EquipmentService } from "../services/equipment.service";
import type { EquipmentProps } from "../types";

export const useEquipments = () => {
  const [equipments, setEquipments] = useState<EquipmentProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await EquipmentService.getEquipment();
      setEquipments(data.data ?? []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch equipment";
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEquipment = async (payload: EquipmentProps) => {
    try {
      const data = await EquipmentService.createEquipment(payload);
      await initialize();
      return data;
    } catch (err) {
      if (err instanceof Error) console.error("Create error:", err.message);
      throw err;
    }
  };

  const updateEquipment = async (id: number, payload: Partial<EquipmentProps>) => {
    try {
      const response = await EquipmentService.updateEquipment(id, payload);
      await initialize();
      return response;
    } catch (err) {
      if (err instanceof Error) console.error("Update error:", err.message);
      throw err;
    }
  };

  const deleteEquipment = async (id: number) => {
    try {
      const data = await EquipmentService.deleteEquipment(id);
      await initialize();
      return data;
    } catch (err) {
      if (err instanceof Error) console.error("Delete error:", err.message);
      throw err;
    }
  };

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    equipments,
    isLoading,
    error,
    refresh: initialize,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  };
};