const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const multer = require("multer");

const router = express.Router();
const upload = multer();

// Middleware untuk verifikasi token JWT
const verifyToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(403).json({ message: "Access Denied" });

    try {
        const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid Token" });
    }
};

// REGISTER
router.post("/register", upload.none(), async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Semua field wajib diisi!" });
    }

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length > 0) {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "User berhasil didaftarkan" });
            }
        );
    });
});

// LOGIN
router.post("/login", upload.none(), (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi!" });
    }

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(400).json({ message: "Email atau password salah" });
        }

        const user = result[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "Email atau password salah" });
        }

        // Debugging JWT_SECRET
        console.log("JWT_SECRET:", process.env.JWT_SECRET);

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "Login berhasil", token });
    });
});

// PROFILE (Protected Route)
router.get("/profile", verifyToken, (req, res) => {
    db.query(
        "SELECT id, name, email FROM users WHERE id = ?",
        [req.user.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(result[0]);
        }
    );
});

module.exports = router;
