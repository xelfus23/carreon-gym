import pool from "../config/pool.ts";

export const getEquipment = async () => {
    const query = `
    SELECT 
        e.name AS equipment_name, ec.name AS category, STRING_AGG(mg.name, ', ') AS target_muscles
    FROM 
        equipment e
    JOIN 
        equipment_category ec ON e.category_id = ec.id
    LEFT JOIN 
        equipment_muscle em ON e.id = em.equipment_id
    LEFT JOIN 
        muscle_group mg ON em.muscle_group_id = mg.id
    GROUP BY 
        e.id, e.name, ec.name;
    `;
    return await pool.query(query);
};
