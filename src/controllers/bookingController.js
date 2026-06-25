const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const Transaction = require("../models/Transaction"); // 👈 Added this missing model import!

// Create Booking
const createBooking = async (req, res) => {
    try {
        const { ticketId, bookingQuantity } = req.body;
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).send({ message: "Ticket not found" });
        }

        const totalPrice = ticket.price * bookingQuantity;

        const booking = new Booking({
            ticketId,
            userId: req.user?.userId || req.user?._id || req.body.userId || "660ad1e29f1a2c3b4c5d6e7f",
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
        const bookings = await Booking.find({ userId: currentUserId }).populate("ticketId");
        res.status(200).send(bookings);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Fetch all bookings for Vendors
const getVendorBookings = async (req, res) => {
    try {
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

// Process Booking Payment (Now builds Transaction receipts!)
const processBookingPayment = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).send({ message: "Booking not found" });

        // Security Check
        const currentUserId = req.user?.userId || req.user?._id || req.user?.id;
        if (!currentUserId || booking.userId.toString() !== currentUserId.toString()) {
            return res.status(403).send({ message: "Unauthorized payment operation restricted." });
        }

        if (booking.status !== "accepted") {
            return res.status(400).send({ message: "Only approved vendor listings can process payment settlements." });
        }

        // 1. Advance lifecycle state to paid
        booking.status = "paid";
        await booking.save();

        // 2. Reduce available ticket inventory stock
        const ticket = await Ticket.findById(booking.ticketId);
        if (ticket) {
            ticket.quantity = Math.max(0, ticket.quantity - booking.bookingQuantity);
            await ticket.save();
        }

        // 3. Generate and store the transactional receipt document inside MongoDB
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