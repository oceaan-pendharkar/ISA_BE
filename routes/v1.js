// routes/v1.js
import express from "express";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import {
  getUserByEmail,
  createUser,
  fetchActivities,
  fetchAdjectives,
  addActivity,
  addAdjective,
  deleteActivityByName,
  deleteAdjectiveByWord,
  updateActivity,
  updateAdjective,
} from "../db.js";
import { generateSong, saveSongToDatabase, SONGS_DIR } from "../song.js";
import { authenticateUser } from "../auth.js";

const router = express.Router();
const saltRounds = 12;

/**
 * @swagger
 * /isa-be/ISA_BE/login:
 *   post:
 *     summary: Log in a user and return a JWT in an HTTP-only cookie
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: yourPassword123
 *     responses:
 *       200:
 *         description: Login successful, token set in cookie
 *         headers:
 *           Set-Cookie:
 *            description: HTTP-only auth token cookie (authToken)
 *            schema:
 *            type: string
 *            example: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6...; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=3600
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 role:
 *                   type: string
 *                   example: user
 *       401:
 *         description: Invalid password
 *       404:
 *         description: User not found
 */
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

/**
 * @swagger
 * /isa-be/ISA_BE/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 5
 *                 email:
 *                   type: string
 *                   example: newuser@example.com
 *       400:
 *         description: Missing fields
 *       500:
 *         description: Error creating user
 */
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

/**
 * @swagger
 * /isa-be/ISA_BE/create-song:
 *   get:
 *     summary: Generate a song based on activity and adjectives
 *     tags:
 *       - Songs
 *     parameters:
 *       - in: query
 *         name: activity
 *         required: true
 *         schema:
 *           type: string
 *         description: The activity to base the song on
 *       - in: query
 *         name: adjective1
 *         required: true
 *         schema:
 *           type: string
 *         description: The first adjective
 *       - in: query
 *         name: adjective2
 *         required: true
 *         schema:
 *           type: string
 *         description: The second adjective
 *     responses:
 *       200:
 *         description: Song generated successfully (WAV audio file returned)
 *         content:
 *           audio/wav:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing required query parameters
 *       500:
 *         description: Error generating or returning the song
 */
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

/**
 * @swagger
 * /isa-be/ISA_BE/songs/{fileName}:
 *   get:
 *     summary: Stream a saved song by filename
 *     tags:
 *       - Songs
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: The filename of the song to stream
 *     responses:
 *       200:
 *         description: Audio stream returned successfully
 *         content:
 *           audio/wav:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *       500:
 *         description: Failed to stream the song
 */
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
    res.status(500).json({ error: "Failed to stream song" });
  }
});

/**
 * @swagger
 * /isa-be/ISA_BE/activities:
 *   get:
 *     summary: Retrieve all activities
 *     tags:
 *       - Activities
 *     responses:
 *       200:
 *         description: A list of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *       500:
 *          description: Failed to fetch activities
 */
// Get all activities
router.get("/isa-be/ISA_BE/activities", async (req, res) => {
  try {
    const activities = await fetchActivities();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

/**
 * @swagger
 * /isa-be/ISA_BE/activities:
 *   post:
 *     summary: Add a new activity
 *     tags:
 *       - Activities
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Activity added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *       400:
 *         description: Missing activity name
 *       500:
 *         description: Failed to add activity
 */
// Add an activity
router.post("/isa-be/ISA_BE/activities", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Missing activity name" });

  try {
    const newActivity = await addActivity(name);
    res.status(201).json(newActivity);
  } catch (err) {
    res.status(500).json({ error: "Failed to add activity" });
  }
});

/**
 * @swagger
 * /isa-be/ISA_BE/activities:
 *   delete:
 *     summary: Delete an activity by name
 *     tags:
 *       - Activities
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       204:
 *         description: Activity deleted successfully or activity name didn't exist
 *       400:
 *         description: Missing activity name
 *       500:
 *         description: Failed to delete activity
 */
// Delete activity by name
router.delete("/isa-be/ISA_BE/activities", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Missing activity name" });

  try {
    await deleteActivityByName(name);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete activity" });
  }
});

/**
 * @swagger
 * /isa-be/ISA_BE/activities/{id}:
 *   patch:
 *     summary: Update the name of an existing activity by ID
 *     tags:
 *       - Activities
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the activity to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: dancing
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 3
 *                 name:
 *                   type: string
 *                   example: Dancing
 *       400:
 *         description: Missing new name
 *       500:
 *         description: Failed to update activity
 */
// Update activity by ID
router.patch("/isa-be/ISA_BE/activities/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Missing new name" });

  try {
    const updated = await updateActivity(id, name);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update activity" });
  }
});

