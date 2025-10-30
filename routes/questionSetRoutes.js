const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ✅ Create question set
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { set_name, category } = req.body;

    const result = await pool.query(
      `INSERT INTO question_sets (set_name, category, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [set_name, category, req.user.id]
    );

    res.status(201).json({ message: "Created", data: result.rows[0] });
  } catch (err) {
    console.error("ERROR_CREATING_SET", err);
    res.status(500).json({ error: "Failed" });
  }
});

// ✅ Fetch all sets
router.get("/", authenticateToken, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM question_sets ORDER BY id DESC`
  );
  res.json({ data: result.rows });
});

module.exports = router;
