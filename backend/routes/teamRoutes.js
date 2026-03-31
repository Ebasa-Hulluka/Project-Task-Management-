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

// Team Routes - Admin only for modifications
router
  .route("/")
  .get(getAllTeams) // All authenticated users can view
  .post(authorize("admin"), createTeam);

router
  .route("/:id")
  .get(getTeamById)
  .put(authorize("admin"), updateTeam)
  .delete(authorize("admin"), deleteTeam);

// Member Management Routes
router.post("/:id/members", authorize("admin"), addMemberToTeam);
router.delete("/:id/members/:userId", authorize("admin"), removeMemberFromTeam);
router.put("/:id/lead", authorize("admin"), updateTeamLead);

module.exports = router;
