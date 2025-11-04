import express from "express";
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// ➕ Add new update (with optional link)
router.post("/add", verifyToken, async (req, res) => {
  const { title, description, link } = req.body;

  if (!title || !description)
    return res.status(400).json({ error: "Title and description required" });

  try {
    await db.query(
      "INSERT INTO updates (title, description, link, created_at) VALUES (?, ?, ?, NOW())",
      [title, description, link || null]
    );
    res.json({ message: "✅ Update added successfully" });
  } catch (err) {
    console.error("❌ Error adding update:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 📜 Get all updates
router.get("/all", verifyToken, async (req, res) => {
  try {
    const [updates] = await db.query(
      "SELECT * FROM updates ORDER BY created_at DESC"
    );
    res.json(updates);
  } catch (err) {
    console.error("❌ Error fetching updates:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 🗑 Delete update
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await db.query("DELETE FROM updates WHERE id = ?", [req.params.id]);
    res.json({ message: "🗑 Update deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting update:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
