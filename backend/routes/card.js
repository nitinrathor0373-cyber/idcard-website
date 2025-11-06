import express from "express";
import db from "../db.js";
import { uploadCard } from "../cloudinaryConfig.js"; // You may rename this to a local multer if not using Cloudinary anymore

const router = express.Router();

/* ===========================================================
   🟩 1. Add New ID Card (Upload photo locally)
=========================================================== */
router.post("/add", uploadCard.single("photo"), async (req, res) => {
  try {
    const { name, empId, position, gender, phone, email, company, skills } = req.body;

    // Get uploaded file path
    const photoUrl = req.file?.path || null;

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
    if (!q?.trim()) return res.status(400).json({ error: "Search query is required" });

    const searchTerm = `%${q}%`;
    const [rows] = await db.query(
      "SELECT * FROM cards WHERE name LIKE ? OR empId LIKE ? ORDER BY id DESC",
      [searchTerm, searchTerm]
    );

    if (!rows.length) return res.status(404).json({ error: "No records found" });

    res.json(rows);
  } catch (err) {
    console.error("❌ Error searching cards:", err);
    res.status(500).json({ error: "Failed to search cards" });
  }
});

/* ===========================================================
   🟩 4. Delete Card by ID (Local file remains or handle separately)
=========================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query("SELECT photo FROM cards WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Card not found" });

    // Optional: you can delete the local file here using fs.unlink if needed
    // const photoPath = rows[0].photo;
    // if (photoPath) fs.unlinkSync(photoPath);

    const [result] = await db.query("DELETE FROM cards WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Failed to delete card" });

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
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
