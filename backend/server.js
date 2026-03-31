require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
  override: true,
});
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const connectDB = require("./config/db");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const projectRoutes = require("./routes/projectRoutes");
const teamRoutes = require("./routes/teamRoutes");
const reportRoutes = require("./routes/reportRoutes");
const publicRoutes = require("./routes/publicRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { initSocket } = require("./socket/chatSocket");
const { ensureRoleHierarchy } = require("./utils/roleBootstrapService");

const app = express();
const server = http.createServer(app);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory at:", uploadsDir);
}

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    index: false,
    dotfiles: "ignore",
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await ensureRoleHierarchy();
    console.log("Database connected successfully");
    console.log("Uploads folder path:", uploadsDir);
    console.log("Uploads folder exists:", fs.existsSync(uploadsDir));

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `Uploads accessible at: http://localhost:${PORT}/uploads/filename.jpg`,
      );

      console.log("\n=== Available API Routes ===");
      console.log("Auth Routes: /api/auth");
      console.log("User Routes: /api/users");
      console.log("Task Routes: /api/tasks");
      console.log("Project Routes: /api/projects");
      console.log("Team Routes: /api/teams");
      console.log("Report Routes: /api/reports");
      console.log("Public Routes: /api/public");
      console.log("Notification Routes: /api/notifications");
      console.log("Activity Routes: /api/activity");
      console.log("Chat Routes: /api/chat");
      console.log("===========================\n");
    });
  } catch (err) {
    console.error("Failed to start server due to DB connection error", err);
    process.exit(1);
  }
};

startServer();
