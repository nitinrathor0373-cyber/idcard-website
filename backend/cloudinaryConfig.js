import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// ================= CLOUDINARY CONFIG =================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY,       // your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // your Cloudinary API secret
  secure: true,                                  // enforce HTTPS URLs
});

// ================= MESSAGE IMAGE STORAGE =================
const messageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Message", // Cloudinary folder for messages
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }], // optional resizing
  },
});

const uploadMessage = multer({ storage: messageStorage });

// ================= CARD IMAGE STORAGE =================
const cardStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Cards", // Cloudinary folder for cards (must match folder in card routes)
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 600, height: 600, crop: "limit" }], // optional resizing
  },
});

const uploadCard = multer({ storage: cardStorage });

// ================= EXPORT =================
export { uploadMessage, uploadCard, cloudinary };
