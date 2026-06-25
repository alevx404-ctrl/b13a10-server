const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/adminMiddleware");

const {
    getAllTickets,
    addTicket,
    getTicketById,
    updateTicket,
    updateTicketExposure, // <-- Swapped import here cleanly
    deleteTicket,
    approveTicket,
    rejectTicket
} = require("../controllers/ticketController");

// General Routes
router.get("/", getAllTickets);
router.post("/", addTicket);

// Specific ID Routes
router.get("/:id", getTicketById);
router.patch("/:id", updateTicket);
router.delete("/:id", deleteTicket);

// Advertisement Route
router.patch("/:id/advertise", updateTicketExposure); // <-- Updated endpoint handler link here

// Admin Control Endpoints
router.patch("/:id/approve", verifyToken, verifyAdmin, approveTicket);
router.patch("/:id/reject", verifyToken, verifyAdmin, rejectTicket);

module.exports = router;