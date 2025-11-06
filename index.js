// ==================== IMPORTS ====================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import db from "./db.js";

// ✅ Routes
import authRoutes from "./routes/auth.js";
import cardRoutes from "./routes/card.js";
import contactRoutes from "./routes/contact.js";
import updatesRoutes from "./routes/updates.js";

// ==================== CONFIG ====================
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(
  cors({
    origin: [
      "http://localhost:5000",      // local backend
      "http://localhost:5500",      // local frontend (Live Server)
      "https://mtpdepartmentid.onrender.com", // ✅ your frontend on Render
      "https://mtpdepartment.netlify.app"     // (optional) if you deploy frontend on Netlify
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== UPLOADS SETUP ====================
const __dirname = path.resolve();
const uploadDir = path.join(__dirname, "uploads");
const messageUploadPath = path.join(uploadDir, "messages");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(messageUploadPath)) fs.mkdirSync(messageUploadPath, { recursive: true });

// ✅ Serve uploaded images publicly
app.use("/uploads", express.static(uploadDir));

// ==================== MULTER CONFIG ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, messageUploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ==================== ROUTES ====================

// 🔐 Admin Authentication
app.use("/api/auth", authRoutes);

// 🆔 ID Cards CRUD (uses Cloudinary or local upload inside cardRoutes)
app.use("/api/cards", cardRoutes);

// 📰 Latest Updates CRUD
app.use("/api/updates", updatesRoutes);

// 📩 Contact Form (optional)
app.use("/api/contact", contactRoutes);

// ✅ Serve message images at /uploads/messages/<file>
app.use("/uploads/messages", express.static("uploads/messages"));

// ==================== CONTACT FORM (Public) ====================
app.post("/contact", upload.single("image"), async (req, res) => {
  const { name, email, message } = req.body;
  const image = req.file ? `uploads/messages/${req.file.filename}` : null;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const sql = `
      INSERT INTO messages (name, email, message, image)
      VALUES (?, ?, ?, ?)
    `;
    await db.query(sql, [name, email, message, image]);
    res.status(200).json({ success: true, message: "✅ Message saved successfully!" });
  } catch (err) {
    console.error("❌ Error saving message:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 📜 GET /messages — Fetch all contact messages
app.get("/messages", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM messages ORDER BY created_at DESC");

    // ✅ Convert local file path → full URL
    const messages = results.map((msg) => ({
      ...msg,
      image: msg.image
        ? `${req.protocol}://${req.get("host")}/${msg.image.replace(/\\/g, "/")}`
        : null,
    }));

    res.json(messages);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Database fetch error" });
  }
});

// ==================== DEFAULT & ERROR HANDLERS ====================
app.get("/", (req, res) => {
  res.send("✅ ID Card Backend is running successfully!");
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
