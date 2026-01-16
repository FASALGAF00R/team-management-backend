import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";


import authRoutes from "./routes/auth.routes.js";
import userRoutes from './routes/user.routes.js'
import roleRoutes from './routes/role.routes.js'
import teamRoutes from "./routes/team.routes.js";
import auditRoutes from "./routes/audit.routes.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use("/api/auth", authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/auditlogs", auditRoutes);



// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend server is running ",
  });
});


// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" MongoDB connected");
  } catch (error) {
    console.error(" MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
  });
});
