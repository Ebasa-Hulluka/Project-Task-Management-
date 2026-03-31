const express = require("express");
const { getLandingStats, getAdminContact } = require("../controllers/publicController");

const router = express.Router();

router.get("/landing-stats", getLandingStats);
router.get("/admin-contact", getAdminContact);

module.exports = router;
