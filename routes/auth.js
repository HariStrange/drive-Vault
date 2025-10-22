const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/email");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  const { email, phone, name, password, role } = req.body;

  if (!email || !name || !password || !role) {
    return res
      .status(400)
      .json({ error: "Email, name, password, and role are required" });
  }

  if (!["driver", "welder", "student"].includes(role)) {
    return res
      .status(400)
      .json({ error: "Role must be driver, welder, or student" });
  }

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, phone, name, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role",
      [email, phone, name, passwordHash, role]
    );

    const user = result.rows[0];

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      "INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
      [user.id, verificationCode, expiresAt]
    );

    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      message:
        "Registration successful. Please check your email for verification code.",
      userId: user.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, name, phone, role, password_hash, is_verified FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (!user.is_verified) {
      return res
        .status(403)
        .json({ error: "Please verify your email before logging in" });
    }

    // Log the entered password and stored hash for debugging
    console.log("Login attempt for:", email);
    console.log("Entered password:", password);
    console.log("Stored password hash:", user.password_hash);

    // Compare the password with the hashed password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      console.log("Invalid password");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Log successful login attempt
    console.log("Login successful for:", email);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        message: "If the email exists, a reset link has been sent",
      });
    }

    const user = result.rows[0];

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, resetToken, expiresAt]
    );

    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: "If the email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Password reset request failed" });
  }
});

// Verify Email Route
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res
      .status(400)
      .json({ error: "Email and verification code are required" });
  }
  console.log("Email verfication triggered");
  try {
    const result = await pool.query(
      `SELECT vc.id, vc.code, vc.expires_at, u.id AS user_id 
       FROM verification_codes vc
       JOIN users u ON vc.user_id = u.id
       WHERE u.email = $1
       ORDER BY vc.created_at DESC
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Verification code not found. Please register again." });
    }

    const record = result.rows[0];
    const now = new Date();

    if (now > new Date(record.expires_at)) {
      return res.status(400).json({
        error: "Verification code expired. Please request a new one.",
      });
    }

    if (record.code !== code) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    // Mark user as verified
    await pool.query("UPDATE users SET is_verified = true WHERE id = $1", [
      record.user_id,
    ]);

    // Delete the used verification code
    await pool.query("DELETE FROM verification_codes WHERE id = $1", [
      record.id,
    ]);

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Email verification failed" });
  }
});

// Reset Password Route
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token and new password are required" });
  }

  try {
    const tokenResult = await pool.query(
      "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1",
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const resetToken = tokenResult.rows[0];

    if (new Date() > new Date(resetToken.expires_at)) {
      return res.status(400).json({ error: "Reset token expired" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2",
      [passwordHash, resetToken.user_id]
    );

    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [
      resetToken.user_id,
    ]);

    res.json({
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Password reset failed" });
  }
});

module.exports = router;
