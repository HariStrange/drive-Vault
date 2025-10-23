require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const passportRoutes = require("./routes/passport");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Recruiting Company API - Multi-tenant System" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/passport", passportRoutes);
app.use("/uploads", express.static("uploads"));

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
