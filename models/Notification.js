const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
        conversationId: {
            type: String,
        },
        senderId: {
            type: String,
        },
		senderName: {
            type: String,
        },
        receiverId:{
            type: String
        }
    },
    { timestamps: true}
);

module.exports = mongoose.model("Notification", NotificationSchema);