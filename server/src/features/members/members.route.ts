import { Router } from "express";
import { webAuthMiddleware } from "../../middleware/authenticate.ts";
import { getMembers } from "./member.controller.ts";

const memberRoutes = Router();

memberRoutes.use(webAuthMiddleware);

memberRoutes.get("", getMembers);

export default memberRoutes;
