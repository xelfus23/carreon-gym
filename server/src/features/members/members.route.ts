import { Router } from "express";
import { webAuthMiddleware } from "../../middleware/authenticate.ts";
import { getMembers, verifyMember } from "./member.controller.ts";

const memberRoutes = Router();

memberRoutes.use(webAuthMiddleware);
memberRoutes.get("", getMembers);
memberRoutes.patch("/verify/:id", verifyMember);

export default memberRoutes;
