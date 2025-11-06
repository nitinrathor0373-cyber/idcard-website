import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🧱 Default storage for message images
const messageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Message",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadMessage = multer({ storage: messageStorage });

// 🧱 Separate storage for card (profile) photos
const cardStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Cards", // Store in a different folder
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadCard = multer({ storage: cardStorage });

export { uploadMessage, uploadCard, cloudinary };

