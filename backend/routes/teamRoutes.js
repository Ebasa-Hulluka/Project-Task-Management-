const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorize, authorizeStrict } = require("../middlewares/roleMiddleware");
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

// Team Routes - Project Manager can create, edit, and delete
router
  .route("/")
  .get(getAllTeams) // All authenticated users can view
  .post(authorizeStrict("projectManager"), createTeam);

router
  .route("/:id")
  .get(getTeamById)
  .put(authorizeStrict("projectManager"), updateTeam)
  .delete(authorizeStrict("projectManager"), deleteTeam);

// Member Management Routes
router.post(
  "/:id/members",
  authorizeStrict("projectManager"),
  addMemberToTeam,
);
router.delete(
  "/:id/members/:userId",
  authorizeStrict("projectManager"),
  removeMemberFromTeam,
);
router.put("/:id/lead", authorizeStrict("projectManager"), updateTeamLead);

module.exports = router;

