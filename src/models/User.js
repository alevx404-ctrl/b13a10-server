const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    image: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ["user", "vendor", "admin"],
        default: "user"
    },
    isFraud: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);