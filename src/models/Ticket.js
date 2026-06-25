const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    transportType: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    departureDateTime: {
        type: Date,
        required: true
    },
    perks: {
        type: [String],
        default: []
    },
    image: {
        type: String,
        required: true
    },

    // Vendor info
    vendorName: {
        type: String,
        required: true
    },
    vendorEmail: {
        type: String,
        required: true
    },

    // Admin approval
    verificationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending" // <-- Automatically applied on creation
    },

    // Advertisement
    advertised: {
        type: Boolean,
        default: false // <-- Automatically applied on creation
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Ticket", ticketSchema);

