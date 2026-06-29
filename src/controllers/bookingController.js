const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const Transaction = require("../models/Transaction");

// Create Booking
const createBooking = async (req, res) => {
    try {
        const { ticketId, bookingQuantity } = req.body;
        
        // 🔒 STRICT AUTH CHECK: Force reliance on JWT middleware only
        const currentUserId = req.user?.userId || req.user?._id || req.user?.id;
        if (!currentUserId) {
            return res.status(401).send({ 
                message: "Authentication required. Please log in to complete your booking." 
            });
        }

        // --- BACKEND QUANTITY RANGE VALIDATION ---
        if (!bookingQuantity || bookingQuantity < 1) {
            return res.status(400).send({
                message: "Invalid quantity. You must reserve at least 1 seat."
            });
        }
        // ------------------------------------------

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).send({ message: "Ticket route not found." });
        }

        // --- INTEGRATED BACKEND CHECKS FOR CREATION ---
        if (ticket.quantity <= 0) {
            return res.status(400).send({
                message: "Ticket sold out."
            });
        }
        if (new Date(ticket.departureDateTime) <= new Date()) {
            return res.status(400).send({
                message: "Departure time has already passed."
            });
        }
        // --------------------------------------------------

        // Enforce strict upper boundaries on remaining stock
        if (bookingQuantity > ticket.quantity) {
            return res.status(400).send({ 
                message: `Not enough seats available. Only ${ticket.quantity} space(s) left.` 
            });
        }

        const totalPrice = ticket.price * bookingQuantity;

        const booking = new Booking({
            ticketId,
            userId: currentUserId,
            vendorEmail: ticket.vendorEmail,
            bookingQuantity,
            totalPrice
        });

        await booking.save();
        res.status(201).send(booking);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Get My Bookings (For Customers)
const getMyBookings = async (req, res) => {
    try {
        const currentUserId = req.user?.userId || req.user?._id || req.user?.id;
        
        if (!currentUserId) {
            return res.status(401).send({ message: "Unauthorized. Profile identity missing." });
        }

        const bookings = await Booking.find({ userId: currentUserId }).populate("ticketId");
        res.status(200).send(bookings);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Fetch all bookings for Vendors
const getVendorBookings = async (req, res) => {
    try {
        if (!req.user?.email) {
            return res.status(401).send({ message: "Unauthorized. Vendor identity missing." });
        }

        const vendorTickets = await Ticket.find({ vendorEmail: req.user.email });
        const ticketIds = vendorTickets.map(ticket => ticket._id);

        const bookings = await Booking.find({ ticketId: { $in: ticketIds } })
            .populate("ticketId")
            .populate("userId", "name email"); 

        res.status(200).send(bookings);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Update booking status (Accept / Reject)
const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).send({ message: "Invalid status update" });
        }

        const booking = await Booking.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!booking) {
            return res.status(404).send({ message: "Booking session not found" });
        }

        res.status(200).send({ message: `Booking ${status} successfully!`, booking });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Process Booking Payment
const processBookingPayment = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).send({ message: "Booking not found" });

        const currentUserId = req.user?.userId || req.user?._id || req.user?.id;
        if (!currentUserId || booking.userId.toString() !== currentUserId.toString()) {
            return res.status(403).send({ message: "Unauthorized payment operation restricted." });
        }

        if (booking.status !== "accepted") {
            return res.status(400).send({ message: "Only approved vendor listings can process payment settlements." });
        }

        const ticket = await Ticket.findById(booking.ticketId);
        if (!ticket) {
            return res.status(404).send({ message: "Associated ticket route not found." });
        }

        // --- INTEGRATED BACKEND CHECKS FOR PAYMENT ---
        if (new Date(ticket.departureDateTime) <= new Date()) {
            return res.status(400).send({
                message: "Cannot pay after departure."
            });
        }
        // -------------------------------------------------

        // Update booking status to paid
        booking.status = "paid";
        await booking.save();

        // Reduce current inventory pool sizes safely using the dynamically parsed bookingQuantity
        ticket.quantity = Math.max(0, ticket.quantity - booking.bookingQuantity);
        await ticket.save();

        const transaction = new Transaction({
            transactionId: "TXN_" + Date.now() + Math.floor(Math.random() * 1000),
            amount: booking.totalPrice,
            userId: booking.userId,
            ticketId: booking.ticketId,
        });
        await transaction.save();

        res.status(200).send({ 
            message: "Payment settled and transaction recorded successfully!", 
            booking,
            transaction 
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    getVendorBookings,
    updateBookingStatus,
    processBookingPayment
};