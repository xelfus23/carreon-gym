import Pg from "pg";

const Pool = Pg.Pool;

const pool = new Pool({
    user: "postgres",
    password: "2026",
    host: "localhost",
    port: 5432,
    database: "careon_db",
});

export default pool;