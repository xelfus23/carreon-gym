import { Router } from "express";
import { getEquipment } from "./quipment.controller.ts";
import {
    mobileAuthMiddleware,
    webAuthMiddleware,
} from "../../middleware/authenticate.ts";

const equipmentRoutes = Router();

equipmentRoutes.get("/mobile", mobileAuthMiddleware, getEquipment);
equipmentRoutes.get("/web", webAuthMiddleware, getEquipment);

export default equipmentRoutes;
