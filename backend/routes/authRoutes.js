const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const {
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  changeUserPassword,
} = require("../controllers/authController");

router.post("/login", loginUser);

// Protected Rotes
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
