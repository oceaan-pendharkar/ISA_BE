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
 * Fetch all activities from the database
 * @returns {Promise<Object[]>} Array of activities
 * @throws {Error} If an error occurs while fetching activities
 * @example
 * const activities = await fetchActivities();
 * console.log(activities);
 * // [
 * //   { id: 1, name: "Hiking" },
 * //   { id: 2, name: "Swimming" },
 * //   { id: 3, name: "Cycling" }
 * // ]
 */
export async function fetchActivities() {
  try {
    const client = await pool.connect();
    const { rows } = await client.query("SELECT * FROM activities");
    client.release();
    return rows;
  } catch (err) {
    console.error("Error fetching activities:", err);
    throw err;
  }
}

/**
 * Fetch all adjectives from the database
 * @returns {Promise<Object[]>} Array of adjectives
 * @throws {Error} If an error occurs while fetching adjectives
 * @example
 * const adjectives = await fetchAdjectives();
 * console.log(adjectives);
 * // [
 * //   { id: 1, word: "Adventurous" },
 * //   { id: 2, word: "Brave" },
 * //   { id: 3, word: "Calm" }
 * // ]
 */
export async function fetchAdjectives() {
  try {
    const client = await pool.connect();
    const { rows } = await client.query("SELECT * FROM adjectives");
    client.release();
    return rows;
  } catch (err) {
    console.error("Error fetching adjectives:", err);
    throw err;
  }
}

/**
 * Add a new activity to the database
 * @param {*} name
 * @returns {Promise<Object>} Inserted activity data
 * @throws {Error} If an error occurs while adding activity
 * @example
 * const activity = await addActivity("Hiking");
 * console.log(activity);
 * // { id: 1, name: "Hiking" }
 */
export async function addActivity(name) {
  try {
    const client = await pool.connect();
    const query = "INSERT INTO activities (name) VALUES ($1) RETURNING *";
    const { rows } = await client.query(query, [name]);
    client.release();
    return rows[0];
  } catch (err) {
    console.error("Error adding activity:", err);
    throw err;
  }
}

/**
 * Add a new adjective to the database
 * @param {*} word
 * @returns {Promise<Object>} Inserted adjective data
 * @throws {Error} If an error occurs while adding adjective
 * @example
 * const adjective = await addAdjective("Adventurous");
 * console.log(adjective);
 * // { id: 1, word: "Adventurous" }
 */
export async function addAdjective(word) {
  try {
    const client = await pool.connect();
    const query = "INSERT INTO adjectives (word) VALUES ($1) RETURNING *";
    const { rows } = await client.query(query, [word]);
    client.release();
    return rows[0];
  } catch (err) {
    console.error("Error adding adjective:", err);
    throw err;
  }
}

/**
 * Delete an activity by name
 * @param {string} name - The name of the activity to delete
 * @throws {Error} If an error occurs while deleting activity
 * @example
 * await deleteActivityByName("Hiking");
 */
export async function deleteActivityByName(name) {
  try {
    const client = await pool.connect();
    await client.query("DELETE FROM activities WHERE name = $1", [name]);
    client.release();
  } catch (err) {
    console.error("Error deleting activity by name:", err);
    throw err;
  }
}

/**
 * Delete an adjective by word
 * @param {string} word - The word of the adjective to delete
 * @throws {Error} If an error occurs while deleting adjective
 * @example
 * await deleteAdjectiveByWord("Adventurous");
 */
export async function deleteAdjectiveByWord(word) {
  try {
    const client = await pool.connect();
    await client.query("DELETE FROM adjectives WHERE word = $1", [word]);
    client.release();
  } catch (err) {
    console.error("Error deleting adjective by word:", err);
    throw err;
  }
}

/**
 * Update an activity by id (useful for spelling errors, etc.)
 * @param {number} id - The id of the activity to update
 * @param {string} newName - The new name of the activity
 * @returns {Promise<Object>} Updated activity data
 * @throws {Error} If an error occurs while updating activity
 * @example
 * const activity = await updateActivity(1, "Hiking");
 * console.log(activity);
 * // { id: 1, name: "Hiking" }
 */
export async function updateActivity(id, newName) {
  try {
    const client = await pool.connect();
    const query = "UPDATE activities SET name = $1 WHERE id = $2 RETURNING *";
    const { rows } = await client.query(query, [newName, id]);
    client.release();
    return rows[0];
  } catch (err) {
    console.error("Error updating activity:", err);
    throw err;
  }
}

/**
 * Update an adjective by id (useful for spelling errors, etc.)
 * @param {number} id - The id of the adjective to update
 * @param {string} newWord - The new word of the adjective
 * @returns {Promise<Object>} Updated adjective data
 * @throws {Error} If an error occurs while updating adjective
 * @example
 * const adjective = await updateAdjective(1, "Adventurous");
 * console.log(adjective);
 * // { id: 1, word: "Adventurous" }
 */
export async function updateAdjective(id, newWord) {
  try {
    const client = await pool.connect();
    const query = "UPDATE adjectives SET word = $1 WHERE id = $2 RETURNING *";
    const { rows } = await client.query(query, [newWord, id]);
    client.release();
    return rows[0];
  } catch (err) {
    console.error("Error updating adjective:", err);
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
    `SELECT COUNT(user_statistics.id), endpoints.path, request_methods.method FROM user_statistics 
    FULL OUTER JOIN endpoints ON user_statistics.endpoint_id=endpoints.id
    FULL OUTER JOIN request_methods ON user_statistics.request_method_id=request_methods.id
    GROUP BY endpoints.path, request_methods.method`;
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
    const client = await pool.connect();
    //Get endpoint id
    const endpoint_id_query = "SELECT id FROM endpoints WHERE path LIKE $1;";
    let endpoint_id = await client.query(endpoint_id_query, [endpoint])
    // console.log(endpoint_id['rows'])
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
