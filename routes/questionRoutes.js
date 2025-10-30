const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/quizzUpload");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  upload.single("question_image"),
  async (req, res) => {
    try {
      const { question_set_id, question_text, question_type } = req.body;
      const question_image_url = req.file ? req.file.filename : null;

      const result = await pool.query(
        `INSERT INTO questions (
        question_set_id, question_text, question_image_url, question_type
      ) VALUES ($1, $2, $3, $4) RETURNING *`,
        [question_set_id, question_text, question_image_url, question_type]
      );

      res.json({ message: "Question Added", data: result.rows[0] });
    } catch (error) {
      console.error("ERROR_QUESTION", error);
      res.status(500).json({ error: "Failed" });
    }
  }
);

router.get("/:setId", authenticateToken, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM questions WHERE question_set_id = $1`,
    [req.params.setId]
  );
  res.json({ data: result.rows });
});

module.exports = router;
