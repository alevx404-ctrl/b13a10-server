const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const verifyVendor = require("../middleware/vendorMiddleware");
const { getVendorRevenue } = require("../controllers/vendorController");

// Secure layout route to check stats
router.get("/revenue", verifyToken, verifyVendor, getVendorRevenue);

module.exports = router;