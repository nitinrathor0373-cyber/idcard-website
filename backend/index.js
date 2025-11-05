// ==================== IMPORTS ====================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import dbPromise from "./db.js"; // db exports a promise
import authRoutes from "./routes/auth.js";
import cardRoutes from "./routes/card.js";
import contactRoutes from "./routes/contact.js";
import updatesRoutes from "./routes/updates.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: [
    "http://localhost:5500",          // Local frontend
    "http://localhost:5000",          // Local backend
    "https://mtpdepartmentid.onrender.com" // Render frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== UPLOAD DIRECTORIES ====================
const uploadDir = path.join(process.cwd(), "uploads");
const messageUploadPath = path.join(uploadDir, "messages");

if (!fs.existsSync(messageUploadPath)) {
  fs.mkdirSync(messageUploadPath, { recursive: true });
}

// Serve uploads publicly
app.use("/uploads", express.static(uploadDir));

// ==================== MULTER ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, messageUploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ==================== ROUTES ====================

// Auth routes
app.use("/api/auth", authRoutes);

// ID Card CRUD
app.use("/api/cards", cardRoutes);

// Updates CRUD
app.use("/api/updates", updatesRoutes);

// Contact routes
app.use("/api/contact", contactRoutes);

// Direct contact form endpoint
app.post("/contact", upload.single("image"), async (req, res) => {
  const { name, email, message } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const db = await dbPromise;
    await db.query(
      `INSERT INTO messages (name, email, message, image) VALUES (?, ?, ?, ?)`,
      [name, email, message, image]
    );
    res.status(200).json({ message: "✅ Message saved successfully!" });
  } catch (err) {
    console.error("❌ Error saving message:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Fetch all messages
app.get("/messages", async (req, res) => {
  try {
    const db = await dbPromise;
    const [results] = await db.query(`SELECT * FROM messages ORDER BY created_at DESC`);
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
    const db = await dbPromise;
    await db.query("SELECT 1");
    console.log("✅ MySQL Connected Successfully!");
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err);
    process.exit(1);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
