const mongoose = require("mongoose");

console.log("db.js loaded");

const connectDB = async () => {

    console.log("About to connect...");

    try {

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected");

    } catch (error) {

        console.log("Mongo Error:");
        console.log(error);

        process.exit(1);

    }

}

module.exports = connectDB;