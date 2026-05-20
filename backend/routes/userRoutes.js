const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const {
  getUsers,
  createUser,
  getUserById,
  deleteUser,
  deactivateUserAccount,
  updateUserRole,
  assignUserToTeam,
  getUsersByRole,
  getTeamMembers,
  reactivateUserAccount,
  getDeactivatedUsers,
  getPasswordResetRequests,
  completePasswordResetRequest,
} = require("../controllers/userController");

const router = express.Router();

// All user routes are protected
router.use(protect);

// User Management Routes - Admin/Project Manager can view users
router
  .route("/")
  .get(authorize("admin", "projectManager"), getUsers)
  .post(authorize("admin"), createUser);

router.get("/role/:role", authorize("admin", "projectManager"), getUsersByRole);
router.get("/team-members", authorize("admin", "projectManager"), getTeamMembers);
router.get("/deactivated", authorize("admin"), getDeactivatedUsers);
router.get("/password-reset-requests", authorize("superAdmin"), getPasswordResetRequests);
router.post(
  "/password-reset-requests/:id/complete",
  authorize("superAdmin"),
  completePasswordResetRequest,
);

router
  .route("/:id")
  .get(authorize("admin"), getUserById)
  .delete(authorize("admin"), deleteUser);

router.put("/:id/role", authorize("admin"), updateUserRole);
router.post("/assign-team", authorize("admin"), assignUserToTeam);
router.post("/deactivate/:id", authorize("admin"), deactivateUserAccount);
router.post("/reactivate/:id", authorize("admin"), reactivateUserAccount);

module.exports = router;
