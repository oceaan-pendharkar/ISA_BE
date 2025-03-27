import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for NeonDB
});

export const http_methods = Object.freeze({
  GET: "GET",
  POST: "POST",
  PATCH: "PATCH",
  DELETE: "DELETE",
  PUT: "PUT",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD"
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
      "SELECT id, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1)";
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

/**
 * Gets the usage data about all endpoints.
 */
export async function get_endpoint_usage(){
  try {
    const client = await pool.connect();
    const query = 
    `SELECT COUNT(user_statistics.id), path, method FROM user_statistics 
    FULL JOIN endpoints ON user_statistics.endpoint_id=endpoints.id
    FULL JOIN request_methods ON user_statistics.request_method_id=request_methods.id
    GROUP BY request_method_id;`;
    const { rows } = await client.query(query);
    client.release();
    return rows;
  } catch (err){
    console.error("Error acquiring endpoint usage data:", err);
    throw err;
  }
}


/**
 * Gets the usage data for a specific user for all endpoints.
 * @param {string} user_mail - The username
 */
export async function get_user_endpoint_usage(user_email){
  try {
    const client = await pool.connect();
    const query = 
    `SELECT COUNT(user_statistics.id), path, method FROM user_statistics 
    FULL JOIN endpoints ON user_statistics.endpoint_id=endpoints.id
    FULL JOIN request_methods ON user_statistics.request_method_id=request_methods.id
    where users_statistics.user_id = 
    {
      SELECT id FROM users
      WHERE email = $1
    }
    GROUP BY user_id;`;
    const { rows } = await client.query(query, [user_email]);
    client.release();
    return rows;
  } catch (err){
    console.error("Error acquiring user endpoint usage data:", err);
    throw err;
  }
}

/**
 * Inserts a row into the database noting that a user used an endpoint
 * @param {string} user_email 
 * @param {string} endpoint 
 * @param {string} method 
 */
export async function increment_endpoint_usage(user_email, endpoint, method){
  try {
    console.log(user_email);
    console.log(endpoint);
    console.log(method);
    const client = await pool.connect();
    //Get endpoint id
    const endpoint_id_query = "SELECT id FROM endpoints WHERE path LIKE $1;";
    let endpoint_id = await client.query(endpoint_id_query, [endpoint])
    endpoint_id = endpoint_id['rows'][0].id;

    //Get method id
    const method_id_query = "SELECT id FROM request_methods WHERE method = $1;";
    let method_id = await client.query(method_id_query, [method])
    method_id = method_id.rows[0].id;

    //Get user id
    const user_id_query = "SELECT id FROM users WHERE email = $1;";
    let user_id = await client.query(user_id_query, [user_email])
    user_id = user_id.rows[0].id;

    let timestamp = new Date();
    timestamp = timestamp.getFullYear() + "-" + timestamp.getMonth() + "-" + timestamp.getDay();

    const query = "INSERT INTO user_statistics (user_id, endpoint_id, request_method_id, timestamp) VALUES ($1, $2, $3, $4);"
    const result = await client.query(query, [user_id, endpoint_id, method_id, timestamp])
    return result.length;
  } catch (err){
    console.error("Error adding endpoint usage:", err);
    throw err;
  }
}
