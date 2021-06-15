const { Router } = require("express");
const { isAuthenticated, parseError, deleteImage } = require("../../utils/helpers");
const User = require("../../models/user");
const Follow = require('../../models/follow');
const uuid = require('uuid');
const Notification = require("../../models/notification");

const userRouter = Router();

userRouter.get("/username/:username", isAuthenticated, async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username });
        if (user) {
            res.json({
                "success": true,
                "login": user.username,
                "email": user.email,
                "userId": user._id,
                "avatar": user.avatar_url,
                "name": user.name,
                "bio": user.bio,
                "website": user.website,
                "location": user.location,
                "posts": user.posts,
                "followers": user.followers,
                "following": user.following,
                "created_at": user.createdAt,
                "updated_at": user.updatedAt
            });
        } else {
            throw new Error("user not found")
        }
    } catch (err) {
        res.status(400).json(parseError(err));
    }
});

userRouter.post("/update-avatar", isAuthenticated, (req, res) => {
    try {

        if (!req.files || Object.keys(req.files).length === 0) {
            throw new Error('No files were uploaded.');
        }

        const image = req.files.image;
        const newName = "profile-" + uuid.v1() + req.session.user.username + '.' + image.name.split('.').pop();
        const uploadPath = __dirname + '/../../public/images/profile/' + newName;

        // Use the mv() method to place the file somewhere on your server
        image.mv(uploadPath, async function (err) {
            if (err)
                return res.status(500).send(parseError(err));

            const oldUser = await User.findOneAndUpdate({ _id: req.session.user.userId }, { avatar_url: `/images/profile/${newName}` });
            if (`/images/profile/${newName}` != oldUser.avatar_url) {
                deleteImage(oldUser.avatar_url);
            }
            res.json({ "success": true, "message": 'File uploaded!' });
        });

    } catch (err) {
        res.json(parseError(err));
    }
});

userRouter.get("/avatar", isAuthenticated, async (req, res) => {
    try {
        const userId = req.query.userId;
        const user = await User.findOne({ _id: userId });
        if (user) {
            res.json({ "success": true, "userId": user._id, "avatar": user.avatar_url, "login": user.username })
        } else {
            throw new Error(`user not found${req.body.userId}`);
        }
    } catch (err) {
        res.send(parseError(err));
    }
});

userRouter.post("/update-profile", isAuthenticated, async (req, res) => {
    try {
        const newProfileValues = {}
        if (req.body.email)
            newProfileValues.email = req.body.email;

        if (req.body.name)
            newProfileValues.name = req.body.name;

        if (req.body.bio)
            newProfileValues.bio = req.body.bio;

        if (req.body.website)
            newProfileValues.website = req.body.website;

        if (req.body.location)
            newProfileValues.location = req.body.location;

        await User.findOneAndUpdate({ _id: req.session.user.userId }, newProfileValues);
        res.json({ "success": true, "message": 'Profile updated!' });
    } catch (err) {
        res.json(parseError(err));
    }
});

userRouter.post("/follow", isAuthenticated, async (req, res) => {
    try {
        const followerId = req.session.user.userId;
        const userId = req.body.userId; //userId is the user who is followed by followerId user
        const follow = await Follow.findOne({ followerId, userId });
        if (follow) {
            const unfollow = await Follow.deleteOne({ followerId, userId });
            if (unfollow) {
                await User.findByIdAndUpdate({ _id: userId }, { $inc: { followers: -1 } });
                await User.findByIdAndUpdate({ _id: followerId }, { $inc: { following: -1 } });
                res.json({ "success": true, "message": 'Unfollowed successfully' });
            }
            else {
                res.json({ "success": true, "message": 'User not found or some other error' });
            }
        }
        else {
            const newFollow = new Follow({ followerId, userId })
            await newFollow.save();
            await User.findByIdAndUpdate({ _id: userId }, { $inc: { followers: 1 } });
            await User.findByIdAndUpdate({ _id: followerId }, { $inc: { following: 1 } });
            res.json({ "success": true, "message": 'Followed successfully' });
        }
    } catch (err) {
        res.json(parseError(err));
    }
});
userRouter.get("/follow", isAuthenticated, async (req, res) => {
    try {
        const followerId = req.session.user.userId;
        const userId = req.query.userId;
        const follow = await Follow.findOne({ followerId, userId });
        if (follow)
            res.json({ "success": true, "follow": true, followerId: follow.followerId, userId: follow.userId });
        else
            res.json({ "success": true, "follow": false });
    } catch (err) {
        res.json(parseError(err));
    }
});


userRouter.get("/notifications", isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const notifications = await Notification.find({ userId });
        if (notifications)
            res.json({ "success": true, notifications: notifications });
        else
            res.json({ "success": true, "message": "No Notifications found" });
    } catch (err) {
        res.json(parseError(err));
    }
});

userRouter.delete("/notifications/:id", isAuthenticated, async (req, res) => {
    try {
        const _id = req.params.id;
        const userId = req.query.userId;
        const notification = await Notification.deleteOne({ userId, _id });
        if (notification)
            res.json({ "success": true, "message": "Notification Deleted" });
        else
            res.json({ "success": true, "message": "Notification not found" });
    } catch (err) {
        res.json(parseError(err));
    }
})

module.exports = userRouter;