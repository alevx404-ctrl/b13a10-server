const mongoose = require("mongoose");


const paymentSchema = new mongoose.Schema({

    bookingId:{
        type:String,
        required:true
    },

    userId:{
        type:String,
        required:true
    },


    ticketId:{
        type:String,
        required:true
    },


    transactionId:{
        type:String,
        required:true
    },


    amount:{
        type:Number,
        required:true
    },


    paymentDate:{
        type:Date,
        default:Date.now
    }


},{
    timestamps:true
});


module.exports = mongoose.model("Payment", paymentSchema);