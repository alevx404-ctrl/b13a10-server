const verifyVendor = (req, res, next) => {
    // Check if the verified user has a vendor role
    if (!req.user || req.user.role !== "vendor") {
        return res.status(403).send({
            message: "Vendor access only"
        });
    }
    next();
};

module.exports = verifyVendor;