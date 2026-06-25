const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true // Guarantees that the same Stripe charge can't be logged twice
    },
    amount: {
        type: Number,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Transaction", transactionSchema);