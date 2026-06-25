const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    vendorEmail: { // Added per assignment instructions
        type: String,
        required: true
    },
    bookingQuantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "paid"],
        default: "pending"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Booking", bookingSchema);