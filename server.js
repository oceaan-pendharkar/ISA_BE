import express from "express";
import { getUserByEmail, createUser } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/login", async (req, res) => {
  console.log("Received login request:", req.body); // Debugging log

  const user = await getUserByEmail(req.body.email);
  if (!user) return res.status(404).json({ error: "User not found" });

  //TODO Justin: check hashed password
  console.log(user.password_hash);

  res.json({ id: user.id, email: user.email });
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log("Received login request:", req.body); // Debugging log

  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });

  //TODO Justin: hash password
  let password_hash = password + "HASH"; //placeholder - Justin delete pls

  try {
    const newUser = await createUser(email, password_hash); // Password should be hashed before calling this
    console.log("new user registered: ", newUser);
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: "Error creating user" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
