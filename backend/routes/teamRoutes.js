const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMemberToTeam,
  removeMemberFromTeam,
  updateTeamLead,
} = require("../controllers/teamController");

const router = express.Router();

// All team routes are protected
router.use(protect);

// Team Routes - Admin & Project Manager can create, edit, and delete
router
  .route("/")
  .get(getAllTeams) // All authenticated users can view
  .post(authorize("admin", "projectManager"), createTeam);

router
  .route("/:id")
  .get(getTeamById)
  .put(authorize("admin", "projectManager"), updateTeam)
  .delete(authorize("admin", "projectManager"), deleteTeam);

// Member Management Routes
router.post(
  "/:id/members",
  authorize("admin", "projectManager"),
  addMemberToTeam,
);
router.delete(
  "/:id/members/:userId",
  authorize("admin", "projectManager"),
  removeMemberFromTeam,
);
router.put("/:id/lead", authorize("admin", "projectManager"), updateTeamLead);

module.exports = router;
