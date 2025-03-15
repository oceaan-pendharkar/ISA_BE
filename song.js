import axios from "axios"; // Install with `npm install axios`
import fs from "fs";
import path from "path";

const AI_SONG_SERVICE_URL =
  process.env.AI_SONG_SERVICE_URL || "https://postman-echo.com/post"; // Placeholder

const SONGS_DIR = path.resolve("songs"); // Directory where song files are stored

// Ensure the songs directory exists
if (!fs.existsSync(SONGS_DIR)) {
  fs.mkdirSync(SONGS_DIR, { recursive: true });
}

/**
 * Calls the AI service to generate a song based on an activity and two adjectives.
 * @param {string} activity - The activity related to the song.
 * @param {string} adjective1 - The first descriptive word.
 * @param {string} adjective2 - The second descriptive word.
 * @returns {Promise<Object>} - The response data containing the song.
 */
export async function generateSong(activity, adjective1, adjective2) {
  try {
    const response = await axios.post(AI_SONG_SERVICE_URL, {
      activity,
      adjectives: [adjective1, adjective2],
    });

    return response.data; // Return the song data from the AI service
  } catch (error) {
    console.error(
      "Error calling AI song service:",
      error.response?.data || error.message
    );
    throw new Error("Failed to generate song");
  }
}
