import bcrypt from "bcrypt";
import pool from "../../config/pool.ts";

export const loginDomain = async (params: {
    email: string;
    password: string;
}) => {
    const { email, password } = params;

    console.log(email, password)

    if (!email || !password) {
        throw new Error("Incomplete Details");
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
    ]);

    if (result.rows.length === 0) {
        throw new Error("Invalid Credentials");
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.hashed_password);

    if (!isMatch) {
        throw new Error("Unauthorized");
    }

    return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        contactNumber: user.phone_number,
    };
};
