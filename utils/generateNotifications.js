const Follow = require('../models/follow');
const Notification = require('../models/notification');

const generateNotifications = async (user, postId) => {
	try {
		const message = `${user.username} uploaded a new post`;
		const followers = await Follow.find({ userId: user.userId });
		followers.forEach((item, index) => {
			const newNotification = new Notification({
				userId: item.followerId,
				postId: postId,
				message: message
			});
			newNotification.save();
		});
	} catch (err) {
		console.log(err)
	}
}

module.exports.generateNotifications = generateNotifications;