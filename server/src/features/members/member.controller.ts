import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.ts";
import { getUsersDomain } from "../../domain/user/getUser.ts";
import { verifyMemberDomain } from "../../domain/members/verifyMemberDomain.ts";

export const getMembers = catchAsync(async (req: Request, res: Response) => {
    const members = await getUsersDomain();

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

export const verifyMember = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await verifyMemberDomain(Number(id));

    return res.status(200).json({
        success: true,
        message: "Verify Success",
        data: result,
    });
});
