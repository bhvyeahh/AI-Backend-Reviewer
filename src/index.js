// src/server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; // import MongoDB connection file
import userRoutes from "./routes/user.routes.js";

dotenv.config(); // load .env variables

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Connect MongoDB Atlas
connectDB();

// ✅ Base route
app.get("/", (req, res) => {
  res.send("✅ API running and MongoDB connected successfully!");
});

// ✅ User Routes
app.use("/api/v1/users", userRoutes);

// ✅ Error handling middleware (optional but good practice)
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
