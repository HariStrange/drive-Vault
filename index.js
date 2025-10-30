require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const passportRoutes = require("./routes/passport");
const questionSetRoutes = require("./routes/questionSetRoutes"); // POST/GET / for sets
const questionRoutes = require("./routes/questionRoutes"); // POST /, GET /:setId for questions
const optionRoutes = require("./routes/optionRoutes"); // POST / for options
const quizzRoutes = require("./routes/quizzRoutes"); // POST /assign-set, GET /set/:id/questions (no overlap w/ others)

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // ✅ Add your frontend origin for dev (adjust for prod)
  credentials: true
}));
app.use(express.json({ limit: "50mb" })); // For JSON payloads w/ images
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // For form-data

// Health Check
app.get("/", (req, res) => {
  res.json({ message: "Recruiting Company API - Multi-tenant System" });
});

// API Routes (exact match to frontend calls)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/passport", passportRoutes);
app.use("/api/question-sets", questionSetRoutes); // Frontend: GET/POST /api/question-sets
app.use("/api/questions", questionRoutes); // Frontend: POST /api/questions (w/ multer), GET /api/questions/:setId
app.use("/api/options", optionRoutes); // Frontend: POST /api/options
app.use("/api/quizz", quizzRoutes); // Frontend: POST /api/quizz/assign-set

// Static files for Passport Uploads
app.use("/uploads/passports", express.static(path.join(__dirname, "uploads/passports")));

// Static files for Quiz Images (match your multer dest in quizUpload.js)
app.use("/uploads/quizzes", express.static(path.join(__dirname, "uploads/quizzes"))); // ✅ Fixed: Use "uploads/quizzes" (update multer dest if needed)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🚨 Global error:", err.stack); // ✅ Better logging
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler (after all routes)
app.use((req, res) => {
  console.log(`🚫 404: ${req.method} ${req.originalUrl}`); // ✅ Log missing routes
  res.status(404).json({ error: "Route not found" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API Endpoints:`);
  console.log(`   - Sets: GET/POST /api/question-sets`);
  console.log(`   - Questions: POST /api/questions, GET /api/questions/:setId`);
  console.log(`   - Options: POST /api/options`);
  console.log(`   - Assign: POST /api/quizz/assign-set`);
  console.log(`   - Users: GET /api/users/admin/all-users`);
  console.log(`📁 Static: /uploads/passports & /uploads/quizzes`);
});