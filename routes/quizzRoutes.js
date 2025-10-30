const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/quizzUpload");

const router = express.Router();

/**
 * ===============================================
 * 1️⃣  CREATE QUESTION SET (Admin)
 * ===============================================
 */
router.post("/set", authenticateToken, async (req, res) => {
  try {
    const { set_name, category } = req.body;

    if (!set_name || !category)
      return res.status(400).json({ error: "set_name and category are required" });

    const result = await pool.query(
      `INSERT INTO question_sets (set_name, category, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [set_name, category, req.user.id]
    );

    res.status(201).json({
      message: "Question set created successfully",
      set: result.rows[0],
    });
  } catch (error) {
    console.error("Create question set error:", error);
    res.status(500).json({ error: "Failed to create question set" });
  }
});

/**
 * ===============================================
 * 2️⃣  CREATE QUESTION (text/image)
 * ===============================================
 */
router.post(
  "/question",
  authenticateToken,
  upload.fields([{ name: "question_image", maxCount: 1 }]),
  async (req, res) => {
    try {
      const { question_set_id, question_text, question_type } = req.body;

      if (!question_set_id)
        return res.status(400).json({ error: "question_set_id is required" });

      const question_image_url = req.files["question_image"]?.[0]?.filename || null;
      const type = question_type || (question_image_url ? "image" : "text");

      const result = await pool.query(
        `INSERT INTO questions (question_set_id, question_text, question_image_url, question_type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [question_set_id, question_text || null, question_image_url, type]
      );

      res.status(201).json({
        message: "Question created successfully",
        question: result.rows[0],
      });
    } catch (error) {
      console.error("Create question error:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  }
);

/**
 * ===============================================
 * 3️⃣  ADD OPTIONS TO A QUESTION
 * ===============================================
 */
router.post(
  "/question/:id/options",
  authenticateToken,
  async (req, res) => {
    try {
      const { options } = req.body; // expect [{ option_text: "", is_correct: true/false }]

      if (!options || !Array.isArray(options) || options.length === 0)
        return res.status(400).json({ error: "Options array required" });

      const questionId = req.params.id;

      const inserted = [];
      for (const opt of options) {
        const result = await pool.query(
          `INSERT INTO question_options (question_id, option_text, is_correct)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [questionId, opt.option_text, opt.is_correct || false]
        );
        inserted.push(result.rows[0]);
      }

      res.status(201).json({
        message: "Options added successfully",
        options: inserted,
      });
    } catch (error) {
      console.error("Add options error:", error);
      res.status(500).json({ error: "Failed to add options" });
    }
  }
);

/**
 * ===============================================
 * 4️⃣  ASSIGN RANDOM QUESTION SET TO USER
 * ===============================================
 */
router.post("/assign-set", authenticateToken, async (req, res) => {
  try {
    const { user_id, category } = req.body;

    if (!user_id || !category)
      return res.status(400).json({ error: "user_id and category are required" });

    const setsResult = await pool.query(
      `SELECT id FROM question_sets WHERE category = $1`,
      [category]
    );

    if (setsResult.rows.length === 0)
      return res.status(404).json({ error: "No sets found for this category" });

    const randomSet =
      setsResult.rows[Math.floor(Math.random() * setsResult.rows.length)].id;

    const assignResult = await pool.query(
      `INSERT INTO user_question_sets (user_id, question_set_id)
       VALUES ($1, $2) RETURNING *`,
      [user_id, randomSet]
    );

    res.status(201).json({
      message: "Set assigned successfully",
      assigned: assignResult.rows[0],
    });
  } catch (error) {
    console.error("Assign set error:", error);
    res.status(500).json({ error: "Failed to assign question set" });
  }
});

/**
 * ===============================================
 * 5️⃣  FETCH QUESTIONS BY SET ID
 * ===============================================
 */
router.get("/set/:id/questions", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const questions = await pool.query(
      `SELECT q.*, json_agg(json_build_object('id', o.id, 'option_text', o.option_text, 'is_correct', o.is_correct))
       AS options
       FROM questions q
       LEFT JOIN question_options o ON q.id = o.question_id
       WHERE q.question_set_id = $1
       GROUP BY q.id
       ORDER BY q.id ASC`,
      [id]
    );

    res.json({
      set_id: id,
      questions: questions.rows,
    });
  } catch (error) {
    console.error("Fetch set questions error:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

module.exports = router;
