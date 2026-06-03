import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.ts";
import { getSubscriptionsDomain } from "../../domain/gymSubscription/getSubscriptionsDomain.ts";

export const getPlans = catchAsync(async (_req: Request, res: Response) => {
  const plans = await getSubscriptionsDomain();
  return res.status(200).json({ success: true, data: plans });
});

export const createSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {

})

export const deleteSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {

})

export const getSubscriptionPlans = catchAsync(async (_req: Request, res: Response) => {
  const plans = await getSubscriptionsDomain();

  return res.status(200).json({
    success: true,
    data: plans,
  });
});

