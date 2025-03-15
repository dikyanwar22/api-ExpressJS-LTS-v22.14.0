require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const db = require("./config/db");

// Inisialisasi aplikasi Express
const app = express();
app.use(express.json());
app.use(cors());

// Rute otentikasi
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Jalankan server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Cek koneksi database
db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
    } else {
        console.log(`✅ Connected to MySQL Database on port ${process.env.DB_PORT}`);
    }
});
