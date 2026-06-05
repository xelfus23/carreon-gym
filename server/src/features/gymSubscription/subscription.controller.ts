import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.ts";
import { getSubscriptionsDomain } from "../../domain/gymSubscription/getSubscriptionsDomain.ts";
import { createSubscriptionDomain } from "../../domain/gymSubscription/createSubscriptionDomain.ts";
import { updateSubscriptionDomain } from "../../domain/gymSubscription/updateSubscriptionDomain.ts";
import { AppError } from "../../utils/appError.ts";

export const getPlans = catchAsync(async (_req: Request, res: Response) => {
  const plans = await getSubscriptionsDomain();
  return res.status(200).json({ success: true, data: plans });
});

export const createSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const result = await createSubscriptionDomain(req.body);
    return res.status(200).json({
      success: true,
      message: "Subscription plan creation success.",
      data: result,
    });
  },
);

export const updateSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new AppError("Subscription ID required", 400);

    const result = await updateSubscriptionDomain(Number(id), req.body);
    return res.status(200).json({
      success: true,
      message: "Subscription update success.",
      data: result,
    });
  },
);

export const deleteSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: "Subscription plan deletion success.",
      data: null,
    });
  },
);

export const getSubscriptionPlans = catchAsync(
  async (_req: Request, res: Response) => {
    const plans = await getSubscriptionsDomain();

    return res.status(200).json({
      success: true,
      message: "Get subscription plan success.",
      data: plans,
    });
  },
);
