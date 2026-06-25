const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { fakePayment, getMyTransactions } = require("../controllers/paymentController");

// User Dashboard History Lookup
router.get("/my-history", verifyToken, getMyTransactions);

// Core Processing Pipeline
router.post("/:id", verifyToken, fakePayment);
//router.post("/:bookingId", fakePayment);

module.exports = router;