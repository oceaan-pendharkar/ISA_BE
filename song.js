import axios from "axios"; // Install with `npm install axios`
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pkg from "pg";

export const SONGS_DIR = path.resolve("songs"); // Directory where song files are stored

// Ensure the songs directory exists
if (!fs.existsSync(SONGS_DIR)) {
  fs.mkdirSync(SONGS_DIR, { recursive: true });
}

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for NeonDB
});

/**
 * Calls the AI service to generate a song based on an activity and two adjectives.
 * @param {string} activity - The activity related to the song.
 * @param {string} adjective1 - The first descriptive word.
 * @param {string} adjective2 - The second descriptive word.
 * @returns {Promise<Object>} - The response data containing the song.
 */
export async function generateSong(activity, adjective1, adjective2) {
  try {
    const AI_SONG_SERVICE_URL = `https://blaiseklein.dev/ai?activity=${encodeURIComponent(
      activity
    )}&adjective1=${encodeURIComponent(
      adjective1
    )}&adjective2=${encodeURIComponent(adjective2)}`;

    const response = await axios.get(AI_SONG_SERVICE_URL, {
      responseType: "arraybuffer",
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error calling AI song service:",
      error.response?.status,
      error.response?.statusText
    );
    console.error("Response body:", error.response?.data.toString()); // Converts buffer to readable text
    throw new Error("Failed to generate song");
  }
}

/**
 * Finds the next available song filename in the database.
 * @returns {Promise<string>} - The next available song filename (e.g., "song_003.wav").
 */
async function getNextSongFileName() {
  try {
    const result = await pool.query(
      "SELECT file_path FROM songs WHERE file_path LIKE 'songs/song_%' ORDER BY file_path DESC LIMIT 1"
    );

    if (result.rows.length === 0) {
      return "song_001.wav"; // Start numbering from 001 if no songs exist
    }

    const lastFilePath = result.rows[0].file_path; // e.g., "songs/song_003.wav"
    const lastFileName = path.basename(lastFilePath); // Extracts "song_003.wav"
    const lastNumber = parseInt(lastFileName.match(/\d+/)[0], 10);

    return `song_${String(lastNumber + 1).padStart(3, "0")}.wav`;
  } catch (err) {
    console.error("Error getting next song number:", err.message);
    return "song_001.wav"; // Fallback if query fails
  }
}

/**
 * Saves the song buffer as a file and stores its metadata in the database.
 * @param {Buffer} songBuffer - The song data as a Buffer.
 * @returns {Promise<{ id: number, fileName: string, filePath: string }>}
 */
export async function saveSongToDatabase(songBuffer) {
  try {
    // Ensure songs directory exists
    if (!fs.existsSync(SONGS_DIR)) {
      fs.mkdirSync(SONGS_DIR, { recursive: true });
    }

    // Generate next filename
    const fileName = await getNextSongFileName();
    const filePath = "songs/" + fileName; // e.g., "songs/song_001.wav";

    // Save the song buffer to a local file
    fs.writeFileSync(filePath, songBuffer);

    // Store in the database
    const query = "INSERT INTO songs (file_path) VALUES ($1) RETURNING id";
    const { rows } = await pool.query(query, [filePath]);

    console.log(`✅ Saved song: ${fileName} at ${filePath}`);
    return { id: rows[0].id, fileName: fileName };
  } catch (err) {
    console.error("Error saving song:", err.message);
    throw err;
  }
}
