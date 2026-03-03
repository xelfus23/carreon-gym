import type { Request, Response } from "express";
import { getEquipmentDomain } from "../../domain/equipments/getEquipments.ts";
import { catchAsync } from "../../utils/catchAsync.ts";

export const getEquipment = catchAsync(async (req: Request, res: Response) => {
    const data = await getEquipmentDomain();

    return res.status(200).json({
        success: true,
        message: "Euquipment Retrieved",
        data,
    });
});
