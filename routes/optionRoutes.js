const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ✅ Add options list
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { question_id, options } = req.body; // [{text,isCorrect}]

    const queries = options.map((o) =>
      pool.query(
        `INSERT INTO question_options (question_id, option_text, is_correct)
        VALUES ($1, $2, $3) RETURNING *`,
        [question_id, o.text, o.isCorrect]
      )
    );

    await Promise.all(queries);
    res.json({ message: "Options added" });
  } catch (err) {
    console.error("ERROR_OPTIONS", err);
    res.status(500).json({ error: "Failed" });
  }
});

module.exports = router;
