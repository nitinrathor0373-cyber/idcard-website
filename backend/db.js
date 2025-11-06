import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

async function initDB() {
  try {
    // ✅ Step 1️⃣: Create a connection pool
    const db = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 20000, // prevent Render timeout issues
      ssl: {
        rejectUnauthorized: false, // ✅ Needed for Render, PlanetScale, or remote MySQL
      },
    });

    // ✅ Step 2️⃣: Test initial connection
    const connection = await db.getConnection();
    console.log("✅ MySQL Connected Successfully!");
    connection.release();

    // ✅ Step 3️⃣: Create tables if not exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS auth (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        empId VARCHAR(50),
        position VARCHAR(100),
        gender VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(100),
        company VARCHAR(100),
        skills TEXT,
        photo VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("🧩 Tables checked/created successfully!");
    return db;

  } catch (err) {
    console.error("❌ Database setup error:", err.message);
    process.exit(1);
  }
}

// ✅ Step 4️⃣: Initialize DB and export
const db = await initDB();
export default db;
