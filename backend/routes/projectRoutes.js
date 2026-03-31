const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectProgress,
} = require("../controllers/projectController");

const router = express.Router();

// All project routes are protected
router.use(protect);

// Project Routes
router
  .route("/")
  .get(getAllProjects) // All authenticated users can view (filtered by role)
  .post(authorize("admin", "projectManager"), createProject);

router
  .route("/:id")
  .get(getProjectById)
  .put(authorize("admin", "projectManager"), updateProject)
  .delete(authorize("admin"), deleteProject);

router.get("/:id/progress", getProjectProgress);

module.exports = router;
