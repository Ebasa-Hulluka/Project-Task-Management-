const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const taskUpload = require("../middlewares/taskUploadMiddleware");
const {
  getDashboardData,
  getUserDashboardData,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  uploadTaskAttachment,
  reviewTask,
  getTasksByProject,
} = require("../controllers/taskController");

const router = express.Router();

// All task routes are protected
router.use(protect);

// Dashboard Routes
router.get("/dashboard-data", authorize("admin"), getDashboardData);
router.get("/user-dashboard-data", getUserDashboardData);

// Task Routes
router
  .route("/")
  .get(getTasks)
  .post(authorize("projectManager"), createTask);

router.get("/project/:projectId", getTasksByProject);

router.post(
  "/upload-attachment",
  taskUpload.single("file"),
  uploadTaskAttachment,
);

router
  .route("/:id")
  .get(getTaskById)
  .put(updateTask)
  .delete(authorize("projectManager"), deleteTask);

// Task Action Routes
router.put(
  "/:id/status",
  authorize("teamMember", "projectManager"),
  updateTaskStatus,
);
router.put(
  "/:id/todo",
  authorize("teamMember", "projectManager"),
  updateTaskChecklist,
);
router.put("/:id/review", reviewTask);

module.exports = router;
