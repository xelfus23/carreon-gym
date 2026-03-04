import { useCallback, useEffect, useState } from "react";
import { EquipmentService } from "../services/equipment.service";

type EquipmentTypes = {
    id: number;
    equipment_name: string;
    category: string;
    target_muscles: string
}

export const useEquipments = () => {
    const [equipments, setEquipments] = useState<EquipmentTypes[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initialize = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await EquipmentService.getEquipment();
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

    useEffect(() => {
        initialize();
    }, [initialize]);

    return {
        equipments,
        isLoading,
        error,
        refresh: initialize,
    };
};
