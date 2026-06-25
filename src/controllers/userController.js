const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Ticket = require("../models/Ticket");

// Register User
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).send({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Login User
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send({ message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send({ message: "Invalid credentials" });
        }
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.status(200).send({ token, user });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// GET all users (so the admin can see the list in ManageUsers.jsx)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// 👑 UPDATE a user's role dynamically (Handles both Admin and Vendor promotions via req.body)
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body; // Expects "vendor" or "admin"
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { role }, 
            { new: true }
        );
        res.status(200).send(updatedUser);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// 🛡️ Toggle User Fraud Status (Maps directly to frontend toggleFraudStatus API.patch route)
const toggleUserFraud = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send({ message: "User not found" });

        // Flip the true/false boolean switch
        user.isFraud = !user.isFraud;
        await user.save();

        // 🚀 Smart Cascading Logic: If user is newly flagged as fraud, automatically reject all their tickets
        if (user.isFraud) {
            await Ticket.updateMany(
                { vendorEmail: user.email },
                { verificationStatus: "rejected" }
            );
        }

        res.status(200).send(user);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Legacy fallback method preserved for schema compliance
const markAsFraud = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isFraud: true }, { new: true });
        if (!user) return res.status(404).send({ message: "User not found" });

        await Ticket.updateMany(
            { vendorEmail: user.email },
            { verificationStatus: "rejected" }
        );

        res.status(200).send({ message: "Vendor marked as fraud and all tickets hidden.", user });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    updateUserRole,
    toggleUserFraud, // ✅ Added here to support your dual-state button toggle pipeline
    markAsFraud
};