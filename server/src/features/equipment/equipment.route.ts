import { Router } from "express";
import { getEquipment } from "./quipment.controller.ts";
import { authentication } from "../../middleware/authenticate.ts";

const equipmentRoutes = Router();

equipmentRoutes.get("/", authentication, getEquipment);

export default equipmentRoutes;
