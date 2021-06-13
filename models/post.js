const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    postImage: {
        type: String,
        required: false,
        default: null
    },
    postText: {
        type: String,
        required: true
    },
    comments: {
        type: Number,
        required: false,
        default: 0
    },
    likes: {
        type: Number,
        required: false,
        default: 0
    },
    private: {
        type: Boolean,
        required: false,
        default: false
    }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;