/**
 * @swagger
 * /isa-be/ISA_BE/adjectives:
 *   get:
 *     summary: Retrieve all adjectives
 *     tags:
 *       - Adjectives
 *     responses:
 *       200:
 *         description: A list of adjectives
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   word:
 *                     type: string
 *                     example: joyful
 *       500:
 *         description: Failed to fetch adjectives
 */
// Get all adjectives
router.get("/isa-be/ISA_BE/adjectives", async (req, res) => {
  try {
    const adjectives = await fetchAdjectives();
    res.json(adjectives);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch adjectives" });
  }
});

/**
 * @swagger
 * /isa-be/ISA_BE/adjectives:
 *   post:
 *     summary: Add a new adjective
 *     tags:
 *       - Adjectives
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - word
 *             properties:
 *               word:
 *                 type: string
 *                 example: energetic
 *     responses:
 *       201:
 *         description: Adjective added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 4
 *                 word:
 *                   type: string
 *                   example: energetic
 *       400:
 *         description: Missing adjective word
 *       500:
 *         description: Failed to add adjective
 */
// Add an adjective
router.post("/isa-be/ISA_BE/adjectives", async (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: "Missing adjective word" });

  try {
    const newAdjective = await addAdjective(word);
    res.status(201).json(newAdjective);
  } catch (err) {
    res.status(500).json({ error: "Failed to add adjective" });
  }
});

/**
 * @swagger
 * /isa-be/ISA_BE/adjectives:
 *   delete:
 *     summary: Delete an adjective by word
 *     tags:
 *       - Adjectives
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - word
 *             properties:
 *               word:
 *                 type: string
 *                 example: energetic
 *     responses:
 *       204:
 *         description: Adjective deleted successfully or didn't exist (no content)
 *       400:
 *         description: Missing adjective word
 *       500:
 *         description: Failed to delete adjective
 */
// Delete adjective by word
router.delete("/isa-be/ISA_BE/adjectives", async (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: "Missing adjective word" });

  try {
    await deleteAdjectiveByWord(word);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete adjective" });
  }
});

/**
 * @swagger
 * /isa-be/ISA_BE/adjectives/{id}:
 *   patch:
 *     summary: Update an adjective by ID
 *     tags:
 *       - Adjectives
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the adjective to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - word
 *             properties:
 *               word:
 *                 type: string
 *                 example: cheerful
 *     responses:
 *       200:
 *         description: Adjective updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 2
 *                 word:
 *                   type: string
 *                   example: cheerful
 *       400:
 *         description: Missing new word
 *       500:
 *         description: Failed to update adjective
 */
// Update adjective by ID
router.patch("/isa-be/ISA_BE/adjectives/:id", async (req, res) => {
  const { id } = req.params;
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: "Missing new word" });

  try {
    const updated = await updateAdjective(id, word);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update adjective" });
  }
});

/**
 * @swagger
 * /isa-be/ISA_BE/logout:
 *   post:
 *     summary: Log out the user by clearing the auth token cookie
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logout successful, token cleared
 *         headers:
 *           Set-Cookie:
 *            description: Clear the HTTP-only auth token cookie (authToken)
 *            schema:
 *              type: string
 *            example: authToken=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: No active session
 */
// Logout
router.post("/isa-be/ISA_BE/logout", async (req, res) => {
  console.log("Received logout request:", req.body); // Debugging log

  // Clear the cookie
  res.clearCookie("authToken", {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: true, // Ensures cookie is only sent over HTTPS
    sameSite: "None", // necessary for cross-origin cookies
    path: "/",
  });

  console.log("Logout successful"); // Debugging log
  res.status(200).json({ success: true });
});

// Sends list of available endpoints to client
// List of all available endpoints (for client use or API stats)
router.get("/isa-be/ISA_BE/endpoints", (req, res) => {
  const endpoints = [
    { method: "POST", path: "/isa-be/ISA_BE/login" },
    { method: "POST", path: "/isa-be/ISA_BE/register" },
    { method: "POST", path: "/isa-be/ISA_BE/logout" },
    { method: "GET", path: "/isa-be/ISA_BE/create-song" },
    { method: "GET", path: "/isa-be/ISA_BE/songs/:fileName" },
    { method: "GET", path: "/isa-be/ISA_BE/activities" },
    { method: "POST", path: "/isa-be/ISA_BE/activities" },
    { method: "DELETE", path: "/isa-be/ISA_BE/activities" },
    { method: "PATCH", path: "/isa-be/ISA_BE/activities/:id" },
    { method: "GET", path: "/isa-be/ISA_BE/adjectives" },
    { method: "POST", path: "/isa-be/ISA_BE/adjectives" },
    { method: "DELETE", path: "/isa-be/ISA_BE/adjectives" },
    { method: "PATCH", path: "/isa-be/ISA_BE/adjectives/:id" },
  ];
  res.json({ endpoints });
});

export default router;
