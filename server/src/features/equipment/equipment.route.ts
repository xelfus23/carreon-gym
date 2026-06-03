import { Router } from "express";
import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  updateEquipment,
} from "./equipment.controller.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { authorizeRoles } from "../../middleware/roleGuard.ts";

const equipmentRoutes = Router();

equipmentRoutes.get("", authMiddleware, getEquipment);
equipmentRoutes.post("/create-equipment", authMiddleware, authorizeRoles("admin"), createEquipment);
equipmentRoutes.patch("/:id", authMiddleware, authorizeRoles("admin"), updateEquipment);
equipmentRoutes.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteEquipment);

export default equipmentRoutes;
