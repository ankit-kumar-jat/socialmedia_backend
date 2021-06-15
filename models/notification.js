const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	postId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post",
		required: true
	},
	message: {
		type: String,
		required: true
	},
	created_at: {
		type: Date,
		expires: '7d'
	}
}, { timestamps: true });

notificationSchema.pre("save", function (next) {
	this.created_at = Date.now();
	next();
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;