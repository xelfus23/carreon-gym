// domain/users/createUser.ts
import pool from "../../config/pool.ts";
import bcrypt from "bcrypt";

export const createUserDomain = async (params: {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  phoneNumber: string;
  username?: string;
}) => {
  const { firstName, lastName, password, email, phoneNumber, username } =
    params;

  if (!firstName || !lastName || !password || !email || !phoneNumber) {
    throw new Error("Missing required fields");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  // Password strength validation
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  // Check if user already exists
  const existingUser = await pool.query(
    `SELECT id FROM users WHERE email = $1 OR phone_number = $2`,
    [email, phoneNumber],
  );

  if (existingUser.rowCount! > 0) {
    throw new Error("User with this email or phone number already exists");
  }

  // Hash password
  // const hashedPW = await bcrypt.hash(password, 10);

  // Create user
  const result = await pool.query(
    `INSERT INTO users (
            first_name, 
            last_name, 
            hashed_password, 
            email, 
            phone_number,
            verified,
            account_status
        )
        VALUES ($1, $2, $3, $4, $5, false, 'active')
        RETURNING 
            id, 
            first_name, 
            last_name, 
            email, 
            phone_number, 
            role,
            verified,
            created_at`,
    [firstName, lastName, password, email, phoneNumber],
  );

  if (result.rowCount === 0) {
    throw new Error("Failed to create user");
  }

  const user = result.rows[0];

  return {
    id: user.id,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phoneNumber: user.phone_number,
    verified: user.verified,
    createdAt: user.created_at,
  };
};
