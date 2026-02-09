import pool from "../../config/pool.ts";
import bcrypt from "bcrypt";

export const createUserDomain = async (params: {
    firstName: string;
    lastName: string;
    password: string;
    email: string;
    contactNumber: string;
}) => {
    const { firstName, lastName, password, email, contactNumber } = params;

    if (!firstName || !lastName || !password || !email || !contactNumber) {
        throw new Error("Missing details");
    }

    const hashedPW = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users (first_name, last_name, hashed_password, email, phone_number)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, first_name, last_name, email, phone_number, role, created_at
            `,
        [firstName, lastName, hashedPW, email, contactNumber],
    );

    if (result.rowCount === 0) {
        throw new Error("User not created");
    }

    const user = result.rows[0];

    return {
        id: user.id,
        firsName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        contactNumber: user.phone_number,
    };
};
