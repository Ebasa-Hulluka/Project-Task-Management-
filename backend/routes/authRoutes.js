const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const {
  loginUser,
  selectLoginRole,
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  changeUserPassword,
  requestPasswordReset,
} = require("../controllers/authController");

router.post("/login", loginUser);
router.post("/select-role", selectLoginRole);
router.post("/forgot-password", requestPasswordReset);

// Protected Routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.post("/change-password", protect, changeUserPassword);
router.put("/change-password", protect, changeUserPassword);
router.post(
  "/upload-image",
  protect,
  upload.single("profileImage"),
  uploadProfileImage,
);

module.exports = router;
