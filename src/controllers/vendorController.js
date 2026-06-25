const Ticket = require("../models/Ticket");
const Transaction = require("../models/Transaction");

const getVendorRevenue = async (req, res) => {
    try {
        const vendorEmail = req.user.email;

        // 1. Calculate how many total distinct ticket templates this vendor created
        const totalTicketsAdded = await Ticket.countDocuments({ vendorEmail });

        // 2. Fetch all actual tickets owned by this vendor to scan transactions against them
        const vendorTickets = await Ticket.find({ vendorEmail });
        const ticketIds = vendorTickets.map(ticket => ticket._id);

        // 3. Find all closed transaction documents linked to those specific tickets
        const transactions = await Transaction.find({ ticketId: { $in: ticketIds } });

        // 4. Run an aggregation summary across the logs matching your assignment keys
        const totalRevenue = transactions.reduce((sum, item) => sum + item.amount, 0);
        const totalTicketsSold = transactions.length; 

        res.status(200).send({
            totalTicketsAdded,
            totalTicketsSold,
            totalRevenue
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

module.exports = {
    getVendorRevenue
};