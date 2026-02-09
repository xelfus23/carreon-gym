import type { Request, Response } from "express";
import { getEquipmentDomain } from "../../domain/equipments/getEquipments.ts";

export const getEquipment = async (req: Request, res: Response) => {
    try {
        const data = getEquipmentDomain();
        return res.status(200).json({
            success: true,
            message: "Euquipment Retrieved",
            data,
        });
    } catch (err) {
        if (err instanceof Error) {
            return res
                .status(500)
                .json({ success: false, message: "Server Error" });
        }
    }
};
