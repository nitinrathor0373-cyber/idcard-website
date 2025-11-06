import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ✅ File Upload Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ===========================================================
   🟩 1. Add New ID Card
=========================================================== */
router.post("/add", upload.single("photo"), async (req, res) => {
  try {
    const { name, empId, position, gender, phone, email, company, skills } = req.body;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
      INSERT INTO cards 
      (name, empId, position, gender, phone, email, company, skills, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      name,
      empId,
      position,
      gender,
      phone,
      email,
      company,
      skills,
      photoPath,
    ]);

    res.json({ message: "✅ Card added successfully!" });
  } catch (err) {
    console.error("❌ Error adding card:", err);
    res.status(500).json({ error: "Failed to add card" });
  }
});


/* ===========================================================
   🟩 2. Get All Cards
=========================================================== */
router.get("/all", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM cards ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching cards:", err);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

/* ===========================================================
   🟩 3. Search Card by Name or Employee ID
=========================================================== */
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchTerm = `%${q}%`;
    const [rows] = await db.query(
      "SELECT * FROM cards WHERE name LIKE ? OR empId LIKE ? ORDER BY id DESC",
      [searchTerm, searchTerm]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No records found" });
    }

    res.json(rows);
  } catch (err) {
    console.error("❌ Error searching cards:", err);
    res.status(500).json({ error: "Failed to search cards" });
  }
});

/* ===========================================================
   🟩 4. Delete Card by ID (and Remove Photo)
=========================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch photo path for deletion
    const [rows] = await db.query("SELECT photo FROM cards WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Card not found" });
    }

    const photoPath = rows[0].photo ? path.join(process.cwd(), rows[0].photo) : null;

    // Delete record
    const [result] = await db.query("DELETE FROM cards WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Failed to delete card" });
    }

    // Delete photo file
    if (photoPath && fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
      console.log("🗑️ Deleted photo:", photoPath);
    }

    res.json({ message: "✅ Card deleted successfully!" });
  } catch (err) {
    console.error("❌ Error deleting card:", err);
    res.status(500).json({ error: "Failed to delete card" });
  }
});

/* ===========================================================
   🟩 5. Total Employee Count
=========================================================== */
router.get("/count", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) AS total FROM cards"); // ✅ fixed
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error("❌ Error counting cards:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
