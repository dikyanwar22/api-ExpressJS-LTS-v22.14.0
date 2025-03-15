const express = require("express");
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Konfigurasi Multer untuk upload gambar
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename file dengan timestamp
    },
});
const upload = multer({ storage });

// 🔹 CREATE: Tambah Produk (Menggunakan form-data)
router.post("/", verifyToken, upload.single("image"), (req, res) => {
    const { name, price, description } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name || !price) {
        return res.status(400).json({ message: "Nama dan harga wajib diisi!" });
    }

    db.query(
        "INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)",
        [name, price, description, image],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Produk berhasil ditambahkan", productId: result.insertId });
        }
    );
});

// 🔹 READ: Ambil Semua Produk
router.get("/", (req, res) => {
    db.query("SELECT * FROM products", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// 🔹 READ: Ambil Produk Berdasarkan ID
router.get("/:id", (req, res) => {
    db.query("SELECT * FROM products WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ message: "Produk tidak ditemukan" });
        res.json(result[0]);
    });
});

// 🔹 UPDATE: Edit Produk
router.put("/:id", verifyToken, upload.single("image"), (req, res) => {
    const { name, price, description } = req.body;
    const image = req.file ? req.file.filename : null;

    db.query(
        "UPDATE products SET name = ?, price = ?, description = ?, image = COALESCE(?, image) WHERE id = ?",
        [name, price, description, image, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Produk berhasil diperbarui" });
        }
    );
});

// 🔹 DELETE: Hapus Produk
router.delete("/:id", verifyToken, (req, res) => {
    db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Produk berhasil dihapus" });
    });
});

module.exports = router;
