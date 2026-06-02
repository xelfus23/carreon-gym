import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.ts";
import { getUsersDomain } from "../../domain/user/getUser.ts";
import { verifyAccountDomain } from "../../domain/members/verifyAccountDomain.ts";
import { deleteAccountDomain } from "../../domain/members/deleteAccountDomain.ts";
import { suspendAccountDomain } from "../../domain/members/suspendAccountDomain.ts";
import { banAccountDomain } from "../../domain/members/banAccountDomain.ts";

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

export const verifyAccount = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await verifyAccountDomain(Number(id));

  return res.status(200).json({
    success: true,
    message: "Verify Success",
    data: result,
  });
});

export const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await deleteAccountDomain(Number(id));

  return res.status(200).json({
    success: true,
    message: "Delete Success",
    data: result,
  });
});

export const suspendAccount = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await suspendAccountDomain(Number(id));

  return res.status(200).json({
    success: true,
    message: "Suspend status updated",
    data: result,
  });
});

export const banAccount = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await banAccountDomain(Number(id));

  return res.status(200).json({
    success: true,
    message: "Account banned",
    data: result,
  });
});