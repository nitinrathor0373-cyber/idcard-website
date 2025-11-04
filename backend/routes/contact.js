import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), (req, res) => {
  const { name, email, message } = req.body;
  console.log("New message received:", { name, email, message });
  res.json({ success: true, msg: "Message received successfully" });
});

export default router;
