import type { Request, Response } from "express";
import { createUserSubscriptionDomain } from "../../domain/userSubscriptions/createUserSubscriptionDomain.ts";
import { cancelUserSubscriptionDomain } from "../../domain/userSubscriptions/cancelUserSubscriptionDomain.ts";
import { resetUserSubscriptionDomain } from "../../domain/userSubscriptions/resetUserSubscriptionDomain.ts";
import { getUserSubscriptionDomain } from "../../domain/userSubscriptions/getUserSubscriptionDomain.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { AppError } from "../../utils/appError.ts";

export const createUserSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const {
      user_id,
      plan_id,
      amount_override,
      duration_override,
      method,
      reference_no,
      notes,
    } = req.body;

    const targetUserId = Number(user_id);

    if (user_id == null || isNaN(targetUserId)) {
      throw new AppError("Valid User ID is required.", 400, "INVALID_USER_ID");
    }

    const targetPlanId = Number(plan_id);
    if (plan_id == null || isNaN(targetPlanId)) {
      throw new AppError(
        "Valid Plan ID is required. Fetch plans from GET /plans.",
        400,
        "INVALID_PLAN_ID",
      );
    }

    if (
      amount_override !== undefined &&
      (typeof amount_override !== "number" || amount_override < 0)
    ) {
      throw new AppError(
        "amount_override must be a non-negative number.",
        400,
        "INVALID_AMOUNT_OVERRIDE",
      );
    }

    if (
      duration_override !== undefined &&
      (!Number.isInteger(duration_override) || duration_override <= 0)
    ) {
      throw new AppError(
        "duration_override must be a positive integer (days).",
        400,
        "INVALID_DURATION_OVERRIDE",
      );
    }

    if (
      method &&
      !["cash", "gcash", "maya", "bank_transfer", "card", "other"].includes(
        method.toLowerCase(),
      )
    ) {
      throw new AppError(
        "Invalid payment method structure.",
        400,
        "INVALID_PAYMENT_METHOD",
      );
    }

    const recordedBy = (req as any).user?.id;

    const result = await createUserSubscriptionDomain(
      targetUserId,
      targetPlanId,
      recordedBy,
      {
        amountOverride: amount_override,
        durationOverride: duration_override,
        method: method?.toLowerCase(),
        referenceNo: reference_no,
        notes,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Subscription created and payment recorded successfully.",
      data: result,
    });
  },
);

export const cancelUserSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const targetUserId = Number(req.body.user_id);

    if (req.body.user_id == null || isNaN(targetUserId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid User ID is required." });
    }

    const result = await cancelUserSubscriptionDomain(targetUserId);

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled.",
      data: result,
    });
  },
);

export const resetUserSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const targetUserId = Number(req.body.user_id);

    if (req.body.user_id == null || isNaN(targetUserId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid User ID is required." });
    }

    const result = await resetUserSubscriptionDomain(targetUserId);

    return res.status(200).json({
      success: true,
      message: "Subscription reset completed.",
      data: result,
    });
  },
);

export const getUserSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);

    if (isNaN(userId) || !Number.isInteger(userId) || userId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id query structure." });
    }

    const subscription = await getUserSubscriptionDomain(userId);

    return res.status(200).json({ success: true, data: subscription });
  },
);
