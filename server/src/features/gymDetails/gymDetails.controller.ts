import { getGymDetailsDomain } from "../../domain/gymDetails/getGymDetailsDomain.ts";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.ts";
import { updateGymDetailsDomain } from "../../domain/gymDetails/updateGymDomain.ts";

export const getGymDetails = catchAsync(async (req: Request, res: Response) => {
    const details = await getGymDetailsDomain();

    if (!details) {
        throw new Error("Gym details not found.");
    }

    return res.status(200).json({
        success: true,
        message: "Gym Details Retrieved",
        data: details,
    });
});

export const updateGymDetails = async (req: Request, res: Response) => {
    const updated = await updateGymDetailsDomain(req.body);

    return res.status(200).json({
        success: true,
        message: "Gym details updated successfully",
        data: updated,
    });
};
