// routes/v1.js
import express from "express";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { getUserByEmail, createUser } from "../db.js";
import { generateSong, saveSongToDatabase, SONGS_DIR } from "../song.js";
import { authenticateUser } from "../auth.js";

const router = express.Router();
const saltRounds = 12;

// Login
router.post("/isa-be/ISA_BE/login", async (req, res) => {
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

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.SECRET_KEY,
    {
      expiresIn: "1h", // Token expires in 1 hour
    }
  );

  console.log("Generated token:", token); // Debugging log

  // Set the token in an HTTP-only, Secure cookie
  res.cookie("authToken", token, {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: true, // Ensures cookie is only sent over HTTPS
    sameSite: "None", // necessary for cross-origin cookies
    path: "/",
    maxAge: 60 * 60 * 1000, // 1 hour expiry
  });

  res.json({ id: user.id, email: user.email, role: user.role });
});

// Register
router.post("/isa-be/ISA_BE/register", async (req, res) => {
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

// Create song
router.get("/isa-be/ISA_BE/create-song", async (req, res) => {
  try {
    const { activity, adjective1, adjective2 } = req.query;

    if (!activity || !adjective1 || !adjective2) {
      return res.status(400).json({
        error: "Missing fields: need activity, adjective1, adjective2",
      });
    }

    console.log("Received song creation request:", {
      activity,
      adjective1,
      adjective2,
    });

    // Call song generation function
    const songBuffer = await generateSong(activity, adjective1, adjective2);

    // Save song & get metadata
    const songDetails = await saveSongToDatabase(songBuffer);

    // Set headers for streaming
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${songDetails.fileName}"`
    );
    res.setHeader("X-Song-ID", songDetails.id);

    // Send the saved file
    res.sendFile(path.join(SONGS_DIR, songDetails.fileName));
  } catch (err) {
    console.error("Error generating song:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Serve songs
router.get("/isa-be/ISA_BE/songs/:fileName", async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join("songs", fileName); // Adjust path if needed

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found!!" });
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

export default router;
