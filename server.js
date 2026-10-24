
require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { sql, connectDB } = require("./config/db");

const app = express();
app.use(express.static(__dirname));
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
    res.send("MJF Center Visit Backend Running");
});

// Existing visitor submission API
app.post("/api/visitors", async (req, res) => {
    try {
        const {
            name, email, phone, age,
            qualification, district, purpose,
            course, feedback
        } = req.body;

        if (
            !name || !email || !phone || !age ||
            !qualification || !district
        ) {
            return res.status(400).json({
                message: "Please fill all required fields."
            });
        }

        const ageNumber = Number(age);

        if (!Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 120) {
            return res.status(400).json({
                message: "Invalid age."
            });
        }

        const pool = await sql.connect();

        await pool.request()
            .input("name", sql.NVarChar(100), name)
            .input("email", sql.NVarChar(150), email)
            .input("phone", sql.NVarChar(15), phone)
            .input("age", sql.Int, ageNumber)
            .input("qualification", sql.NVarChar(100), qualification)
            .input("district", sql.NVarChar(100), district)
            .input("purpose", sql.NVarChar(500), purpose || null)
            .input("course", sql.NVarChar(200), course || null)
            .input("feedback", sql.NVarChar(1000), feedback || null)
            .query(`
                INSERT INTO dbo.visitors
                (name, email, phone, age, qualification,
                 district, purpose, course, feedback)
                VALUES
                (@name, @email, @phone, @age, @qualification,
                 @district, @purpose, @course, @feedback)
            `);

        res.status(201).json({
            message: "Visitor details saved successfully."
        });
    } catch (error) {
        console.error("Visitor save error:", error.message);
        res.status(500).json({
            message: "Could not save visitor details."
        });
    }
});

// Admin login
app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;

    if (
        !process.env.ADMIN_USERNAME ||
        !process.env.ADMIN_PASSWORD ||
        !process.env.JWT_SECRET
    ) {
        return res.status(500).json({
            message: "Admin environment settings are missing."
        });
    }

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        username !== process.env.ADMIN_USERNAME ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            message: "Invalid username or password."
        });
    }

    const token = jwt.sign(
        { role: "admin", username },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    );

    res.json({ token, message: "Login successful." });
});

// Protect all admin data routes
function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : "";

    if (!token) {
        return res.status(401).json({
            message: "Please log in as admin."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied." });
        }

        req.admin = decoded;
        next();
    } catch {
        return res.status(401).json({
            message: "Session expired. Please log in again."
        });
    }
}

// Dashboard statistics
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
        const pool = await sql.connect();

        const result = await pool.request().query(`
            SELECT
                COUNT(*) AS totalVisitors,
                SUM(CASE
                    WHEN CONVERT(date, visit_date) = CONVERT(date, GETDATE())
                    THEN 1 ELSE 0
                END) AS todayVisitors
            FROM dbo.visitors
        `);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Stats error:", error.message);
        res.status(500).json({ message: "Could not load statistics." });
    }
});

// Search and list visitors
app.get("/api/admin/visitors", requireAdmin, async (req, res) => {
    try {
        const search = String(req.query.search || "").trim().slice(0, 100);
        const pool = await sql.connect();

        const result = await pool.request()
            .input("search", sql.NVarChar(100), `%${search}%`)
            .query(`
                SELECT TOP 1000
                    id, name, email, phone, age, qualification,
                    district, purpose, course, feedback, visit_date
                FROM dbo.visitors
                WHERE
                    @search = '%%'
                    OR name LIKE @search
                    OR email LIKE @search
                    OR phone LIKE @search
                    OR district LIKE @search
                ORDER BY id DESC
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error("Visitors list error:", error.message);
        res.status(500).json({ message: "Could not load visitor records." });
    }
});

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
