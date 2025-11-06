import express from "express";
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

/* ==========================================================
   ➕ ADD NEW UPDATE (Admin Only)
   ========================================================== */
router.post("/add", verifyToken, async (req, res) => {
  const { title, description, link } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  try {
    await db.query(
      "INSERT INTO updates (title, description, link, created_at) VALUES (?, ?, ?, NOW())",
      [title.trim(), description.trim(), link?.trim() || null]
    );

    res.json({ message: "✅ Update added successfully!" });
  } catch (err) {
    console.error("❌ Error adding update:", err);
    res.status(500).json({ error: "Internal server error while adding update." });
  }
});

/* ==========================================================
   📜 GET ALL UPDATES (Public)
   ========================================================== */
router.get("/all", async (req, res) => {
  try {
    const [updates] = await db.query(
      "SELECT id, title, description, link, created_at FROM updates ORDER BY created_at DESC"
    );
    res.json(updates);
  } catch (err) {
    console.error("❌ Error fetching updates:", err);
    res.status(500).json({ error: "Internal server error while fetching updates." });
  }
});

/* ==========================================================
   🗑 DELETE UPDATE (Admin Only)
   ========================================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM updates WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Update not found." });
    }

    res.json({ message: "🗑 Update deleted successfully!" });
  } catch (err) {
    console.error("❌ Error deleting update:", err);
    res.status(500).json({ error: "Internal server error while deleting update." });
  }
});

export default router;