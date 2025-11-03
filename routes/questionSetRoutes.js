const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ✅ Create question set
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { set_name, category } = req.body;

    if (!set_name || !category) {
      return res.status(400).json({ error: "set_name and category required" });
    }

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

// ✅ Delete question set and related data
router.delete("/:id", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query("BEGIN");

    // Delete assignments
    await client.query(
      "DELETE FROM user_question_sets WHERE question_set_id = $1",
      [id]
    );

    // Delete options
    await client.query(
      `DELETE FROM question_options 
       WHERE question_id IN (SELECT id FROM questions WHERE question_set_id = $1)`,
      [id]
    );

    // Delete questions
    await client.query(
      "DELETE FROM questions WHERE question_set_id = $1",
      [id]
    );

    // Delete set
    const result = await client.query(
      "DELETE FROM question_sets WHERE id = $1 RETURNING *",
      [id]
    );

    await client.query("COMMIT");

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Set not found" });
    }

    res.status(200).json({ message: "Deleted successfully", data: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ERROR_DELETING_SET", err);
    res.status(500).json({ error: "Failed to delete set" });
  } finally {
    client.release();
  }
});

module.exports = router;