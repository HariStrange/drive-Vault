const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { question_id, options } = req.body;

    if (!question_id || !options?.length) {
      return res
        .status(400)
        .json({ error: "Question ID and options required" });
    }

    const inserts = options.map((opt) =>
      pool.query(
        `INSERT INTO question_options (question_id, option_text, is_correct)
         VALUES ($1, $2, $3)`,
        [question_id, opt.text, opt.isCorrect]
      )
    );

    await Promise.all(inserts);

    await pool.query(
      `UPDATE question_sets 
       SET total_questions = total_questions + 1
       WHERE id = (SELECT question_set_id FROM questions WHERE id = $1)`,
      [question_id]
    );

    res.status(201).json({ message: "Options saved successfully" });
  } catch (err) {
    console.error("ERROR_ADDING_OPTIONS", err);
    res.status(500).json({ error: "Failed to add options" });
  }
});

module.exports = router;
