import { Router } from "express";
import {
    createEquipment,
    deleteEquipment,
    getEquipment,
    updateEquipment,
} from "./quipment.controller.ts";
import {
    mobileAuthMiddleware,
    webAuthMiddleware,
} from "../../middleware/authenticate.ts";

const equipmentRoutes = Router();

equipmentRoutes.get("/mobile", mobileAuthMiddleware, getEquipment);
equipmentRoutes.get("/web", webAuthMiddleware, getEquipment);

equipmentRoutes.post("/create-equipment", webAuthMiddleware, createEquipment);
equipmentRoutes.patch("/web/:id", webAuthMiddleware, updateEquipment);
equipmentRoutes.delete("/web/:id", webAuthMiddleware, deleteEquipment);

export default equipmentRoutes;
