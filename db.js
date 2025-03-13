import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for NeonDB
});

/**
 * Fetch user by username
 * @param {string} username - The username to search for
 * @returns {Promise<Object|null>} User data (with hashed password) or null if not found
 */
export async function getUserByEmail(email) {
  try {
    const client = await pool.connect();
    const query =
      "SELECT id, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)";
    const { rows } = await client.query(query, [email]);
    client.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("Error fetching user:", err);
    throw err;
  }
}

/**
 * Insert a new user (Assumes teammate will hash password before calling this function)
 * @param {string} username - The username
 * @param {string} hashedPassword - The hashed password
 * @returns {Promise<Object>} Inserted user data
 */
export async function createUser(email, password_hash) {
  try {
    const client = await pool.connect();
    const query =
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email";
    const { rows } = await client.query(query, [email, password_hash]);
    client.release();
    return rows[0];
  } catch (err) {
    console.error("Error inserting user:", err);
    throw err;
  }
}
