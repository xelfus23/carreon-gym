import bcrypt from "bcrypt";
import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

export const loginDomain = async (params: {
  email: string;
  password: string;
}) => {
  const { email, password } = params;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400, "AUTH_MISSING_FIELDS");
  }

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  const user = result.rows[0];

  if (!user) {
    throw new AppError("Invalid Email or Password. Please try again.", 401, "INVALID_CREDENTIALS");
  }

  const isMatch = await bcrypt.compare(password, user.hashed_password);
//   const isMatch = password === user.hashed_password;

  if (!isMatch) {
    throw new AppError("Invalid Email or Password. Please try again.", 401, "INVALID_CREDENTIALS");
  }

  return {
    id: user.id,
    role: user.role as "admin" | "member",
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    contactNumber: user.phone_number,
  };
};
