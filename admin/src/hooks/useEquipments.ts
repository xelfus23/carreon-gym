import { useCallback, useEffect, useState } from "react";
import { EquipmentService } from "../services/equipment.service";

export type EquipmentTypes = {
    id: number;
    equipment_name: string;
    category: string;
    target_muscles: string | null;
    description?: string;
    quantity?: number;
};

export type EquipmentPayload = {
    equipment_name: string;
    category: string;
    target_muscles: string;
    description?: string;
    quantity?: number;
};

export const useEquipments = () => {
    const [equipments, setEquipments] = useState<EquipmentTypes[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initialize = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await EquipmentService.getEquipment();
            console.log(data.data);
            setEquipments(data.data);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Failed to fetch equipment";
            setError(errorMessage);
            console.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createEquipment = useCallback(
        async (payload: EquipmentPayload) => {
            const data = await EquipmentService.createEquipment(payload);
            await initialize();
            return data;
        },
        [initialize],
    );

    const updateEquipment = useCallback(
        async (id: number, payload: Partial<EquipmentPayload>) => {
            const data = await EquipmentService.updateEquipment(id, payload);
            setEquipments((prev) =>
                prev.map((eq) => (eq.id === id ? { ...eq, ...payload } : eq)),
            );
            return data;
        },
        [],
    );

    const deleteEquipment = useCallback(async (id: number) => {
        const data = await EquipmentService.deleteEquipment(id);
        setEquipments((prev) => prev.filter((eq) => eq.id !== id));
        return data;
    }, []);

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
