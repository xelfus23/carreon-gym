import { useCallback, useEffect, useState } from "react";
import { EquipmentService } from "../services/equipment.service";
import type { EquipmentProps } from "../types";
import { uploadImage } from "../utils/uploadImage";

export type BarbellPlate = { weight_lb: number; quantity: number };
export type BarbellRod = { id: number; name: string; quantity: number; is_available: boolean };

export const useEquipments = () => {
  const [equipments, setEquipments] = useState<EquipmentProps[]>([]);
  const [dumbbells, setDumbbells] = useState<EquipmentProps[]>([]);
  const [barbellPlates, setBarbellPlates] = useState<BarbellPlate[]>([]);
  const [barbellRods, setBarbellRods] = useState<BarbellRod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await EquipmentService.getEquipment();
      const responseData = data.data;

      if (responseData && typeof responseData === "object" && "equipment" in responseData) {

        console.log(responseData)

        setEquipments(responseData.equipment ?? []);
        setDumbbells(responseData.dumbbells ?? []);
        setBarbellPlates(responseData.barbell_plates ?? []);
        setBarbellRods(responseData.barbell_rods ?? []);
      } else {
        setEquipments(Array.isArray(responseData) ? responseData : []);
        setDumbbells([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch equipment";
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEquipment = async (equipment: EquipmentProps, imageFile: File | null) => {
    try {
      let icon_url = equipment.icon_url || "";
      if (imageFile) {
        const upload = await uploadImage(imageFile, "equipments");
        if (upload?.success && upload.data?.url) icon_url = upload.data.url;
      }
      const data = await EquipmentService.createEquipment({ ...(equipment as EquipmentProps), icon_url });
      if (data.success) await initialize();
      return data;
    } catch (err) {
      if (err instanceof Error) console.error("Create error:", err.message);
      throw err;
    }
  };

  const updateEquipment = async (equipmentId: number, updates: Partial<EquipmentProps>, imageFile: File | null) => {
    try {
      const patch: Partial<EquipmentProps> = { ...updates };
      if (imageFile) {
        const upload = await uploadImage(imageFile, "equipments");
        if (upload.success && upload.data?.url) patch.icon_url = upload.data.url;
      }
      await EquipmentService.updateEquipment(equipmentId, patch);
      await initialize();
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

  useEffect(() => { initialize(); }, [initialize]);

  return {
    equipments,
    dumbbells,
    barbellPlates,
    barbellRods,
    isLoading,
    error,
    refresh: initialize,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  };
};