import express from "express";
import db from "../db.js";
import { uploadMessage } from "../cloudinaryConfig.js"; // ✅ Use the dedicated Cloudinary uploader
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

/* ===========================================================
   🟩 POST MESSAGE (with Cloudinary Image Upload)
=========================================================== */
router.post("/", uploadMessage.single("image"), async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const image = req.file ? req.file.path : null; // ✅ Cloudinary auto-generates full URL

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
   🟩 DELETE MESSAGE (and remove image from Cloudinary)
=========================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the image URL
    const [rows] = await db.query("SELECT image FROM messages WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    const imageUrl = rows[0].image;

    // Delete DB record
    const [result] = await db.query("DELETE FROM messages WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Failed to delete message" });
    }

    // ✅ Delete from Cloudinary if image exists
    if (imageUrl && imageUrl.includes("cloudinary.com")) {
      // Extract public_id properly
      const parts = imageUrl.split("/");
      const folderIndex = parts.findIndex(p => p === "messages");
      if (folderIndex !== -1) {
        const publicIdWithExt = parts.slice(folderIndex + 1).join("/"); // e.g. 1730881234_image.jpg
        const publicId = "messages/" + publicIdWithExt.split(".")[0];
        await cloudinary.uploader.destroy(publicId);
        console.log("🗑️ Deleted Cloudinary image:", publicId);
      }
    }

    res.json({ success: true, msg: "Message deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting message:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
