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
const { corsOptions } = require("./utils/corsConfig");

const app = express();
const server = http.createServer(app);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory at:", uploadsDir);
}

app.use(cors(corsOptions));

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

let PORT = Number(process.env.PORT) || 5000;

const logRoutes = (port) => {
  console.log(`Server running on port ${port}`);
  console.log(
    `Uploads accessible at: http://localhost:${port}/uploads/filename.jpg`,
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
};

const listen = (startingPort) =>
  new Promise((resolve, reject) => {
    const MAX_RETRIES = 20;
    let attempt = 0;
    let port = startingPort;

    const cleanupListeners = () => {
      server.off("error", handleError);
      server.off("listening", handleListening);
    };

    const handleError = (err) => {
      cleanupListeners();

      // In dev, avoid crashing nodemon when port is busy; try the next one.
      if (err && err.code === "EADDRINUSE" && attempt < MAX_RETRIES) {
        attempt += 1;
        port += 1;
        PORT = port;

        server.close(() => {
          server.once("error", handleError);
          server.once("listening", handleListening);
          server.listen(port);
        });
        return;
      }

      reject(err);
    };

    const handleListening = () => {
      cleanupListeners();
      logRoutes(port);
      resolve();
    };

    server.once("error", handleError);
    server.once("listening", handleListening);
    server.listen(port);
  });

const startServer = async () => {
  try {
    await connectDB();
    await ensureRoleHierarchy();
    console.log("Database connected successfully");
    console.log("Uploads folder path:", uploadsDir);
    console.log("Uploads folder exists:", fs.existsSync(uploadsDir));

    initSocket(server);
    await listen(PORT);
  } catch (err) {
    if (err && err.code === "EADDRINUSE") {
      console.error(
        `Failed to start server: port ${PORT} is already in use. Stop the other process or set a different PORT in backend/.env.`,
      );
    } else {
      console.error("Failed to start server", err);
    }
    process.exit(1);
  }
};

startServer();
