import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../db.js"; // make sure you have db.js configured for MySQL

const router = express.Router();

// ==================== MULTER STORAGE SETUP ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/messages";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// ==================== POST MESSAGE ====================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, msg: "All fields are required" });
    }

    const sql =
      "INSERT INTO messages (name, email, message, image, created_at) VALUES (?, ?, ?, ?, NOW())";
    await db.query(sql, [name, email, message, image]);

    console.log("✅ New message saved:", { name, email, message, image });

    res.json({ success: true, msg: "Message received successfully" });
  } catch (err) {
    console.error("❌ Error saving message:", err);
    res.status(500).json({ success: false, msg: "Failed to save message" });
  }
});

// ==================== GET ALL MESSAGES ====================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM messages ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
