const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const ticketRoutes = require("./routes/ticketRoutes");
const userRoutes = require("./routes/userRoutes"); 
const bookingRoutes = require("./routes/bookingRoutes"); 
const paymentRoutes = require("./routes/paymentRoutes"); 
const vendorRoutes = require("./routes/vendorRoutes"); 

const app = express();

// Back to standard global settings
app.use(cors());
app.use(express.json());

// Home Route
app.get("/", (req, res) => {
    res.send("TicketBari Server Running");
});

/* ==========================================================================
   Routes Architecture Setup
   ========================================================================== */
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes); 
app.use("/api/bookings", bookingRoutes); 
app.use("/api/payments", paymentRoutes); 
app.use("/api/vendors", vendorRoutes); 

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();