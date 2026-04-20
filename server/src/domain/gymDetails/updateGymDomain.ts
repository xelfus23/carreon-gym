import pool from "../../config/pool.ts";

export const updateGymDetailsDomain = async (data: any) => {
  const {
      gym_name,
      address,
      contact_number,
      email,
      gcash_name,
      gcash_number,
      maya_name,
      maya_number,
      bank_details,
      opening_time,
      closing_time,
  } = data;

  const query = `
  UPDATE gym_details 
  SET 
    gym_name = COALESCE($1, gym_name),
    address = COALESCE($2, address),
    contact_number = COALESCE($3, contact_number),
    email = COALESCE($4, email),
    gcash_name = COALESCE($5, gcash_name),
    gcash_number = COALESCE($6, gcash_number),
    maya_name = COALESCE($7, maya_name),
    maya_number = COALESCE($8, maya_number),
    bank_details = COALESCE($9, bank_details),
    opening_time = COALESCE($10, opening_time),
    closing_time = COALESCE($11, closing_time),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT id FROM gym_details LIMIT 1)
  RETURNING *;
`;

  const values = [
      gym_name,
      address,
      contact_number,
      email,
      gcash_name,
      gcash_number,
      maya_name,
      maya_number,
      bank_details,
      opening_time,
      closing_time,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};
