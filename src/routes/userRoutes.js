const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    getAllUsers,
    updateUserRole, 
    toggleUserFraud, // ✅ Imported the fraud toggle function
    markAsFraud 
} = require("../controllers/userController");

// Import Middlewares
const verifyToken = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/adminMiddleware");

/* ==========================================================================
   Public Auth Routes
   ========================================================================== */
router.post("/register", registerUser);
router.post("/login", loginUser);

/* ==========================================================================
   Protected User Routes
   ========================================================================== */
router.get("/profile", verifyToken, (req, res) => {
    res.send(req.user);
});

/* ==========================================================================
   Admin-Only Management Routes
   ========================================================================== */
// Route to fetch all system profiles
router.get("/", verifyToken, verifyAdmin, getAllUsers);

// Unified route to handle role promotions (Maps cleanly to: API.patch(`/users/${id}/role`))
router.patch("/:id/role", verifyToken, verifyAdmin, updateUserRole);

// Route to toggle fraud status (Maps cleanly to: API.patch(`/users/${userId}/toggle-fraud`))
router.patch("/:id/toggle-fraud", verifyToken, verifyAdmin, toggleUserFraud);

// Legacy route to flag malicious behavior or system fraud
router.patch("/:id/fraud", verifyToken, verifyAdmin, markAsFraud);

module.exports = router;