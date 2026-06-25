const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const verifyVendor = require("../middleware/vendorMiddleware"); // Role protection

const {
    createBooking,
    getMyBookings,
    getVendorBookings,
    updateBookingStatus, // ✅ This single function handles everything now!
    processBookingPayment // ✅ Added for payment processing
} = require("../controllers/bookingController");

/* ==========================================================================
   Customer Operations
   ========================================================================== */
router.post("/", verifyToken, createBooking); 
router.get("/my-bookings", verifyToken, getMyBookings);

// Customer Payment Verification Route
router.patch("/:id/pay", verifyToken, processBookingPayment);

/* ==========================================================================
   Vendor Dashboard Operations
   ========================================================================== */
// Both routes now strictly demand a valid token AND the vendor role attribute!
router.get("/vendor", verifyToken, verifyVendor, getVendorBookings);
router.patch("/:id/status", verifyToken, verifyVendor, updateBookingStatus);

module.exports = router;