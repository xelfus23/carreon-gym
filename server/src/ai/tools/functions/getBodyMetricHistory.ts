import { WebSocket } from "ws";
import { getBodyMetricsHistoryQuery } from "../../../repositories/user.repository.ts";

export const getBodyMetricsHistory = async (
  ws: WebSocket,
  args: any,
  userId: number,
) => {

  const { limit } = args

  return await getBodyMetricsHistoryQuery(userId, limit);
};
