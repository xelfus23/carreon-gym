import type { Request, Response } from "express";
import { subscriptionService } from "../../services/subscription.service.ts";

export const getPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await subscriptionService.getPlans();

    console.log(plans)

    return res.status(200).json({ success: true, data: plans });
  } catch (err) {
    console.error("Get plans error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch plans" });
  }
};

export const createForMember = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      plan_id,
      amount_override,
      duration_override,
      method,
      reference_no,
      notes,
    } = req.body as {
      user_id?: number;
      plan_id?: number;
      amount_override?: number;
      duration_override?: number;
      method?: string;
      reference_no?: string;
      notes?: string;
    };

    // ── Validate required fields ──
    if (user_id == null) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (plan_id == null) {
      return res.status(400).json({
        success: false,
        message:
          "Plan ID is required. Fetch available plans from GET /plans.",
      });
    }

    if (
      amount_override !== undefined &&
      (typeof amount_override !== "number" || amount_override < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "amount_override must be a non-negative number.",
      });
    }

    if (
      duration_override !== undefined &&
      (!Number.isInteger(duration_override) || duration_override <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "duration_override must be a positive integer (days).",
      });
    }

    // recordedBy comes from the authenticated admin's JWT payload
    const recordedBy = (req as any).user?.id as number;

    const result = await subscriptionService.createSubscription(
      Number(user_id),
      Number(plan_id),
      recordedBy,
      {
        amountOverride: amount_override,
        durationOverride: duration_override,
        method: method,
        referenceNo: reference_no,
        notes,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Subscription created and payment recorded successfully.",
      data: result,
    });
  } catch (err) {
    console.error("Admin create subscription error:", err);

    const message =
      err instanceof Error
        ? err.message
        : "Failed to create subscription";
    return res.status(500).json({ success: false, message });
  }
};

/** POST /api/admin/subscriptions/cancel — cancel a member's subscription */
export const cancelForMember = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body as { user_id?: number };

    console.log("server userid", user_id);

    if (user_id == null) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const result = await subscriptionService.cancelSubscription(
      Number(user_id),
    );

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled.",
      data: result,
    });
  } catch (err) {
    console.error("Admin cancel subscription error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to cancel subscription";
    return res.status(500).json({ success: false, message });
  }
};

export const resetForMember = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body as { user_id?: number };

    if (user_id == null) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const result = await subscriptionService.resetSubscription(
      Number(user_id),
    );

    return res.status(200).json({
      success: true,
      message: "Subscription reset completed.",
      data: result,
    });
  } catch (err) {
    console.error("Admin reset subscription error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to reset subscription";
    return res.status(500).json({ success: false, message });
  }
};

export const getForMember = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id." });
    }

    const subscription = await subscriptionService.getSubscription(userId);
    return res.status(200).json({ success: true, data: subscription });
  } catch (err) {
    console.error("Admin get subscription error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch subscription." });
  }
};

export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id." });
    }

    const payments = await subscriptionService.getPaymentHistory(userId);
    return res.status(200).json({ success: true, data: payments });
  } catch (err) {
    console.error("Admin get payment history error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history.",
    });
  }
};
