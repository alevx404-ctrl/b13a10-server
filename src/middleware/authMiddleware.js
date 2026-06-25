const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token = null;

        // 1. Look for legacy JWT token in Authorization Header
        if (authHeader && authHeader.startsWith("Bearer")) {
            token = authHeader.split(" ")[1];
        }

        // 2. Look for Better Auth Session Token in Cookies or Fallback Header
        const betterAuthSessionToken = 
            (req.cookies && req.cookies["better-auth.session_token"]) || token;

        if (!token && !betterAuthSessionToken) {
            return res.status(401).send({
                message: "Unauthorized"
            });
        }

        // --- Execution Path A: Handle Legacy / Manual JWT Token Verification ---
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Attach decoded payload (userId, email, role) exactly as your routes expect
                req.user = decoded;
                return next();
            } catch (jwtError) {
                // If it's a structural JWT parsing error but we don't have a Google session fallback, fail immediately
                if (!betterAuthSessionToken || betterAuthSessionToken === token) {
                    return res.status(401).send({
                        message: "Invalid token"
                    });
                }
            }
        }

        // --- Execution Path B: Handle Better Auth Database Session Verification ---
        if (betterAuthSessionToken) {
            const db = mongoose.connection.db;
            
            // Look up session token directly from Better Auth's database collection
            const session = await db.collection("session").findOne({ token: betterAuthSessionToken });

            if (!session || new Date(session.expiresAt) < new Date()) {
                return res.status(401).send({
                    message: "Google auth session expired or invalid"
                });
            }

            // Look up matching user from the users collection
            const userId = mongoose.Types.ObjectId.isValid(session.userId)
                ? new mongoose.Types.ObjectId(session.userId)
                : session.userId;

            const dbUser = await db.collection("users").findOne({ _id: userId });

            if (!dbUser) {
                return res.status(401).send({
                    message: "User profile context matching session not found"
                });
            }

            // Map Better Auth schema variables to fit your manual token object properties (userId, email, role)
            req.user = {
                id: dbUser._id.toString(),
                userId: dbUser._id.toString(),
                email: dbUser.email,
                role: dbUser.role || "user"
            };

            return next();
        }

    } catch (error) {
        console.error("Auth Framework Error:", error);
        return res.status(401).send({
            message: "Internal server verification pipeline failure"
        });
    }
};

module.exports = verifyToken;