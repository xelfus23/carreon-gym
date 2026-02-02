import type { Request, Response } from "express";
import { getEquipment } from "../../utils/getEquipment.ts";

const getEquipmentController = async (req: Request, res: Response) => {
    try {
        const result = await getEquipment();
        const equipments = result.rows;
        return res.status(200).json({ success: true, equipments: equipments });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
    }
};

export default getEquipmentController;
