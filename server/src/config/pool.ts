import Pg from "pg";
import { env } from "./env.ts";

const Pool = Pg.Pool;

const pool = new Pool({
  // user: env.DATABASE_USER,
  // password: env.DATABASE_PASSWORD,
  // host: env.DATABASE_HOST,
  // port: Number(env.DATABASE_PORT),
  // database: env.DATABASE_NAME,
  connectionString: process.env.DATABASE_URL,
  // ssl: {
  //     rejectUnauthorized: false,
  // },
});

export default pool;
