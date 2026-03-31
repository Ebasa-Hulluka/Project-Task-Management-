const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
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
  .post(authorize("admin", "projectManager"), createTask);

router.get("/project/:projectId", getTasksByProject);

router
  .route("/:id")
  .get(getTaskById)
  .put(updateTask)
  .delete(authorize("admin", "projectManager"), deleteTask);

// Task Action Routes
router.put("/:id/status", updateTaskStatus);
router.put("/:id/todo", updateTaskChecklist);

module.exports = router;
