const express = require("express");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Create new passport record
router.post(
  "/",
  authenticateToken,
  upload.fields([
    { name: "passport_photo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        passport_type,
        country_code,
        passport_number,
        full_name,
        nationality,
        sex,
        date_of_birth,
        place_of_birth,
        date_of_issue,
        date_of_expiry,
        place_of_issue,
        father_name,
        spouse_name,
        address,
      } = req.body;

      const passport_photo = req.files["passport_photo"]?.[0]?.filename || null;
      const signature = req.files["signature"]?.[0]?.filename || null;

      const result = await pool.query(
        `INSERT INTO passport_details (
        user_id, passport_type, country_code, passport_number, full_name,
        nationality, sex, date_of_birth, place_of_birth, date_of_issue,
        date_of_expiry, place_of_issue, father_name, spouse_name,
        address, passport_photo, signature
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      ) RETURNING *`,
        [
          req.user.id,
          passport_type,
          country_code,
          passport_number,
          full_name,
          nationality,
          sex,
          date_of_birth,
          place_of_birth,
          date_of_issue,
          date_of_expiry,
          place_of_issue,
          father_name,
          spouse_name,
          address,
          passport_photo,
          signature,
        ]
      );

      res.status(201).json({
        message: "Passport created successfully",
        passport: result.rows[0],
      });
    } catch (error) {
      console.error("Create passport error:", error);
      res.status(500).json({ error: "Failed to create passport" });
    }
  }
);
// Get all passports (Admin only)
router.get("/all", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.email, u.name, u.phone
       FROM passport_details p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json({ passports: result.rows });
  } catch (error) {
    console.error("Get passports error:", error);
    res.status(500).json({ error: "Failed to fetch passports" });
  }
});

// Get passport by user ID (for profile view)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM passport_details WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Passport details not found" });

    res.json({ passport: result.rows[0] });
  } catch (error) {
    console.error("Get my passport error:", error);
    res.status(500).json({ error: "Failed to fetch passport details" });
  }
});

// Update passport by user
router.put(
  "/me",
  authenticateToken,
  upload.fields([
    { name: "passport_photo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        passport_type,
        country_code,
        passport_number,
        full_name,
        nationality,
        sex,
        date_of_birth,
        place_of_birth,
        date_of_issue,
        date_of_expiry,
        place_of_issue,
        father_name,
        spouse_name,
        address,
      } = req.body;

      const passport_photo = req.files["passport_photo"]?.[0]?.filename || null;
      const signature = req.files["signature"]?.[0]?.filename || null;

      // build dynamic update
      const fields = [];
      const values = [req.user.id];
      let i = 2;

      const addField = (key, value) => {
        if (value !== undefined && value !== null && value !== "") {
          fields.push(`${key} = $${i++}`);
          values.push(value);
        }
      };

      addField("passport_type", passport_type);
      addField("country_code", country_code);
      addField("passport_number", passport_number);
      addField("full_name", full_name);
      addField("nationality", nationality);
      addField("sex", sex);
      addField("date_of_birth", date_of_birth);
      addField("place_of_birth", place_of_birth);
      addField("date_of_issue", date_of_issue);
      addField("date_of_expiry", date_of_expiry);
      addField("place_of_issue", place_of_issue);
      addField("father_name", father_name);
      addField("spouse_name", spouse_name);
      addField("address", address);
      if (passport_photo) addField("passport_photo", passport_photo);
      if (signature) addField("signature", signature);

      if (fields.length === 0)
        return res.status(400).json({ error: "No fields to update" });

      const query = `
        UPDATE passport_details
        SET ${fields.join(", ")}, updated_at = now()
        WHERE user_id = $1
        RETURNING *;
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0)
        return res.status(404).json({ error: "Passport record not found" });

      res.json({
        message: "Passport updated successfully",
        passport: result.rows[0],
      });
    } catch (error) {
      console.error("Update passport error:", error);
      res.status(500).json({ error: "Failed to update passport details" });
    }
  }
);

// Delete passport (Admin only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM passport_details WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Passport not found" });

    res.json({ message: "Passport record deleted successfully" });
  } catch (error) {
    console.error("Delete passport error:", error);
    res.status(500).json({ error: "Failed to delete passport" });
  }
});

module.exports = router;
