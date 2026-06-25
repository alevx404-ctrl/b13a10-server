const Ticket = require("../models/Ticket");

// GET all tickets (Supports filtering, sorting, and pagination)
const getAllTickets = async (req, res) => {
    try {
        // 🛠️ Extracted 'status' cleanly from the client network request query parameters
        const { from, to, transportType, sort, status } = req.query;

        // 🛠️ DYNAMIC FALLBACK SYSTEM: If an admin console passes ?status=pending, track pending entries.
        // Otherwise, defaults directly back to "approved" so public catalogs don't expose unverified assets.
        const query = {};
        if (status) {
            query.verificationStatus = status;
        } else {
            query.verificationStatus = "approved";
        }

        // Dynamically build filtering objects if query parameters exist
        if (from) {
            query.from = from;
        }

        if (to) {
            query.to = to;
        }

        if (transportType) {
            query.transportType = transportType;
        }

        // Initialize the Mongoose query builder object
        let mongoQuery = Ticket.find(query);

        // Apply sorting rules based on 'price' if requested
        if (sort === "asc") {
            mongoQuery = mongoQuery.sort({ price: 1 }); // Lowest to highest
        }

        if (sort === "desc") {
            mongoQuery = mongoQuery.sort({ price: -1 }); // Highest to lowest
        }

        // Pagination setup
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Chain pagination onto the query builder
        mongoQuery = mongoQuery.skip(skip).limit(limit);

        // Execute the completed query chain
        const tickets = await mongoQuery;

        res.status(200).send(tickets);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
};

// GET single ticket
const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).send({
                message: "Ticket not found"
            });
        }

        res.status(200).send(ticket);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
};

// POST a new ticket
const addTicket = async (req, res) => {
    try {
        // Block if user is marked as fraud
        if (req.user && req.user.isFraud) {
            return res.status(403).send({ message: "Access denied. Your account is flagged for fraud." });
        }

        const ticket = new Ticket(req.body);
        const result = await ticket.save();
        res.status(201).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
};

// UPDATE ticket
const updateTicket = async (req, res) => {
    try {
        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } 
        );

        if (!updatedTicket) {
            return res.status(404).send({
                message: "Ticket not found"
            });
        }

        res.status(200).send(updatedTicket);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
};

// Toggle or update ticket advertisement status string configurations
const updateTicketExposure = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expecting 'featured' or 'standard'

        // 1. Find the ticket document
        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).send({ message: "Ticket not found" });

        // 2. Assign the new exposure/status string
        ticket.exposure = status; 

        // 🛠️ FIELD RESTORATION ALIGNMENT: Forces matching status mappings directly into database boolean flags
        const isFeaturedBoolean = status === "featured";
        ticket.isAdvertised = isFeaturedBoolean;
        ticket.advertised = isFeaturedBoolean;

        // 3. CRITICAL: Save the changes to MongoDB with await execution
        await ticket.save(); 

        res.status(200).send(ticket);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// DELETE ticket
const deleteTicket = async (req, res) => {
    try {
        const deletedTicket = await Ticket.findByIdAndDelete(req.params.id);

        if (!deletedTicket) {
            return res.status(404).send({
                message: "Ticket not found"
            });
        }

        res.status(200).send({
            message: "Ticket deleted successfully!"
        });
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
};

// Approve a Ticket
const approveTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { verificationStatus: "approved" },
            { new: true }
        );
        res.status(200).send(ticket);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Reject a Ticket
const rejectTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { verificationStatus: "rejected" },
            { new: true }
        );
        res.status(200).send(ticket);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Exporting controller functions cleanly
module.exports = {
    getAllTickets,
    getTicketById,
    addTicket,
    updateTicket,
    updateTicketExposure, 
    deleteTicket,
    approveTicket,
    rejectTicket
};