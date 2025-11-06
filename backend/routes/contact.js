import express from "express";
import db from "../db.js";
import { uploadMessage } from "../cloudinaryConfig.js"; // You can rename this to a local multer if not using Cloudinary

const router = express.Router();

/* ===========================================================
   🟩 POST MESSAGE (with uploaded image)
=========================================================== */
router.post("/", uploadMessage.single("image"), async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const image = req.file?.path || null; // Use local file path

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    const sql = `
      INSERT INTO messages (name, email, message, image, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    await db.query(sql, [name, email, message, image]);

    console.log("✅ New message saved:", { name, email, message, image });
    res.json({ success: true, msg: "Message received successfully" });
  } catch (err) {
    console.error("❌ Error saving message:", err);
    res.status(500).json({ success: false, msg: "Failed to save message" });
  }
});

/* ===========================================================
   🟩 GET ALL MESSAGES
=========================================================== */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM messages ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/* ===========================================================
   🟩 DELETE MESSAGE
=========================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the image path (optional, in case you want to delete local files)
    const [rows] = await db.query("SELECT image FROM messages WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Message not found" });

    // Optional: delete local file
    // const fs = require('fs');
    // if (rows[0].image) fs.unlinkSync(rows[0].image);

    // Delete DB record
    const [result] = await db.query("DELETE FROM messages WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Failed to delete message" });

    res.json({ success: true, msg: "Message deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting message:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
