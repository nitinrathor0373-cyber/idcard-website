import express from "express";
import dotenv from "dotenv";
import db from "../db.js"; // MySQL connection
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();
const router = express.Router();

// ------------------ LOGIN ------------------
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "⚠️ Username & password required" });

  try {
    // Check .env admin credentials
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { username, role: "superadmin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      return res.json({ message: "✅ Login successful", token });
    }

    // Check database
    const [rows] = await db.query(
      "SELECT * FROM admins WHERE username = ?",
      [username]
    );

    if (!rows.length)
      return res.status(401).json({ error: "❌ Invalid username or password" });

    const admin = rows[0];
    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword)
      return res.status(401).json({ error: "❌ Invalid username or password" });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "✅ Login successful", token });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "❌ Server error during login." });
  }
});

// ------------------ SIGNUP ------------------
router.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email)
    return res.status(400).json({ error: "⚠️ All fields are required" });

  try {
    const [existing] = await db.query(
      "SELECT * FROM admins WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existing.length > 0)
      return res.status(400).json({ error: "⚠️ User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO admins (username, password, email) VALUES (?, ?, ?)",
      [username, hashedPassword, email]
    );

    res.json({ message: "✅ Signup successful! You can now login." });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ error: "❌ Server error during signup." });
  }
});

export default router;
