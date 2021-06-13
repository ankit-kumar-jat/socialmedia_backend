const { Router } = require("express");
const { isAuthenticated, parseError, deleteImage, getUser } = require("../../utils/helpers");
const Post = require("../../models/post");
const User = require("../../models/user");
const Like = require("../../models/like");
const Comment = require("../../models/comment");
const Follow = require('../../models/follow');
const uuid = require('uuid');
const mongoose = require('mongoose');

const postRouter = Router();



postRouter.post("/create", isAuthenticated, async (req, res) => {
    try {
        const postText = req.body.postText;
        const userId = req.session.user.userId;
        let postImage = null;
        if (!req.files || Object.keys(req.files).length === 0) {
        } else {
            const id = uuid.v4();
            const image = req.files.image;
            const newName = "post-" + id + '.' + image.name.split('.').pop();
            const uploadPath = __dirname + '/../../public/images/post/' + newName;
            postImage = `/images/post/${newName}`;
            await image.mv(uploadPath, function (err) {
                if (err)
                    return res.status(500).send(parseError(err));

            });
        }
        const newPost = new Post({ userId: mongoose.Types.ObjectId(userId), postText, postImage });
        await newPost.save();
        // const user = await User.findById(userId);
        await User.findByIdAndUpdate({ _id: userId }, { $inc: { posts: 1 } })
        res.json({ "success": true, "message": 'Post uploaded' });
    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.post("/update", isAuthenticated, async (req, res) => {
    try {
        const postText = req.body.postText;
        const userId = req.session.user.userId;
        const postId = req.body.postId;
        let postImage = null;
        let updates = null;
        if (!req.files || Object.keys(req.files).length === 0) {
        } else {
            const id = uuid.v4();
            const image = req.files.image;
            const newName = "post-" + id + '.' + image.name.split('.').pop();
            const uploadPath = __dirname + '/../../public/images/post/' + newName;
            postImage = `/images/post/${newName}`;
            image.mv(uploadPath, function (err) {
                if (err)
                    return res.status(500).send(parseError(err));

            });
        }

        if (postImage != null) {
            updates = { postText, postImage };
        } else {
            updates = { postText };
        }
        const post = await Post.findOneAndUpdate({ _id: postId, userId }, updates)
        if (post) {
            deleteImage(post.postImage);
            res.json({ "success": true, "message": 'Post updated' });
        } else {
            throw new Error("Post not found")
        }
    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.delete('/delete', isAuthenticated, async (req, res) => {
    try {
        const postId = req.body.postId;
        const userId = req.session.user.userId;
        const deletedPost = await Post.findByIdAndDelete({ _id: postId, userId })
        // const user = await User.findById(userId);
        await User.findByIdAndUpdate({ _id: userId }, { $inc: { posts: -1 } });
        if (deletedPost) {
            deleteImage(deletedPost.postImage);
            const deletedlikes = await Like.deleteMany({ postId });
            const deletedcomments = await Comment.deleteMany({ postId });
            res.json({ "success": true, "message": 'Post deleted' });
        } else {
            throw new Error("Post not found")
        }
    } catch (err) {
        res.send(parseError(err));
    }
});


postRouter.post("/like", isAuthenticated, async (req, res) => {
    try {
        const postId = req.query.postId;
        const userId = req.session.user.userId;
        const like = await Like.findOne({ postId, userId });
        if (like) {
            const unliked = await Like.findOneAndDelete({ postId, userId });
            if (unliked) {
                await Post.findByIdAndUpdate({ _id: postId }, { $inc: { likes: -1 } });
                res.json({ "success": true, message: "Post unliked", liked: false });
            } else {
                throw new Error("Post or like not found");
            }
        } else {
            const newLike = new Like({ userId, postId });
            await newLike.save();
            await Post.findByIdAndUpdate({ _id: postId }, { $inc: { likes: 1 } });
            res.json({ "success": true, message: "Post liked", liked: true })
        }
    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.get("/like", isAuthenticated, async (req, res) => {
    try {
        const postId = req.query.postId;
        const userId = req.session.user.userId;
        const like = await Like.findOne({ postId, userId });
        if (like) {
            res.json({ "success": true, liked: true, postId: postId, userId: userId });
        } else {
            res.json({ "success": true, liked: false, postId: postId, userId: userId });
        }
    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.post("/comment", isAuthenticated, async (req, res) => {
    try {
        const { postId, value } = req.body;
        const userId = req.session.user.userId;
        const newComment = new Comment({ userId, postId, value });
        const savedComment = await newComment.save();
        await Post.findByIdAndUpdate({ _id: postId }, { $inc: { comments: 1 } });
        res.json({
            "success": true,
            message: "Commented successfully",
            comentId: savedComment._id,
            userId: savedComment.userId,
            value: savedComment.value,
            created_at: savedComment.createdAt
        })
    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.delete("/comment", isAuthenticated, async (req, res) => {
    try {
        const { postId, commentId } = req.body;
        const userId = req.session.user.userId;
        const deletedComment = await Comment.findOneAndDelete({ postId, userId, _id: commentId });
        if (deletedComment) {
            await Post.findByIdAndUpdate({ _id: postId }, { $inc: { comments: -1 } });
            res.json({ "success": true, message: "Comment deleted" });
        } else {
            throw new Error("Comment or like not found");
        }
    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.get("/comment", isAuthenticated, async (req, res) => {
    try {
        const postId = req.body.postId;
        const post = await Post.findById(postId);
        if (post) {
            const comments = await Comment.find({ postId });
            if (comments) {
                var commentsArray = [];
                await comments.forEach((item, index, arr) => {
                    const comment = {
                        "comentId": item._id,
                        "value": item.value,
                        "userId": item.userId,
                        "created_at": item.createdAt,
                        "updated_at": item.updatedAt
                    };
                    commentsArray.push(comment);
                });
                res.json({
                    "success": true,
                    "postId": postId,
                    "comments_count": post.comments,
                    "comments": commentsArray
                });
            } else {
                res.json({ "success": true, "message": "no comments found" })
            }
        } else {
            throw new Error("Post not found");
        }
    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.get("/byid", isAuthenticated, async (req, res) => {
    try {
        if (req.query.postId) {
            const post = await Post.findById(req.query.postId);
            if (post) {
                const user = await User.findById(post.userId);
                res.json({
                    "success": true,
                    "postId": post._id,
                    "postImage": post.postImage,
                    "postText": post.postText,
                    "comments": post.comments,
                    "likes": post.likes,
                    "owner": {
                        "userId": post.userId,
                        "login": user.username,
                        "avatar": user.avatar_url,
                    },
                    "created_at": post.createdAt,
                    "updated_at": post.updatedAt
                });
            } else {
                throw new Error("Post not found")
            }
        } else {
            throw new Error("Please provide postId")
        }
    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.get("/byuname/:username", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (user) {
            const posts = await Post.find({ userId: user._id })
            let postsArray = []
            await posts.forEach((item, index, arr) => {
                const post = {
                    "postId": item._id,
                    "postImage": item.postImage,
                    "postText": item.postText,
                    "comments": item.comments,
                    "likes": item.likes,
                    "created_at": item.createdAt,
                    "updated_at": item.updatedAt
                }
                postsArray.push(post);
            });
            res.json({
                "success": true,
                "login": user.username,
                "userId": user._id,
                "avatar": user.avatar_url,
                "followers": user.followers,
                "following": user.following,
                "posts_count": user.posts,
                "posts": postsArray,
            })
        }
    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.get("/feed", isAuthenticated, async (req, res) => {
    try {
        var limit = 10;
        var page = 1;
        if (req.query.limit) {
            const queryLimit = parseInt(req.query.limit);
            limit = (queryLimit > 0) ? queryLimit : limit;
        }

        if (req.query.page) {
            const queryPage = parseInt(req.query.page);
            page = (queryPage > 0) ? queryPage : page;
        }

        const skip = (page - 1) * limit;

        const following = await Follow.find({ followerId: req.session.user.userId })

        if (following) {
            followingIds = []
            following.forEach(element => {
                followingIds.push(element.userId)
            });
            const posts = await Post.aggregate([
                {
                    $match: { userId: { "$in": followingIds } }
                },
                {
                    "$lookup": {
                        "from": "users",
                        "let": { "userId": "$userId" },
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$eq": ["$_id", "$$userId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    "userId": "$_id",
                                    "login": "$username",
                                    "avatar": "$avatar_url",
                                }
                            },
                            { $project: { _id: 0 } },
                        ],
                        "as": "owner"
                    },
                },
                {
                    $unwind: "$owner"
                },
                {
                    "$lookup": {
                        "from": "comments",
                        "let": { "postId": "$_id" },
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$eq": ["$postId", "$$postId"]
                                    }
                                }
                            },
                            { $sort: { createdAt: -1 } },
                            {
                                $project: {
                                    "commentId": "$_id",
                                    "value": "$value",
                                    "userId": "$userId",
                                    "created_at": "$createdAt"
                                }
                            },
                            { $project: { _id: 0 } },
                        ],
                        "as": "commentslist",
                    }
                },
                {
                    "$project": {
                        "postId": "$_id",
                        "postImage": 1,
                        "postText": 1,
                        "comments": 1,
                        "likes": 1,
                        "commentslist": 1,
                        "owner": 1,
                        "created_at": "$createdAt",
                        "updated_at": "$updatedAt",
                        "_id": 0,
                    }
                },
            ]).sort({ created_at: "descending" }).skip(skip).limit(limit).exec()
            // const total = posts.totalPosts;
            // console.log(posts.totalPosts);
            // const next = (total > (skip + limit)) ? true : false
            // if (skip >= total) {
            //     throw new Error("Page not found");
            // }
            const next = posts.length < 10 ? false : true
            res.json({ success: true, limit: limit, page: page, next: next, posts: posts })

        } else {
            res.json({ success: true, limit: limit, page: page, next: false, posts: [] })
        }



    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.get("/trending", isAuthenticated, async (req, res) => {
    try {
        var limit = 10;
        var page = 1;
        if (req.query.limit) {
            const queryLimit = parseInt(req.query.limit);
            limit = (queryLimit > 0) ? queryLimit : limit;
        }

        if (req.query.page) {
            const queryPage = parseInt(req.query.page);
            page = (queryPage > 0) ? queryPage : page;
        }

        const skip = (page - 1) * limit;
        const total = await Post.countDocuments();
        const next = false
        if (skip >= total) {
            throw new Error("Page not found");
        }
        var d = new Date();
        d.setDate(d.getDate() - 7);
        const posts = await Post.aggregate([
            {
                $match: { '$expr': { $gt: ["$createdAt", d] } }
            },
            {
                "$lookup": {
                    "from": "users",
                    "let": { "userId": "$userId" },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$_id", "$$userId"]
                                }
                            }
                        },
                        {
                            $project: {
                                "userId": "$_id",
                                "login": "$username",
                                "avatar": "$avatar_url",
                            }
                        },
                        { $project: { _id: 0 } },
                    ],
                    "as": "owner"
                },
            },
            {
                $unwind: "$owner"
            },
            {
                "$lookup": {
                    "from": "comments",
                    "let": { "postId": "$_id" },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$postId", "$$postId"]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        {
                            $project: {
                                "commentId": "$_id",
                                "value": "$value",
                                "userId": "$userId",
                                "created_at": "$createdAt"
                            }
                        },
                        { $project: { _id: 0 } },
                    ],
                    "as": "commentslist",
                }
            },
            {
                "$project": {
                    "postId": "$_id",
                    "postImage": 1,
                    "postText": 1,
                    "comments": 1,
                    "likes": 1,
                    "commentslist": 1,
                    "owner": 1,
                    "created_at": "$createdAt",
                    "updated_at": "$updatedAt",
                    "_id": 0,
                }
            },
        ]).sort({ likes: "descending" }).skip(skip).limit(limit).exec()

        res.json({ success: true, limit: limit, page: page, next: next, posts: posts })
    } catch (err) {
        res.send(parseError(err));
    }
});

postRouter.get("/", isAuthenticated, async (req, res) => {
    try {
        var limit = 10;
        var page = 1;
        if (req.query.limit) {
            const queryLimit = parseInt(req.query.limit);
            limit = (queryLimit > 0) ? queryLimit : limit;
        }

        if (req.query.page) {
            const queryPage = parseInt(req.query.page);
            page = (queryPage > 0) ? queryPage : page;
        }

        const skip = (page - 1) * limit;
        const total = await Post.countDocuments();
        const next = (total > (skip + limit)) ? true : false
        if (skip >= total) {
            throw new Error("Page not found");
        }
        const posts = await Post.aggregate([
            {
                "$lookup": {
                    "from": "users",
                    "let": { "userId": "$userId" },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$_id", "$$userId"]
                                }
                            }
                        },
                        {
                            $project: {
                                "userId": "$_id",
                                "login": "$username",
                                "avatar": "$avatar_url",
                            }
                        },
                        { $project: { _id: 0 } },
                    ],
                    "as": "owner"
                },
            },
            {
                $unwind: "$owner"
            },
            {
                "$lookup": {
                    "from": "comments",
                    "let": { "postId": "$_id" },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$postId", "$$postId"]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        {
                            $project: {
                                "commentId": "$_id",
                                "value": "$value",
                                "userId": "$userId",
                                "created_at": "$createdAt"
                            }
                        },
                        { $project: { _id: 0 } },
                    ],
                    "as": "commentslist",
                }
            },
            {
                "$project": {
                    "postId": "$_id",
                    "postImage": 1,
                    "postText": 1,
                    "comments": 1,
                    "likes": 1,
                    "commentslist": 1,
                    "owner": 1,
                    "created_at": "$createdAt",
                    "updated_at": "$updatedAt",
                    "_id": 0,
                }
            },
        ]).sort({ created_at: "descending" }).skip(skip).limit(limit).exec()

        res.json({ success: true, limit: limit, page: page, next: next, posts: posts })
    } catch (err) {
        res.send(parseError(err));
    }
});

module.exports = postRouter;