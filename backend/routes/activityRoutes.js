const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { getUserActivity } = require("../controllers/activityController");

const router = express.Router();

router.use(protect);
router.get("/", getUserActivity);

module.exports = router;
