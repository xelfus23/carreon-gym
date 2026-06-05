import type { Request, Response } from "express";
import { getEquipmentDomain } from "../../domain/equipments/getEquipmentsDomain.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { createEquipmentDomain } from "../../domain/equipments/createEquipmentDomain.ts";
import { updateEquipmentDomain } from "../../domain/equipments/updateEquipmentDomain.ts";
import { deleteEquipmentDomain } from "../../domain/equipments/deleteEquipmentDomain.ts";

export const getEquipment = catchAsync(async (req: Request, res: Response) => {
    const data = await getEquipmentDomain();

    return res.status(200).json({
        success: true,
        message: "Equipment Retrieved",
        data,
    });
});

export const createEquipment = catchAsync(
    async (req: Request, res: Response) => {
        const data = await createEquipmentDomain(req.body);

        return res.status(200).json({
            success: true,
            message: "Equipment Created",
            data,
        });
    },
);

export const updateEquipment = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const data = await updateEquipmentDomain(id as string, req.body);

        return res.status(200).json({
            success: true,
            message: "Equipment Updated",
            data,
        });
    },
);

export const deleteEquipment = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        await deleteEquipmentDomain(id as string);

        return res.status(200).json({
            success: true,
            message: "Equipment deleted successfully",
        });
    },
);
