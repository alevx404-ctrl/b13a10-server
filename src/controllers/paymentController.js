const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose"); // 👈 Added mongoose import

// Fake Payment Processor Pipeline
const fakePayment = async (req, res) => {
  try {
    // 1. Locate the booking session
    //const booking = await Booking.findById(req.params.id);
    const bookingId = req.params.id || req.params.bookingId;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).send({ message: "Booking not found" });
    }

    // 2. Locate the linked ticket
    const ticket = await Ticket.findById(booking.ticketId);
    if (!ticket) {
      return res.status(404).send({ message: "Ticket not found" });
    }

    // 3. Mark booking as paid
    booking.status = "paid";
    await booking.save();

    // 4. Reduce available ticket inventory
    ticket.quantity = ticket.quantity - booking.bookingQuantity;
    await ticket.save();

    // 5. Generate and store a transactional receipt
    const transaction = new Transaction({
      transactionId: "FAKE_" + Date.now(),
      amount: booking.totalPrice,
      userId: booking.userId,
      ticketId: booking.ticketId,
    });
    await transaction.save();

    res.status(200).send({
      message: "Payment Successful",
      transaction,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Fetch History Logs for User Dashboard (New)
const getMyTransactions = async (req, res) => {
  try {
    const currentUserId = req.user?.userId || req.user?._id || req.user?.id;
    
    console.log("\n=== 💳 TRANSACTION FETCH DEBUG ===");
    console.log("Logged-in User Context ID:", currentUserId);

    if (!currentUserId) {
      return res.status(401).send({ message: "User identity missing from context request" });
    }

    // 🛡️ Bulletproof Array: Search by both String and native ObjectId formats
    const queryIds = [currentUserId.toString()];
    if (mongoose.Types.ObjectId.isValid(currentUserId)) {
      queryIds.push(new mongoose.Types.ObjectId(currentUserId));
    }

    // Find transactions matching either data type configuration
    const transactions = await Transaction.find({
      userId: { $in: queryIds },
    }).populate("ticketId", "title price from to"); // Grabs needed frontend details

    console.log(`Found ${transactions.length} transactions in database for this user.`);
    
    if (transactions.length > 0) {
      console.log("Sample Transaction data being sent:", transactions[0]);
    }

    res.status(200).send(transactions);
  } catch (error) {
    console.error("🔥 Transaction Controller Error:", error);
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  fakePayment,
  getMyTransactions,
};