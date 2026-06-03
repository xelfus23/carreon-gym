import type { Request, Response } from "express";
import { getStatsDomain } from "../../domain/stats/getStats.ts";

export const getStatsController = async (_req: Request, res: Response) => {
  try {
    const data = await getStatsDomain();

    return res
      .status(200)
      .json({ success: true, message: "fetch complete", data: data });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);

      return res
        .status(500)
        .json({ success: false, message: err.message });
    }
  }
};
