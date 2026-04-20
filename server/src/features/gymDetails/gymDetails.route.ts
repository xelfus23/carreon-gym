import { Router } from "express";
import { getGymDetails, updateGymDetails } from "./gymDetails.controller.ts";

const gymDetailsRoute = Router();

gymDetailsRoute.get("", getGymDetails);
gymDetailsRoute.patch("", updateGymDetails);

export default gymDetailsRoute;
