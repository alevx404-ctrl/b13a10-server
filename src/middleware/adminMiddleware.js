const verifyAdmin = (req, res, next) => {
    // Check if the verified user has an admin role
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).send({
            message: "Admin access only"
        });
    }
    next();
};

module.exports = verifyAdmin;