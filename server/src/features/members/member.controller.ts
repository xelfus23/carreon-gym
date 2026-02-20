import type { Request, Response } from "express";
import { getMembersDomain } from "../../domain/members/getMembers.ts";

export const getMembers = async (req: Request, res: Response) => {
    try {
        console.log("GET MEMBERS");

        const members = await getMembersDomain();

        members.map((member) => ({
            ...member,
            attendance_rate: member.total_visits_this_month
                ? Math.round((member.total_visits_this_month / 12) * 100)
                : 0,
        }));

        return res.status(200).json({
            success: true,
            message: "Fetch success",
            data: members,
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: err.message });
        }
    }
};
