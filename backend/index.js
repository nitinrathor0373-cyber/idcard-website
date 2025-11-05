// ==================== IMPORTS ====================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import db from "./db.js";
import authRoutes from "./routes/auth.js";
import cardRoutes from "./routes/card.js";
import contactRoutes from "./routes/contact.js";
import updatesRoutes from "./routes/updates.js";

// ==================== CONFIG ====================
dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

// ==================== MIDDLEWARE ====================
// ✅ Allow access from your frontend (Netlify / Vercel / localhost)
app.use(
  cors({
    origin: [
      "http://localhost:5000", // for local testing
      "https://mtp-tech.onrender.com", // ✅ your frontend Netlify domain (change if needed)
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/messages", contactRoutes);

// ✅ Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ✅ Serve uploaded photos (for ID cards & contact images)
app.use("/uploads", express.static(uploadDir));

// ==================== MULTER CONFIG ====================
const messageUploadPath = path.join(uploadDir, "messages");
if (!fs.existsSync(messageUploadPath))
  fs.mkdirSync(messageUploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, messageUploadPath),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ==================== ROUTES ====================

// 🔐 Admin Authentication
app.use("/api/auth", authRoutes);

// 🆔 ID Card CRUD
app.use("/api/cards", cardRoutes);

// 📰 Latest Updates CRUD
app.use("/api/updates", updatesRoutes);

app.use("/uploads/messages", express.static("uploads/messages"));


// ===== 📩 CONTACT FORM ROUTES =====

// ➕ POST /contact — Save a new message
app.post("/contact", upload.single("image"), async (req, res) => {
  const { name, email, message } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const sql = `
      INSERT INTO contact_messages (name, email, message, image)
      VALUES (?, ?, ?, ?)
    `;
    await db.query(sql, [name, email, message, image]);
    res.status(200).json({ message: "✅ Message saved successfully!" });
  } catch (err) {
    console.error("❌ Error saving message:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 📜 GET /messages — Fetch all contact messages
app.get("/messages", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT * FROM contact_messages
      ORDER BY created_at DESC
    `);
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Database fetch error" });
  }
});

// ==================== DEFAULT & ERROR HANDLERS ====================
app.get("/", (req, res) => {
  res.send("✅ ID Card Backend is running!");
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ==================== START SERVER ====================
(async () => {
  try {
    await db.query("SELECT 1");
    console.log("✅ MySQL Connected Successfully!");
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err);
  }

  // ✅ Important: Use 0.0.0.0 for Render, not localhost
app.listen(process.env.PORT || "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
})();
