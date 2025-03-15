import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";

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
  const passwordCheck = await bcrypt.compare(req.body.password, user.password_hash);
  if(!passwordCheck) return res.status(401).json({ error: "Invalid password"});

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

app.post("/create-song", async (req, res) => {
  const { activity, adjective1, adjective2 } = req.body;
  console.log("Received song creation request:", req.body); // Debugging log

  if (!activity || !adjective1 || !adjective2) {
    return res.status(400).json({
      error: "Missing fields: need activity, adjective1, adjective2",
    });
  }

  try {
    const songData = await generateSong(activity, adjective1, adjective2);
    res.json(songData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/saved-song", async (req, res) => {});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
