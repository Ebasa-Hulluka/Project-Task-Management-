const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const {
  getTasksReport,
  getUsersReport,
  getProjectsReport,
  exportTasksReport,
  exportUsersReport,
  exportProjectsReport,
} = require("../controllers/reportController");

const router = express.Router();

// All report routes are protected and super admin only
router.use(protect);
router.use(authorize("admin"));

// Report Export Routes
router.get("/tasks", getTasksReport);
router.get("/users", getUsersReport);
router.get("/projects", getProjectsReport);

// Report Export Routes
router.get("/export/tasks", exportTasksReport);
router.get("/export/users", exportUsersReport);
router.get("/export/projects", exportProjectsReport);

module.exports = router;
