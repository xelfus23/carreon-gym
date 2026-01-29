import { Router } from "express";
import getEquipment from "../controller/equipmentController/getEquipment.ts";

const equipmentRouter = Router();
equipmentRouter.get("/", getEquipment);

export default equipmentRouter;
