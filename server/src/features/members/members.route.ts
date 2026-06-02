import { Router } from "express";
import { webAuthMiddleware } from "../../middleware/authenticate.ts";
import {
  banAccount,
  deleteAccount,
  getMembers,
  suspendAccount,
  verifyAccount,
} from "./member.controller.ts";

const memberRoutes = Router();

memberRoutes.use(webAuthMiddleware);
memberRoutes.get("", getMembers);
memberRoutes.patch("/verify/:id", verifyAccount);
memberRoutes.patch("/suspend/:id", suspendAccount);
memberRoutes.patch("/ban/:id", banAccount);
memberRoutes.delete("/delete/:id", deleteAccount);

export default memberRoutes;
