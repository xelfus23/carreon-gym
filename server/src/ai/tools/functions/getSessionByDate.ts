// ai/tools/functions/getSessionByDate.ts

import { WebSocket } from "ws";
import { getSessionByDateDomain } from "../../../domain/workout/getSesssionByDateDomain.ts";

export const getSessionByDate = async (
  _ws: WebSocket,
  args: { session_date: string },
  userId: number,
) => {
  return getSessionByDateDomain({ userId, session_date: args.session_date });
};