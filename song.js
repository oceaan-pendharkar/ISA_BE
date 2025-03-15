import axios from "axios"; // Install with `npm install axios`

const AI_SONG_SERVICE_URL =
  process.env.AI_SONG_SERVICE_URL || "https://postman-echo.com/post"; // Placeholder

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
