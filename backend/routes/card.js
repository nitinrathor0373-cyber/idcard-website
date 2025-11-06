import express from "express";
import db from "../db.js";
import { uploadCard, cloudinary } from "../cloudinaryConfig.js"; // Cloudinary setup

const router = express.Router();

/* ===========================================================
   🟩 1. Add New ID Card (Upload photo to Cloudinary)
=========================================================== */
router.post("/add", uploadCard.single("photo"), async (req, res) => {
  try {
    const { name, empId, position, gender, phone, email, company, skills } = req.body;

    // Get Cloudinary URL from multer upload
    const photoUrl = req.file ? req.file.path : null;

    // Validate required fields
    if (!name || !empId || !position || !gender || !phone || !email || !company) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    const sql = `
      INSERT INTO cards 
      (name, empId, position, gender, phone, email, company, skills, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [name, empId, position, gender, phone, email, company, skills, photoUrl]);

    res.json({ success: true, message: "✅ Card added successfully!", photoUrl });
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
   🟩 4. Delete Card by ID (and Remove from Cloudinary)
=========================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get the Cloudinary image URL
    const [rows] = await db.query("SELECT photo FROM cards WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Card not found" });
    }

    const photoUrl = rows[0].photo;

    // Delete from database
    const [result] = await db.query("DELETE FROM cards WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Failed to delete card" });
    }

    // Delete image from Cloudinary if exists
    if (photoUrl) {
      try {
        // Extract public_id from URL
        const publicId = photoUrl
          .split("/")
          .slice(-2) // last two parts: folder/filename.ext
          .join("/")
          .replace(/\.[^/.]+$/, ""); // remove extension

        await cloudinary.uploader.destroy(publicId);
        console.log("🗑️ Deleted Cloudinary image:", publicId);
      } catch (err) {
        console.warn("⚠️ Cloudinary delete failed:", err.message);
      }
    }

    res.json({ success: true, message: "✅ Card deleted successfully!" });
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
    const [rows] = await db.query("SELECT COUNT(*) AS total FROM cards");
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error("❌ Error counting cards:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
