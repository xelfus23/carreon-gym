import { Router } from "express";
import { webAuthMiddleware } from "../../middleware/authenticate.ts";
import { deleteAccount, getMembers, verifyAccount } from "./member.controller.ts";

const memberRoutes = Router();

memberRoutes.use(webAuthMiddleware);
memberRoutes.get("", getMembers);
memberRoutes.patch("/verify/:id", verifyAccount);
memberRoutes.delete("/delete/id", deleteAccount)

export default memberRoutes;
