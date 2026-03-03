import type { Request, Response } from "express";
import { getMembersDomain } from "../../domain/members/getMembers.ts";
import { catchAsync } from "../../utils/catchAsync.ts";

export const getMembers = catchAsync(async (req: Request, res: Response) => {
    const members = await getMembersDomain();

    const formattedMembers = members.map((member) => ({
        ...member,
        attendance_rate: member.total_visits_this_month
            ? Math.round((member.total_visits_this_month / 12) * 100)
            : 0,
    }));

    return res.status(200).json({
        success: true,
        message: "Fetch success",
        data: formattedMembers,
    });
});
