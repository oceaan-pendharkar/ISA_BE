import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";

import { getUserByEmail, createUser } from "./db.js";
import { generateSong } from "./song.js"; // Import function

const app = express();
app.use(cors()); // Allows all origins

const PORT = process.env.PORT || 3001;
const saltRounds = 12;

app.use(express.json());

// Login an existing user
app.post("/isa-be/ISA_BE/login", async (req, res) => {
  console.log("Received login request:", req.body); // Debugging log

  const user = await getUserByEmail(req.body.email);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Check hashed password
  const passwordCheck = await bcrypt.compare(
    req.body.password,
    user.password_hash
  );
  if (!passwordCheck)
    return res.status(401).json({ error: "Invalid password" });

  // Prints the bcypt hash
  console.log(user.password_hash);

  console.log("Login successful for:", user.email); // Debugging log
  res.json({ id: user.id, email: user.email });
});

// Register a new user
app.post("/isa-be/ISA_BE/register", async (req, res) => {
  const { email, password } = req.body;
  console.log("Received login request:", req.body); // Debugging log

  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });

  try {
    // Hash entered password
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await createUser(email, password_hash);
    console.log("new user registered: ", newUser);
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: "Error creating user" });
  }
});

app.get("/isa-be/ISA_BE/create-song", async (req, res) => {
  const { activity, adjective1, adjective2 } = req.query; // Read from query params
  console.log("Received song creation request:", req.query); // Debugging log

  if (!activity || !adjective1 || !adjective2) {
    return res.status(400).json({
      error: "Missing fields!! Need activity, adjective1, adjective2",
    });
  }

  try {
    const songData = await generateSong(activity, adjective1, adjective2);
    res.json(songData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/isa-be/ISA_BE/songs/:fileName", async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join("songs", fileName); // Adjust path if needed

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    // Create a read stream and pipe it to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("Error streaming song:", err.message);
    res.status(500).json({ error: "Failed to send song" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
