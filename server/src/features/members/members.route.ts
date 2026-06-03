import { Router } from "express";
import {
  banAccount,
  deleteAccount,
  getMembers,
  suspendAccount,
  verifyAccount,
} from "./member.controller.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { authorizeRoles } from "../../middleware/roleGuard.ts";

const memberRoutes = Router();

memberRoutes.get("", authMiddleware, authorizeRoles("admin"), getMembers);
memberRoutes.patch("/verify/:id", authMiddleware, authorizeRoles("admin"), verifyAccount);
memberRoutes.patch("/suspend/:id", authMiddleware, authorizeRoles("admin"), suspendAccount);
memberRoutes.patch("/ban/:id", authMiddleware, authorizeRoles("admin"), banAccount);
memberRoutes.delete("/delete/:id", authMiddleware, authorizeRoles("admin"), deleteAccount);

export default memberRoutes;
